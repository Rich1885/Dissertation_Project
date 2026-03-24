import React from "react";

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

function RiskPanel({ riskData }) {
  if (!riskData) return null;

  const hasHighRisk = riskData.indicators.some(i => i.severity === "highRisk");
  const hasCaution = riskData.indicators.some(i => i.severity === "caution");

  let statusClass = "safe";
  let statusText = "No high-risk indicators detected";
  if (hasHighRisk) {
    statusClass = "danger";
    statusText = "High-risk indicators detected";
  } else if (hasCaution) {
    statusClass = "caution";
    statusText = "Caution — review indicators below";
  }

  return (
    <div className="riskPanel">
      <div className="riskPanelHeader">
        <span className="riskPanelTitle">TOKEN RISK SUMMARY</span>
        <span className={`riskPanelStatus ${statusClass}`}>● {statusText}</span>
      </div>

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
        <a href="#">View Full Analysis →</a>
      </div>
      <p className="riskDisclaimer">
        Heuristic analysis only; results may include false positives or miss novel
        patterns. Not financial advice. Always conduct independent research before trading.
      </p>
    </div>
  );
}

export default RiskPanel;