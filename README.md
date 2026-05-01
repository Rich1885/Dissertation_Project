# SentinelDEX

A cross-chain DEX aggregator with integrated real-time heuristic token risk scanning, built on Base. BSc Computing dissertation project - UHI 2026.


**Windows note:** After installing Node, close and reopen your terminal. If `npm` is still not recognised in VS Code's PowerShell, run this first:
```powershell
$env:PATH += ";C:\Program Files\nodejs"
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## Live demo

Deployed at: https://dissertation-project-mu.vercel.app

The frontend is hosted on Vercel and the backend on Render, no local install required to evaluate the deployed version. To test an actual swap you need a Base-funded wallet, but token selection, the risk panel, and the tracked tokens dashboard all work with no wallet connected.

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/Rich1885/Dissertation_Project.git
cd Dissertation_Project
```

### 2. Install dependencies
```bash
cd server
npm install

cd ../client
npm install
```

### 3. Create the .env file
In the `server/` folder, create a file called `.env` :
```
MORALIS_KEY=your_moralis_api_key_here
ZEROX_KEY=your_0x_api_key_here
```

Get your keys from:
- Moralis: [moralis.io](https://moralis.io) → Sign up → Web3 APIs
- 0x: [0x.org](https://0x.org) → Get API key (email registration only, no ID required)

### 4. Run

Open **two terminals**:

**Terminal 1 - Backend:**
```bash
cd server
node index.js
# Should print: Listening for API Calls
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
# Should print: Local: http://localhost:5173/
```

Then open **http://localhost:5173** in your browser.

## Project Structure
```
Dissertation_Project/
├── client/          # React frontend (Vite 8, Ant Design, wagmi)
│   └── src/
│       ├── components/   # Swap, RiskPanel, Tokens, Header, LandingPage, DocsPage
│       ├── config/       # Reown AppKit + wagmi config
│       └── tokens.json   # 24 tracked Base tokens
└── server/          # Node.js/Express backend
    └── index.js     # API proxy - Moralis, CoinGecko, 0x endpoints
```

## Tech Stack
- **Frontend:** Vite 8, React 19 (JSX), Ant Design v6, Axios, React Router v7
- **Blockchain:** Base (chain ID 8453), Reown AppKit, wagmi v3, viem v2
- **Swap routing:** 0x Swap API v2 (AllowanceHolder)
- **On-chain data:** Moralis API
- **Market data:** CoinGecko API

## Notes
- The `.env` file is gitignored - you must create it manually on each machine
- The app runs on Base mainnet - real tokens, real transactions
- The SCAM token in the token list is a simulated demo token (hardcoded, never hits any API)
- 0x applies a 0.15% on-chain swap fee on the Standard tier