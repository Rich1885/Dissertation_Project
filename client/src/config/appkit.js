import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet } from "@reown/appkit/networks";

const projectId = "ce119a0c44111171005d9451c05a37fe";

const networks = [mainnet];

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
});

const metadata = {
  name: "SentinelDEX",
  description: "Cross-chain DEX aggregator with heuristic risk scanning",
  url: "http://localhost:5173",
  icons: [],
};

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  themeMode: "dark",
  features: {
    analytics: false,
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;