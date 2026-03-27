import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, theme } from "antd";

// AppKit + Wagmi
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "./config/appkit";

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          theme={{
            algorithm: theme.darkAlgorithm,
            token: {
              colorBgContainer: "#111637",
              colorBgElevated: "#111637",
              colorBorder: "#1e2650",
              colorText: "#ffffff",
              colorTextSecondary: "#8a8fb5",
              colorPrimary: "#7c3aed",
              borderRadius: 14,
              fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
            },
          }}
        >
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ConfigProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);