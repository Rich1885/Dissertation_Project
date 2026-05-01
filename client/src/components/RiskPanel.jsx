// Token Risk Summary panel shown beside the Swap interface.
// Defaults to collapsed, expanding reveals the six heuristic indicators
// returned by /tokenRisk plus a DexScreener chart modal.

import React, { useState } from "react";
import { Modal } from "antd";
import { DownOutlined, RightOutlined } from "@ant-design/icons";

// ─── Display helpers ──────────────────────────────────────────
function formatNumber(num) {
  if (num === "N/A" || num === undefined) return "N/A";
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num}`;
}

function severityToColor(severity) {
  if (severity === "highRisk") return "red";
  if (severity === "caution") return "amber";
  return "green";
}

function severityToLabel(severity) {
  if (severity === "highRisk") return "High Risk";
  if (severity === "caution") return "Caution";
  return "No Flag";
}

function RiskPanel({ riskData, token }) {
  const [isOpen, setIsOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);

  if (!riskData) return null;

  // Aggregate header status - worst severity across all indicators.
  const hasHighRisk = riskData.indicators.some(i => i.severity === "highRisk");
  const hasCaution = riskData.indicators.some(i => i.severity === "caution");

  let statusClass = "safe";
  let statusText = "No high-risk indicators detected";
  if (hasHighRisk) {
    statusClass = "danger";
    statusText = "High-risk indicators detected";
  } else if (hasCaution) {
    statusClass = "caution";
    statusText = "Caution - review indicators below";
  }

  return (
    <div className="riskPanel">
      <Modal
  open={chartOpen}
  footer={null}
  onCancel={() => setChartOpen(false)}
  title={token ? `${token.ticker} Price Chart` : "Price Chart"}
  width={1500}
  rootClassName="chartModal"
  styles={{ body: { padding: 0, height: "80vh" } }}
>
  {token && (
    <iframe
      src={`https://dexscreener.com/base/${token.address}?embed=1&theme=dark&info=0`}
      style={{
        width: "100%",
        height: "80vh",
        border: "none",
      }}
      title="Token Chart"
    />
  )}
</Modal>

      <div className="riskPanelHeader" style={{ cursor: "pointer" }}>
  <div className="riskPanelTitleRow" onClick={() => setIsOpen(!isOpen)}>
    {token && (
      <img
        src={token.img}
        alt={token.ticker}
        className="riskTokenLogo"
        onError={(ev) => { ev.target.onerror = null; ev.target.src = `https://ui-avatars.com/api/?name=${token.ticker}&background=1a2044&color=8a8fb5&size=64&font-size=0.4&bold=true`; }}
      />
    )}
    <span className="riskPanelTitle">
      {token ? `${token.ticker} RISK SUMMARY` : "TOKEN RISK SUMMARY"}
    </span>
    <span className={`riskPanelStatus ${statusClass}`}>● {statusText}</span>
  </div>
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <a
      href="#"
      className="chartLink"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setChartOpen(true); }}
    >
      Chart
    </a>
    <div className="tokenCardArrow" onClick={() => setIsOpen(!isOpen)}>
      {isOpen ? <DownOutlined /> : <RightOutlined />}
    </div>
  </div>
</div>

      {isOpen && (
        <>
          <div className="riskStats">
            <div className="riskStatItem">
              <span className="riskStatLabel">Market Cap</span>
              <span className="riskStatValue">{formatNumber(riskData.stats.marketCap)}</span>
            </div>
            <div className="riskStatItem">
              <span className="riskStatLabel">Holders</span>
              <span className="riskStatValue">{riskData.stats.holders?.toLocaleString?.() || riskData.stats.holders}</span>
            </div>
            <div className="riskStatItem">
              <span className="riskStatLabel">Liquidity</span>
              <span className="riskStatValue">{formatNumber(riskData.stats.liquidity)}</span>
            </div>
            <div className="riskStatItem">
              <span className="riskStatLabel">1H Volume</span>
              <span className="riskStatValue">{formatNumber(riskData.stats.volume1h)}</span>
            </div>
          </div>

          <div className="riskIndicators">
            <div className="riskIndicatorsTitle">HEURISTIC INDICATORS</div>

            {riskData.indicators.map((indicator, index) => (
              <div className="riskIndicator" key={index}>
                <div className="riskIndicatorLeft">
                  <span className={`riskDot ${severityToColor(indicator.severity)}`}></span>
                  <span className="riskIndicatorName">{indicator.name}</span>
                </div>
                <div className="riskIndicatorRight">
                  <span className="riskIndicatorDetail">{indicator.detail}</span>
                  <span className={`riskBadge ${indicator.severity}`}>
                    {severityToLabel(indicator.severity)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="riskPanelFooter">
            <a href="#" onClick={(e) => { e.preventDefault(); setChartOpen(true);}}>
              View Full Analysis →
            </a>
          </div>
          <p className="riskDisclaimer">
            Heuristic analysis only; results may include false positives or miss novel
            patterns. Not financial advice. Always conduct independent research before trading.
          </p>
        </>
      )}
    </div>
  );
}

export default RiskPanel;