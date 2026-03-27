import React, { useState, useEffect } from "react";
import { RightOutlined, DownOutlined } from "@ant-design/icons";
import axios from "axios";
import tokenList from "../tokens.json";

const TOKEN_GROUPS = [
  {
    label: "Blue Chips",
    addresses: [
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "0x4200000000000000000000000000000000000006",
      "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
    ],
  },
  {
    label: "Stablecoins",
    addresses: [
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
      "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
      "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
      "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34",
      "0x417Ac0e078398C154EdFadD9Ef675d30Be60Af93",
      "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
    ],
  },
  {
    label: "Liquid Staking",
    addresses: [
      "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
      "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452",
    ],
  },
  {
    label: "Base DeFi",
    addresses: [
      "0x63706e401c06ac8513145b7687A14804d17f814b",
      "0xBAa5CC21fd487B8Fcc2F632f3F4E8D37262a0842",
      "0xA88594D404727625A9437C3f886C7643872296AE",
      "0x940181a94A35A4569E4529A3CDfB74e38FD98631",
      "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b",
    ],
  },
  {
    label: "Meme Coins",
    addresses: [
      "0x532f27101965dd16442E59d40670FaF5eBB142E4",
      "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4",
      "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed",
      "0x2Da56AcB9Ea78330f947bD57C54119Debda7AF71",
      "0x0578d8A44db98B23BF096A382e016e29a5Ce0ffe",
      "0x6921B130D297cc43754afba22e5EAc0FBf8Db75b",
      "0x9a26F5433671751C3276a065f57e5a02D2817973",
      "0x7F12d13B34F5F4f0a9449c16Bcd42f0da47AF200",
    ],
  },
  {
    label: "Demo",
    addresses: [
      "0x0000000000000000000000000000000000000001",
    ],
  },
];

function getGroupLabel(address) {
  const lower = address?.toLowerCase();
  for (const group of TOKEN_GROUPS) {
    if (group.addresses.map((a) => a.toLowerCase()).includes(lower)) {
      return group.label;
    }
  }
  return "Other";
}

function severityToColor(risk) {
  if (risk === "highRisk") return "red";
  if (risk === "caution") return "amber";
  return "green";
}

function severityToLabel(risk) {
  if (risk === "highRisk") return "High Risk";
  if (risk === "caution") return "Caution";
  return "Low Risk";
}

function formatNumber(num) {
  if (num === "N/A" || num === undefined) return "N/A";
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num}`;
}

function getTokenImg(token) {
  if (token.logo) return token.logo;
  const match = tokenList.find(
    (t) => t.address.toLowerCase() === token.address?.toLowerCase()
  );
  return match?.img || null;
}

function imgFallback(ev, symbol) {
  ev.target.onerror = null;
  ev.target.src = `https://ui-avatars.com/api/?name=${symbol}&background=1a2044&color=8a8fb5&size=64&font-size=0.4&bold=true`;
}

function Tokens() {
  const [tokens, setTokens] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [detailData, setDetailData] = useState({});

  useEffect(() => {
    async function fetchSummaries() {
      try {
        const addresses = tokenList.map((t) => t.address).join(",");
        const res = await axios.get("http://localhost:3001/tokenSummary", {
          params: { addresses },
        });
        setTokens(res.data);
      } catch (e) {
        console.error("Failed to fetch token summaries:", e);
      }
    }
    fetchSummaries();
  }, []);

  async function toggleExpand(index, address) {
    if (expandedIndex === index) {
      setExpandedIndex(null);
      return;
    }
    setExpandedIndex(index);
    if (!detailData[address]) {
      try {
        const res = await axios.get("http://localhost:3001/tokenRisk", {
          params: { address },
        });
        setDetailData((prev) => ({ ...prev, [address]: res.data }));
      } catch (e) {
        console.error("Failed to fetch risk detail:", e);
      }
    }
  }

  let lastGroup = null;

  return (
    <div className="trackedTokensPage">
      <h2>Tracked Tokens</h2>
      <p className="trackedTokensDisclaimer">
        Token risk classifications are heuristic and advisory only. Results may
        include false positives and do not constitute financial advice.
      </p>

      {tokens.map((token, i) => {
        const group = getGroupLabel(token.address);
        const showHeader = group !== lastGroup;
        lastGroup = group;

        return (
          <div key={i}>
            {showHeader && (
              <h3 className="tokenGroupHeader">{group}</h3>
            )}

            <div
              className={`tokenCard ${expandedIndex === i ? "expanded" : ""}`}
              onClick={() => toggleExpand(i, token.address)}
            >
              <div className="tokenCardLeft">
                <div className="tokenCardHeader">
                  <img
                    src={getTokenImg(token)}
                    alt={token.symbol}
                    className="tokenCardLogo"
                    onError={(ev) => imgFallback(ev, token.symbol)}
                  />
                  <span className={`riskDot ${severityToColor(token.risk)}`}></span>
                  <span className="tokenCardName">{token.name}</span>
                  <span className={`riskBadge ${token.risk}`}>
                    {severityToLabel(token.risk)}
                  </span>
                </div>
                <span className="tokenCardSummary">{token.summary}</span>
              </div>
              <div className="tokenCardArrow">
                {expandedIndex === i ? <DownOutlined /> : <RightOutlined />}
              </div>
            </div>

            {expandedIndex === i && (
              <div className="tokenDetailPanel">
                {detailData[token.address] ? (
                  <>
                    <div className="riskStats">
                      <div className="riskStatItem">
                        <span className="riskStatLabel">Market Cap</span>
                        <span className="riskStatValue">
                          {formatNumber(detailData[token.address].stats.marketCap)}
                        </span>
                      </div>
                      <div className="riskStatItem">
                        <span className="riskStatLabel">Holders</span>
                        <span className="riskStatValue">
                          {detailData[token.address].stats.holders?.toLocaleString?.() ||
                            detailData[token.address].stats.holders}
                        </span>
                      </div>
                      <div className="riskStatItem">
                        <span className="riskStatLabel">Liquidity</span>
                        <span className="riskStatValue">
                          {formatNumber(detailData[token.address].stats.liquidity)}
                        </span>
                      </div>
                      <div className="riskStatItem">
                        <span className="riskStatLabel">1H Volume</span>
                        <span className="riskStatValue">
                          {formatNumber(detailData[token.address].stats.volume1h)}
                        </span>
                      </div>
                    </div>

                    {detailData[token.address].indicators.map((ind, j) => (
                      <div className="riskIndicator" key={j}>
                        <div className="riskIndicatorLeft">
                          <span className={`riskDot ${severityToColor(ind.severity)}`}></span>
                          <span className="riskIndicatorName">{ind.name}</span>
                        </div>
                        <div className="riskIndicatorRight">
                          <span className="riskIndicatorDetail">{ind.detail}</span>
                          <span className={`riskBadge ${ind.severity}`}>
                            {severityToLabel(ind.severity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <p style={{ color: "var(--text-muted)", padding: "16px 0" }}>
                    Loading risk data...
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Tokens;