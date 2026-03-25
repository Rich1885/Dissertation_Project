import React from "react";
import Eth from "../assets/eth.svg";
import { Link, useLocation } from "react-router-dom";

function Header() {
  const location = useLocation();

  return (
    <header>
      <div className="leftH">
        <Link to="/" className="link">
          <span className="brandName">SentinelDEX</span>
        </Link>
        <span className="navSeparator">/</span>
        <Link to="/swap" className="link">
          <div className={`headerItem ${location.pathname === "/swap" ? "active" : ""}`}>
            Swap
          </div>
        </Link>
        <span className="navSeparator">/</span>
        <Link to="/tokens" className="link">
          <div className={`headerItem ${location.pathname === "/tokens" ? "active" : ""}`}>
            Tokens
          </div>
        </Link>
      </div>
      <div className="rightH">
        <div className="ethBadge">
          <img src={Eth} alt="eth" className="eth" />
          Base
        </div>
        <appkit-button />
      </div>
    </header>
  );
}

export default Header;