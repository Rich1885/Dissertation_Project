import React, { useState, useEffect } from "react";
import { RightOutlined, DownOutlined } from "@ant-design/icons";
import axios from "axios";
import tokenList from "../tokens.json";

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
  // Try Moralis logo from API, then fallback to tokens.json img
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

  return (
    <div className="trackedTokensPage">
      <h2>Tracked Tokens</h2>
      <p className="trackedTokensDisclaimer">
        Token risk classifications are heuristic and advisory only. Results may
        include false positives and do not constitute financial advice.
      </p>

      {tokens.map((token, i) => (
        <div key={i}>
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
      ))}
    </div>
  );
}

export default Tokens;