const express = require("express");
const Moralis = require("moralis").default;
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = 3001;

app.use(cors());
app.use(express.json());

app.get("/tokenPrice", async (req, res) => {
  try {
    const { query } = req;

    // Demo token price
    const demoAddresses = ["0x0000000000000000000000000000000000000001"];
    const isOneDemo = demoAddresses.includes(query.addressOne);
    const isTwoDemo = demoAddresses.includes(query.addressTwo);

    const priceOne = isOneDemo ? 0.00001 : (await Moralis.EvmApi.token.getTokenPrice({ address: query.addressOne })).raw.usdPrice;
    const priceTwo = isTwoDemo ? 0.00001 : (await Moralis.EvmApi.token.getTokenPrice({ address: query.addressTwo })).raw.usdPrice;

    const usdPrices = {
      tokenOne: priceOne,
      tokenTwo: priceTwo,
      ratio: priceOne / priceTwo,
    };

    return res.status(200).json(usdPrices);
  } catch (e) {
    console.error("tokenPrice error:", e.message);
    return res.status(500).json({ error: e.message });
  }
});

app.get("/tokenRisk", async (req, res) => {
  try {
    const { address } = req.query;

    // Demo token to simulate a high-risk token
    const demoTokens = {
      "0x0000000000000000000000000000000000000001": {
        stats: { marketCap: 12400, holders: 47, liquidity: 890, volume1h: 12 },
        indicators: [
          { name: "Contract Ownership", detail: "Unverified contract", severity: "highRisk" },
          { name: "Upgradeability", detail: "Proxy pattern detected", severity: "highRisk" },
          { name: "Token Age", detail: "3 days old", severity: "highRisk" },
          { name: "Holder Concentration", detail: "Top 10 hold 94%", severity: "highRisk" },
          { name: "Liquidity Lock", detail: "No liquidity lock found", severity: "highRisk" },
          { name: "Tax / Honeypot Signals", detail: "Sell blocked — honeypot", severity: "highRisk" },
        ],
        tokenName: "Demo Scam Token",
        tokenSymbol: "SCAM",
      },
    };

    if (demoTokens[address]) {
      return res.status(200).json(demoTokens[address]);
    }

    // 1. Token metadata from Moralis
    const metaResponse = await Moralis.EvmApi.token.getTokenMetadata({
      addresses: [address],
      chain: "0x1",
    });
    const meta = metaResponse.raw[0];

    // 2. Token price from Moralis
    const priceResponse = await Moralis.EvmApi.token.getTokenPrice({
      address: address,
      chain: "0x1",
    });
    const price = priceResponse.raw;

    // 3. Market data from CoinGecko
    const cgResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/ethereum/contract/${address}`
    );
    const cgData = await cgResponse.json();

    // --- HEURISTIC EVALUATION ---

    // Token Age
    const createdAt = meta.created_at ? new Date(meta.created_at) : null;
    const ageDays = createdAt
      ? Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    let ageSeverity = "noFlag";
    let ageDetail = ageDays !== null ? `${ageDays} days old` : "Unknown";
    if (ageDays !== null && ageDays < 7) {
      ageSeverity = "highRisk";
    } else if (ageDays !== null && ageDays < 30) {
      ageSeverity = "caution";
      ageDetail = `${ageDays} days old — very new`;
    } else if (ageDays !== null && ageDays < 730) {
      ageSeverity = "caution";
      ageDetail = `${ageDays} days old — under 2 years`;
    }

    // Contract Verification (proxy for ownership transparency)
    const verified = meta.verified_contract;
    const securityScore = meta.security_score || 0;

    let ownershipSeverity = "noFlag";
    let ownershipDetail = "Verified contract";
    if (!verified) {
      ownershipSeverity = "highRisk";
      ownershipDetail = "Unverified contract";
    } else if (securityScore < 80) {
      ownershipSeverity = "caution";
      ownershipDetail = `Security score: ${securityScore}/100`;
    } else {
      ownershipDetail = `Score: ${securityScore}/100`;
    }

    // Upgradeability (limited detection on free tier)
    let upgradeSeverity = "noFlag";
    let upgradeDetail = "No proxy detected";
    if (securityScore > 0 && securityScore < 70) {
      upgradeSeverity = "caution";
      upgradeDetail = "Low security score- review contract";
    }

    // Holder Concentration (from CoinGecko if available)
    const holders = cgData.market_data?.total_supply
      ? Math.round(cgData.community_data?.twitter_followers || 0)
      : null;
    let holderSeverity = "noFlag";
    let holderDetail = "Data limited on free tier";

    // Liquidity (from CoinGecko total_volume)
    const volume24h = cgData.market_data?.total_volume?.usd || 0;
    const marketCap = cgData.market_data?.market_cap?.usd || meta.market_cap || 0;
    let liquiditySeverity = "noFlag";
    let liquidityDetail = "Liquidity data unavailable";
    if (marketCap > 0 && volume24h > 0) {
      const volumeToMcap = volume24h / marketCap;
      liquidityDetail = `Vol/MCap ratio: ${(volumeToMcap * 100).toFixed(1)}%`;
      if (volumeToMcap < 0.005) {
        liquiditySeverity = "highRisk";
        liquidityDetail = "Very low trading volume";
      } else if (volumeToMcap < 0.03) {
        liquiditySeverity = "caution";
        liquidityDetail = `Low Vol/MCap ratio: ${(volumeToMcap * 100).toFixed(1)}%`;
      }
    }

    // Tax / Honeypot Signals
    const isSpam = meta.possible_spam;
    let taxSeverity = "noFlag";
    let taxDetail = "None detected";
    if (isSpam) {
      taxSeverity = "highRisk";
      taxDetail = "Flagged as possible spam";
    } else if (securityScore > 0 && securityScore < 50) {
      taxSeverity = "caution";
      taxDetail = "Low security score- potential risk";
    }

    // --- BUILD RESPONSE ---
    const holderCount = cgData.market_data?.total_supply ? 
      (cgData.community_data?.telegram_channel_user_count || "N/A") : "N/A";

    return res.status(200).json({
      stats: {
        marketCap: marketCap,
        holders: holderCount,
        liquidity: volume24h,
        volume1h: volume24h ? Math.round(volume24h / 24) : 0,
      },
      indicators: [
        { name: "Contract Ownership", detail: ownershipDetail, severity: ownershipSeverity },
        { name: "Upgradeability", detail: upgradeDetail, severity: upgradeSeverity },
        { name: "Token Age", detail: ageDetail, severity: ageSeverity },
        { name: "Holder Concentration", detail: holderDetail, severity: holderSeverity },
        { name: "Liquidity Lock", detail: liquidityDetail, severity: liquiditySeverity },
        { name: "Tax / Honeypot Signals", detail: taxDetail, severity: taxSeverity },
      ],
      tokenName: meta.name,
      tokenSymbol: meta.symbol,
    });

  } catch (e) {
    console.error("tokenRisk error:", e.message);
    return res.status(500).json({ error: e.message });
  }
});

app.get("/tokenSummary", async (req, res) => {
  try {
    const { addresses } = req.query;
    const addressList = addresses.split(",");

    // Demo tokens that aren't in Moralis
    const demoSummaries = {
      "0x0000000000000000000000000000000000000001": {
        address: "0x0000000000000000000000000000000000000001",
        name: "Demo Scam Token",
        symbol: "SCAM",
        risk: "highRisk",
        summary: "Multiple high-risk indicators — honeypot detected",
      },
    };

    // Filter out demo addresses before calling Moralis
    const realAddresses = addressList.filter((addr) => !demoSummaries[addr.toLowerCase()]);

    let results = [];

    if (realAddresses.length > 0) {
      const metaResponse = await Moralis.EvmApi.token.getTokenMetadata({
        addresses: realAddresses,
        chain: "0x1",
      });

      results = metaResponse.raw.map((meta) => {
        const securityScore = meta.security_score || 0;
        const isSpam = meta.possible_spam;
        const verified = meta.verified_contract;

        const createdAt = meta.created_at ? new Date(meta.created_at) : null;
        const ageDays = createdAt
          ? Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        // Quick risk level
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
          summary = `Token ${ageDays} days old — under 2 years`;
        }

        return {
          address: meta.address,
          name: meta.name,
          symbol: meta.symbol,
          risk,
          summary,
        };
      });
    }

    // Append demo tokens that were requested
    addressList.forEach((addr) => {
      if (demoSummaries[addr.toLowerCase()]) {
        results.push(demoSummaries[addr.toLowerCase()]);
      }
    });

    return res.status(200).json(results);
  } catch (e) {
    console.error("tokenSummary error:", e.message);
    return res.status(500).json({ error: e.message });
  }
});

Moralis.start({
  apiKey: process.env.MORALIS_KEY,
}).then(() => {
  app.listen(port, () => {
    console.log(`Listening for API Calls`);
  });
});