import React from "react";
import { Link } from "react-router-dom";

function DocsPage() {
  return (
    <div className="landingPage">

      <div className="heroSection" style={{ paddingBottom: "40px" }}>
        <div className="heroBadge">USER GUIDE</div>
        <h1 className="heroTitle">
          How to Use <span>SentinelDEX</span>
        </h1>
        <p className="heroSubtitle">
          A step-by-step guide to connecting your wallet, swapping tokens on
          Base, and understanding the risk scanner.
        </p>
      </div>

      <div className="featuresSection" style={{ textAlign: "left" }}>

        <h3 style={{ textAlign: "center" }}>Getting Started</h3>
        <p className="featuresIntro">
          SentinelDEX runs on the <strong>Base</strong> network — a fast,
          low-cost Ethereum Layer 2 built by Coinbase. You will need a browser
          wallet like MetaMask and a small amount of ETH on Base to cover
          transaction fees.
        </p>

        <div className="featuresGrid">
          <div className="featureCard">
            <div className="featureIcon">1</div>
            <h4>Install MetaMask</h4>
            <p>
              Download MetaMask from{" "}
              <a
                href="https://metamask.io"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent-purple)" }}
              >
                metamask.io
              </a>{" "}
              and create a wallet. Write down your recovery phrase and store it
              somewhere safe — never share it with anyone.
            </p>
          </div>

          <div className="featureCard">
            <div className="featureIcon">2</div>
            <h4>Switch to Base Network</h4>
            <p>
              When you click <strong>Connect Wallet</strong> in SentinelDEX,
              the app will prompt you to switch to Base automatically. You can
              also add Base manually in MetaMask under Settings → Networks →
              Add Network (Chain ID: 8453).
            </p>
          </div>

          <div className="featureCard">
            <div className="featureIcon">3</div>
            <h4>Fund Your Wallet</h4>
            <p>
              You need ETH on Base to pay for gas fees. You can bridge ETH from
              Ethereum mainnet using the{" "}
              <a
                href="https://bridge.base.org"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent-purple)" }}
              >
                official Base Bridge
              </a>
              , or buy ETH directly on Coinbase and withdraw to Base.
            </p>
          </div>
        </div>

        <h3 style={{ textAlign: "center", marginTop: "48px" }}>
          Making a Swap
        </h3>

        <div className="featuresGrid">
          <div className="featureCard">
            <div className="featureIcon">4</div>
            <h4>Connect Your Wallet</h4>
            <p>
              Click the <strong>Connect Wallet</strong> button in the top
              right. A modal will appear where you can select MetaMask,
              WalletConnect, or Coinbase Wallet. Once connected, your address
              and token balances will appear in the swap interface.
            </p>
          </div>

          <div className="featureCard">
            <div className="featureIcon">5</div>
            <h4>Select Tokens &amp; Enter Amount</h4>
            <p>
              In the <strong>Sell</strong> field, pick the token you want to
              sell and type an amount. The <strong>Buy</strong> field
              automatically calculates how much you will receive. Prices are
              fetched in real-time via the <strong>Moralis API</strong>.
            </p>
          </div>

          <div className="featureCard">
            <div className="featureIcon">6</div>
            <h4>Review Risk &amp; Swap</h4>
            <p>
              Before swapping, check the <strong>Risk Summary</strong> panel
              below the swap box. It shows heuristic risk indicators for the
              buy token. When ready, click <strong>Swap</strong> — your wallet
              will ask you to approve the token spend, then confirm the trade.
            </p>
          </div>
        </div>

        <h3 style={{ textAlign: "center", marginTop: "48px" }}>
          Understanding the Risk Scanner
        </h3>
        <p className="featuresIntro">
          The risk scanner runs automatically when you select a buy token. It
          checks six indicators and shows a severity level for each:{" "}
          <strong style={{ color: "var(--risk-green)" }}>No Flag</strong>,{" "}
          <strong style={{ color: "var(--risk-amber)" }}>Caution</strong>, or{" "}
          <strong style={{ color: "var(--risk-red)" }}>High Risk</strong>.
        </p>

        <div className="featuresGrid">
          <div className="featureCard">
            <div className="featureIcon">🔍</div>
            <h4>Contract Ownership</h4>
            <p>
              Checks whether the contract is verified and its security score
              from <strong>Moralis</strong>. Unverified contracts are flagged
              as high risk.
            </p>
          </div>

          <div className="featureCard">
            <div className="featureIcon">🔄</div>
            <h4>Upgradeability</h4>
            <p>
              Evaluates the likelihood of a proxy pattern using the security
              score. Low scores suggest the contract may be upgradeable by the
              owner.
            </p>
          </div>

          <div className="featureCard">
            <div className="featureIcon">📅</div>
            <h4>Token Age</h4>
            <p>
              Calculated from the contract deployment date via{" "}
              <strong>Moralis</strong>. Tokens under 7 days old are high risk;
              under 2 years receive a caution.
            </p>
          </div>

          <div className="featureCard">
            <div className="featureIcon">👥</div>
            <h4>Holder Concentration</h4>
            <p>
              Checks whether a small number of wallets hold most of the
              supply. Currently limited on the free API tier and shown as a
              data-availability note.
            </p>
          </div>

          <div className="featureCard">
            <div className="featureIcon">💧</div>
            <h4>Liquidity Lock</h4>
            <p>
              Approximated using the 24h volume-to-market-cap ratio from{" "}
              <strong>CoinGecko</strong>. Very low ratios suggest the token
              may be illiquid or have locked/removed liquidity.
            </p>
          </div>

          <div className="featureCard">
            <div className="featureIcon">⚠️</div>
            <h4>Tax / Honeypot Signals</h4>
            <p>
              Uses Moralis's spam detection flag and security score. Tokens
              flagged as possible spam or with very low scores may contain
              hidden sell restrictions.
            </p>
          </div>
        </div>

        <h3 style={{ textAlign: "center", marginTop: "48px" }}>
          How It Works Under the Hood
        </h3>
        <p className="featuresIntro">
          SentinelDEX is a React frontend talking to a Node.js/Express backend
          that proxies requests to three external services. No API keys are
          ever exposed to the browser. The full source code is available on{" "}
          <a
            href="https://github.com/Rich1885/Dissertation_Project"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent-purple)" }}
          >
            GitHub
          </a>
          .
        </p>

        <div className="featuresGrid">
          <div className="featureCard">
            <div className="featureIcon">⚡</div>
            <h4>Moralis API</h4>
            <p>
              Provides token metadata (name, symbol, decimals, security score,
              spam flag, deployment date), token prices in USD, and logo
              images. Used for both the swap interface and the risk scanner.
            </p>
          </div>

          <div className="featureCard">
            <div className="featureIcon">📊</div>
            <h4>CoinGecko API</h4>
            <p>
              Supplies market data including market capitalisation, 24-hour
              trading volume, and community statistics. Used by the risk
              scanner to compute the volume-to-market-cap ratio for liquidity
              assessment.
            </p>
          </div>

          <div className="featureCard">
            <div className="featureIcon">🔀</div>
            <h4>0x Swap API</h4>
            <p>
              Handles swap routing across multiple DEX liquidity sources on
              Base (Aerodrome, Uniswap V4, etc.). Finds the best price and
              returns executable transaction data that gets submitted through
              your wallet.
            </p>
          </div>
        </div>

        <h3 style={{ textAlign: "center", marginTop: "48px" }}>
          Running Locally
        </h3>
        <p className="featuresIntro">
          SentinelDEX requires <strong>Node.js v18+</strong> and API keys for
          Moralis and 0x. Clone the repository, create a <code>.env</code> file
          in the <code>server/</code> folder with your keys, then run{" "}
          <code>npm install</code> and <code>node index.js</code> in the server
          folder and <code>npm install</code> and <code>npm run dev</code> in
          the client folder. Full setup instructions are in the{" "}
          <a
            href="https://github.com/Rich1885/Dissertation_Project"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent-purple)" }}
          >
            README
          </a>
          .
        </p>

      </div>

      <div className="landingFooter">
        <span className="brandName">SentinelDEX</span>
        <p className="footerDisclaimer">
          Risk analysis is heuristic and advisory only. Results may include
          false positives or miss novel patterns. Not financial advice.
        </p>
      </div>
    </div>
  );
}

export default DocsPage;