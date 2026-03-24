import React from "react";
import { Link } from "react-router-dom";

function LandingPage() {
    return (
        <div className="landingPage">

            <header>
                <div className="leftH">
                    <span className="brandName">SentinelDEX</span>
                </div>
                <div className="rightH">
                    <span className="headerItem">Docs</span>
                    <Link to="/swap" className="link">
                        <div className="connectButton">Launch App</div>
                    </Link>
                </div>
            </header>

            <div className="heroSection">
                <div className="heroBadge">
                    CROSS-CHAIN DEFI · HEURISTIC RISK INTELLIGENCE
                </div>

                <h1 className="heroTitle">
                    Trade Across Chains <span>With Built-In Risk Intelligence</span>
                </h1>

                <p className="heroSubtitle">
                    A cross-chain DEX aggregator integrating real-time heuristic token risk analysis directly into the swap workflow - so you can route and review risk without leaving the trade interface.
                </p>

                <div className="heroCTAs">
                    <button className="btnOutline">How It Works</button>
                    <Link to="/swap">
                        <button className="btnPrimary">Launch App</button>
                    </Link>
                </div>

                <p className="heroDisclaimer">
                    Heuristic risk signals are advisory only and may be inaccurate. Not financial advice.
                    Always conduct independent research before trading.
                </p>
            </div>

            <div className="featuresSection">
                <h3>Why This Matters</h3>
                <p className="featuresIntro">
                    <strong>Decentralised finance suffers from fragmented liquidity and widespread token-level fraud.</strong> This system addresses both simultaneously - optimising execution across chains while surfacing interpretable, advisory risk signals at the exact moment a trade decision is made.
                </p>

                <div className="featuresGrid">
                    <div className="featureCard">
                        <div className="featureIcon"></div>
                        <h4>Smart Cross-Chain Routing</h4>
                        <p>
                            Optimised trade execution using aggregated liquidity sources across multiple chains and AMM pools, reducing slippage and price impact for retail-sized trades.
                        </p>
                    </div>

                    <div className="featureCard">
                        <div className="featureIcon"></div>
                        <h4>Real-Time Token Risk Scanner</h4>
                        <p>
                            Heuristic evaluation of ownership privileges, liquidity lock status, holder concentration, and contract age — surfaced at the point of trade with sub-300 ms latency.
                        </p>
                    </div>

                    <div className="featureCard">
                        <div className="featureIcon"></div>
                        <h4>Explainable Advisory Warnings</h4>
                        <p>
                            Clear, non-deterministic indicators designed using usable-security research principles to support informed decision-making, without removing user agency or implying guaranteed outcomes.
                        </p>
                    </div>
                </div>
            </div>

            <div className="landingFooter">
                <span className="brandName">SentinelDEX</span>
                <p className="footerDisclaimer">
                    Risk analysis is heuristic and advisory only. Results may include false positives or miss novel patterns. Not financial advice.
                </p>
            </div>
        </div>
    );
}

export default LandingPage;