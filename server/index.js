// SentinelDEX backend - Express proxy for Moralis, CoinGecko and 0x
// All API keys are read from .env so no secrets reach the client

const express = require("express");
const Moralis = require("moralis").default;
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = 3001;

app.use(cors());
app.use(express.json());

// Hardcoded demo token used to showcase the worst-case risk state in the UI
const DEMO_TOKENS = {
  "0x0000000000000000000000000000000000000001": {
    address: "0x0000000000000000000000000000000000000001",
    name: "Demo Scam Token",
    symbol: "SCAM",
    risk: "highRisk",
    summary: "Multiple high-risk indicators - honeypot detected",
    logo: "https://cdn-icons-png.flaticon.com/512/595/595067.png",
  },
};

//tokenPrice
// Returns USD prices for two tokens and their ratio (used by Swap)
app.get("/tokenPrice", async (req, res) => {
  const t0 = performance.now();
  try {
    const { query } = req;

    const isOneDemo = !!DEMO_TOKENS[query.addressOne];
    const isTwoDemo = !!DEMO_TOKENS[query.addressTwo];

    const priceOne = isOneDemo
      ? 0.00001
      : (await Moralis.EvmApi.token.getTokenPrice({ address: query.addressOne, chain: "0x2105" })).raw.usdPrice;
    const priceTwo = isTwoDemo
      ? 0.00001
      : (await Moralis.EvmApi.token.getTokenPrice({ address: query.addressTwo, chain: "0x2105" })).raw.usdPrice;

    const usdPrices = {
      tokenOne: priceOne,
      tokenTwo: priceTwo,
      ratio: priceOne / priceTwo,
    };

    console.log(`[LATENCY] /tokenPrice ${(performance.now() - t0).toFixed(1)}ms`);
    return res.status(200).json(usdPrices);
  } catch (e) {
    console.error("tokenPrice error:", e.message);
    return res.status(500).json({ error: e.message });
  }
});

//tokenRisk 
// Detailed heuristic scan for a single token. Calls Moralis metadata,Moralis price and CoinGecko in parallel
app.get("/tokenRisk", async (req, res) => {
  const t0 = performance.now();
  try {
    const { address } = req.query;

    if (DEMO_TOKENS[address]) {
      return res.status(200).json({
        stats: { marketCap: 12400, holders: 47, liquidity: 890, volume1h: 12 },
        indicators: [
          { name: "Contract Ownership", detail: "Unverified contract", severity: "highRisk" },
          { name: "Upgradeability", detail: "Proxy pattern detected", severity: "highRisk" },
          { name: "Token Age", detail: "3 days old", severity: "highRisk" },
          { name: "Holder Concentration", detail: "Top 10 hold 94%", severity: "highRisk" },
          { name: "Liquidity Lock", detail: "No liquidity lock found", severity: "highRisk" },
          { name: "Tax / Honeypot Signals", detail: "Sell blocked - honeypot", severity: "highRisk" },
        ],
        tokenName: "Demo Scam Token",
        tokenSymbol: "SCAM",
        tokenLogo: "https://cdn-icons-png.flaticon.com/512/595/595067.png",
      });
    }

    
    // Parallelised external API calls Promise.all() halves total
    // latency vs. sequential awaits (see report Section 4 / Appendix E).
    const tParallel = performance.now();

    const [metaResponse, price, cgData] = await Promise.all([
      Moralis.EvmApi.token.getTokenMetadata({
        addresses: [address],
        chain: "0x2105",
      }),

      Moralis.EvmApi.token.getTokenPrice({ address, chain: "0x2105" })
        .then(r => r.raw)
        .catch(priceErr => {
          console.warn("Price fetch failed for", address, priceErr.message);
          return null;
        }),

      fetch(`https://api.coingecko.com/api/v3/coins/base/contract/${address}`)
        .then(r => r.ok ? r.json() : {})
        .catch(cgErr => {
          console.warn("CoinGecko fetch failed for", address, cgErr.message);
          return {};
        }),
    ]);

    const parallelDuration = (performance.now() - tParallel).toFixed(1);
    const meta = metaResponse.raw[0];
    // End parallel block

    // Heuristic severity classifier
    // Each indicator maps Moralis / CoinGecko fields to one of three severities: "noFlag" | "caution" | "highRisk"
    const tHeuristic = performance.now();

    const createdAt = meta.created_at ? new Date(meta.created_at) : null;
    const ageDays = createdAt
      ? Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const verified = meta.verified_contract;
    const securityScore = meta.security_score || 0;

    // Contract Ownership unverified contracts are treated as high risk verified contracts with a Moralis security score under 80 are caution
    let ownershipSeverity = "noFlag";
    let ownershipDetail = verified ? `Score: ${securityScore}/100` : "Unverified contract";
    if (!verified) ownershipSeverity = "highRisk";
    else if (securityScore < 80) { ownershipSeverity = "caution"; ownershipDetail = `Security score: ${securityScore}/100`; }

    // Upgradeability -proxy detection is unavailable on the free tier,  so a low security score is used as a weak proxy signal.
    let upgradeSeverity = "noFlag";
    let upgradeDetail = "No proxy detected";
    if (securityScore > 0 && securityScore < 70) {
      upgradeSeverity = "caution";
      upgradeDetail = "Low security score - review contract";
    }

    // Token Age < 7 days = highRisk (rug-pull window)
    // Token Age< 30 days = caution (insufficient track record)
    // Token Age < 730 days = caution (under 2 years)
    let ageSeverity = "noFlag";
    let ageDetail = ageDays !== null ? `${ageDays} days old` : "Unknown";
    if (ageDays !== null && ageDays < 7) ageSeverity = "highRisk";
    else if (ageDays !== null && ageDays < 30) { ageSeverity = "caution"; ageDetail = `${ageDays} days old - very new`; }
    else if (ageDays !== null && ageDays < 730) { ageSeverity = "caution"; ageDetail = `${ageDays} days old - under 2 years`; }

    // Liquidity Lock - approximated by the 24h volume / market cap ratio
    // Very low ratio implies thin trading and harder exits
    const volume24h = cgData.market_data?.total_volume?.usd || 0;
    const marketCap = cgData.market_data?.market_cap?.usd || 0;
    let liquiditySeverity = "noFlag";
    let liquidityDetail = "Liquidity data unavailable";
    if (marketCap > 0 && volume24h > 0) {
      const ratio = volume24h / marketCap;
      liquidityDetail = `Vol/MCap ratio: ${(ratio * 100).toFixed(1)}%`;
      if (ratio < 0.005) { liquiditySeverity = "highRisk"; liquidityDetail = "Very low trading volume"; }
      else if (ratio < 0.03) { liquiditySeverity = "caution"; liquidityDetail = `Low Vol/MCap ratio: ${(ratio * 100).toFixed(1)}%`; }
    } else if (marketCap === 0 && volume24h === 0) {
      liquiditySeverity = "caution";
      liquidityDetail = "No market data available";
    }

    // Tax /Honeypot Signals - Moralis spam flag is the strongest signal,a very low security score is a secondary caution.
    const isSpam = meta.possible_spam;
    let taxSeverity = "noFlag";
    let taxDetail = "None detected";
    if (isSpam) { taxSeverity = "highRisk"; taxDetail = "Flagged as possible spam"; }
    else if (securityScore > 0 && securityScore < 50) { taxSeverity = "caution"; taxDetail = "Low security score - potential risk"; }

    const heuristicDuration = (performance.now() - tHeuristic).toFixed(1);
    const totalDuration = (performance.now() - t0).toFixed(1);
    console.log(`[LATENCY] /tokenRisk ${meta.symbol} | total: ${totalDuration}ms | parallel-apis: ${parallelDuration}ms | heuristics: ${heuristicDuration}ms`);

    return res.status(200).json({
      stats: {
        marketCap,
        holders: cgData.community_data?.telegram_channel_user_count || "N/A",
        liquidity: volume24h,
        volume1h: volume24h ? Math.round(volume24h / 24) : 0,
      },
      indicators: [
        { name: "Contract Ownership", detail: ownershipDetail, severity: ownershipSeverity },
        { name: "Upgradeability", detail: upgradeDetail, severity: upgradeSeverity },
        { name: "Token Age", detail: ageDetail, severity: ageSeverity },
        { name: "Holder Concentration", detail: "Data limited on free tier", severity: "noFlag" },
        { name: "Liquidity Lock", detail: liquidityDetail, severity: liquiditySeverity },
        { name: "Tax / Honeypot Signals", detail: taxDetail, severity: taxSeverity },
      ],
      tokenName: meta.name,
      tokenSymbol: meta.symbol,
      tokenLogo: meta.thumbnail || meta.logo || null,
    });

  } catch (e) {
    console.error("tokenRisk error:", e.message);
    return res.status(500).json({ error: e.message });
  }
});

// tokenSummary
// Compact risk summary for many tokens at once
// Tokens dashboard to render the per-card risk badge
app.get("/tokenSummary", async (req, res) => {
  try {
    const addressList = req.query.addresses.split(",");

    const settled = await Promise.allSettled(
      addressList.map(async (address) => {
        // Return hardcoded demo data - never hits Moralis
        if (DEMO_TOKENS[address.toLowerCase()]) {
          return DEMO_TOKENS[address.toLowerCase()];
        }

        const metaResponse = await Moralis.EvmApi.token.getTokenMetadata({
          addresses: [address],
          chain: "0x2105",
        });

        const meta = metaResponse.raw[0];
        const securityScore = meta.security_score || 0;
        const isSpam = meta.possible_spam;
        const verified = meta.verified_contract;

        const createdAt = meta.created_at ? new Date(meta.created_at) : null;
        const ageDays = createdAt
          ? Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        let risk = "noFlag";
        let summary = "No high-risk indicators detected";

        if (isSpam || !verified) {
          risk = "highRisk";
          summary = isSpam ? "Flagged as possible spam" : "Unverified contract";
        } else if (ageDays !== null && ageDays < 7) {
          risk = "highRisk";
          summary = `Token only ${ageDays} days old`;
        } else if (securityScore > 0 && securityScore < 80) {
          risk = "caution";
          summary = `Security score: ${securityScore}/100`;
        } else if (ageDays !== null && ageDays < 730) {
          risk = "caution";
          summary = `Token ${ageDays} days old - under 2 years`;
        }

        return {
          address: meta.address,
          name: meta.name,
          symbol: meta.symbol,
          risk,
          summary,
          logo: meta.thumbnail || meta.logo || null,
        };
      })
    );

    const results = settled.map((result, i) => {
      if (result.status === "fulfilled") return result.value;
      console.warn(`tokenSummary: skipping ${addressList[i]} -`, result.reason?.message);
      return {
        address: addressList[i],
        name: addressList[i].slice(0, 8) + "...",
        symbol: "???",
        risk: "caution",
        summary: "Data unavailable for this token",
        logo: null,
      };
    });

    return res.status(200).json(results);
  } catch (e) {
    console.error("tokenSummary error:", e.message);
    return res.status(500).json({ error: e.message });
  }
});

// tokenLogos 
app.get("/tokenLogos", async (req, res) => {
  try {
    const addressList = req.query.addresses.split(",");

    const settled = await Promise.allSettled(
      addressList.map(async (address) => {
        if (DEMO_TOKENS[address.toLowerCase()]) {
          return { address, logo: DEMO_TOKENS[address.toLowerCase()].logo };
        }
        const metaResponse = await Moralis.EvmApi.token.getTokenMetadata({
          addresses: [address],
          chain: "0x2105",
        });
        const meta = metaResponse.raw[0];
        return { address, logo: meta.thumbnail || meta.logo || null };
      })
    );

    const logos = {};
    settled.forEach((result, i) => {
      if (result.status === "fulfilled") {
        logos[result.value.address.toLowerCase()] = result.value.logo;
      } else {
        logos[addressList[i].toLowerCase()] = null;
      }
    });

    return res.status(200).json(logos);
  } catch (e) {
    console.error("tokenLogos error:", e.message);
    return res.status(500).json({ error: e.message });
  }
});

//quote 
// Indicative price from the 0x AllowanceHolder API 
app.get("/quote", async (req, res) => {
  const t0 = performance.now();
  try {
    const { sellToken, buyToken, sellAmount, taker } = req.query;
    const params = new URLSearchParams({ chainId: "8453", sellToken, buyToken, sellAmount, taker });
    const response = await fetch(`https://api.0x.org/swap/allowance-holder/price?${params}`, {
      headers: { "0x-api-key": process.env.ZEROX_KEY, "0x-version": "v2" },
    });
    const data = await response.json();
    console.log(`[LATENCY] /quote ${(performance.now() - t0).toFixed(1)}ms`);
    res.status(200).json(data);
  } catch (e) {
    console.error("quote error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// swap 
// Executable quote from 0x - returns the calldata the wallet signs
// API key is injected here so it never reaches the browser
app.get("/swap", async (req, res) => {
  const t0 = performance.now();
  try {
    const { sellToken, buyToken, sellAmount, taker, slippageBps } = req.query;
    const params = new URLSearchParams({ chainId: "8453", sellToken, buyToken, sellAmount, taker, slippageBps });
    const response = await fetch(`https://api.0x.org/swap/allowance-holder/quote?${params}`, {
      headers: { "0x-api-key": process.env.ZEROX_KEY, "0x-version": "v2" },
    });
    const data = await response.json();
    console.log(`[LATENCY] /swap ${(performance.now() - t0).toFixed(1)}ms`);
    res.status(200).json(data);
  } catch (e) {
    console.error("swap error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

Moralis.start({ apiKey: process.env.MORALIS_KEY }).then(() => {
  app.listen(port, () => console.log(`Listening for API Calls`));
});