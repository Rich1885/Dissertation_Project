import React, { useState, useEffect } from "react";
import { Input, Popover, Radio, Modal, message } from "antd";
import {
  ArrowDownOutlined,
  DownOutlined,
  SettingOutlined,
} from "@ant-design/icons";

import tokenList from "../tokens.json";
import axios from "axios";
import RiskPanel from "./RiskPanel";

import { useAccount, useReadContract, useSendTransaction, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, erc20Abi, formatUnits } from "viem";

function Swap() {
  const { address, isConnected } = useAccount();
  const { sendTransaction, isPending } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();

  const [slippage, setSlippage] = useState(2.5);
  const [tokenOneAmount, setTokenOneAmount] = useState(null);
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null);
  const [tokenOne, setTokenOne] = useState(tokenList[0]);
  const [tokenTwo, setTokenTwo] = useState(tokenList[1]);
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(1);
  const [prices, setPrices] = useState(null);
  const [riskData, setRiskData] = useState(null);

  // Fetch wallet balances via ERC-20 balanceOf
  const { data: rawBalanceOne } = useReadContract({
    address: tokenOne.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
    query: { enabled: isConnected && !!address },
  });

  const { data: rawBalanceTwo } = useReadContract({
    address: tokenTwo.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
    query: { enabled: isConnected && !!address },
  });

  const balanceOneFormatted = rawBalanceOne != null
    ? parseFloat(formatUnits(rawBalanceOne, tokenOne.decimals)).toFixed(4)
    : null;

  const balanceTwoFormatted = rawBalanceTwo != null
    ? parseFloat(formatUnits(rawBalanceTwo, tokenTwo.decimals)).toFixed(4)
    : null;

  function handleSlippageChange(e) {
    setSlippage(e.target.value);
  }

  function changeAmount(e) {
    setTokenOneAmount(e.target.value);

    if (e.target.value && prices) {
      setTokenTwoAmount((e.target.value * prices.ratio).toFixed(8));
    } else {
      setTokenTwoAmount(null);
    }
  }

  function switchTokens() {
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);

    const one = tokenOne;
    const two = tokenTwo;

    setTokenOne(two);
    setTokenTwo(one);

    fetchPrices(two.address, one.address);
    fetchRisk(one.address);
  }

  function openModal(asset) {
    setChangeToken(asset);
    setIsOpen(true);
  }

  function modifyToken(i) {
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);

    if (changeToken === 1) {
      setTokenOne(tokenList[i]);
      fetchPrices(tokenList[i].address, tokenTwo.address);
    } else {
      setTokenTwo(tokenList[i]);
      fetchPrices(tokenOne.address, tokenList[i].address);
      fetchRisk(tokenList[i].address);
    }

    setIsOpen(false);
  }

  async function fetchPrices(one, two) {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/tokenPrice`, {
      params: { addressOne: one, addressTwo: two },
    });
    setPrices(res.data);
  }

  async function fetchRisk(address) {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/tokenRisk`, {
        params: { address },
      });
      setRiskData(res.data);
    } catch (e) {
      console.error("Risk fetch failed:", e);
      setRiskData(null);
    }
  }

  async function executeSwap() {
    if (!isConnected) {
      message.error("Connect your wallet first");
      return;
    }
    if (!tokenOneAmount) {
      message.error("Enter an amount");
      return;
    }

    try {
      const sellAmount = parseUnits(
        tokenOneAmount,
        tokenOne.decimals
      ).toString();

      const slippageBps = Math.round(slippage * 100).toString();

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/swap`, {
        params: {
          sellToken: tokenOne.address,
          buyToken: tokenTwo.address,
          sellAmount,
          taker: address,
          slippageBps,
        },
      });

      const quote = res.data;

      if (quote.code) {
        message.error(quote.reason || "Quote failed");
        return;
      }

      if (quote.issues?.allowance) {
        message.info("Approving token spend...");

        await writeContractAsync({
          address: tokenOne.address,
          abi: erc20Abi,
          functionName: "approve",
          args: [
            quote.issues.allowance.spender,
            BigInt(sellAmount),
          ],
        });

        message.success("Approved! Now swapping...");
      }

      sendTransaction({
        to: quote.transaction.to,
        data: quote.transaction.data,
        value: BigInt(quote.transaction.value),
        gas: quote.transaction.gas
          ? BigInt(quote.transaction.gas)
          : undefined,
      });

      message.success("Swap submitted!");
    } catch (e) {
      console.error("Swap failed:", e);
      message.error("Swap failed — check console");
    }
  }

  useEffect(() => {
    fetchPrices(tokenList[0].address, tokenList[1].address);
    fetchRisk(tokenList[1].address);
  }, []);

  // Compute USD values for display
  const usdOne =
    tokenOneAmount && prices
      ? (tokenOneAmount * prices.tokenOne).toFixed(2)
      : null;

  const usdTwo =
    tokenTwoAmount && prices
      ? (tokenTwoAmount * prices.tokenTwo).toFixed(2)
      : null;

  const settings = (
    <>
      <div>Slippage Tolerance</div>
      <div>
        <Radio.Group value={slippage} onChange={handleSlippageChange}>
          <Radio.Button value={0.5}>0.5%</Radio.Button>
          <Radio.Button value={2.5}>2.5%</Radio.Button>
          <Radio.Button value={5}>5.0%</Radio.Button>
        </Radio.Group>
      </div>
    </>
  );

  return (
    <>
      <Modal
        open={isOpen}
        footer={null}
        onCancel={() => setIsOpen(false)}
        title="Select a token"
      >
        <div className="modalContent">
          {tokenList?.map((e, i) => {
            return (
              <div
                className="tokenChoice"
                key={i}
                onClick={() => modifyToken(i)}
              >
                <img src={e.img} alt={e.ticker} className="tokenLogo" />
                <div className="tokenChoiceNames">
                  <div className="tokenName">{e.name}</div>
                  <div className="tokenTicker">{e.ticker}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div className="tradeBox">
          <div className="tradeBoxHeader">
            <h4>Swap</h4>
            <Popover
              content={settings}
              title="Settings"
              trigger="click"
              placement="bottomRight"
            >
              <SettingOutlined className="cog" />
            </Popover>
          </div>

          {/* ---- Sell input ---- */}
          <div className="inputGroup">
            <div className="inputLabel">Sell</div>
            <div className="inputWrapper">
              <Input
                placeholder="0"
                value={tokenOneAmount}
                onChange={changeAmount}
                disabled={!prices}
              />
              <div className="assetSelect" onClick={() => openModal(1)}>
                <img
                  src={tokenOne.img}
                  alt={tokenOne.ticker}
                  className="assetLogo"
                />
                {tokenOne.ticker}
                <DownOutlined />
              </div>
            </div>
            <div className="inputMeta">
              <span className="usdValue">
                {usdOne ? `$${usdOne}` : ""}
              </span>
              <span className="walletBalance">
                {balanceOneFormatted ? `${balanceOneFormatted} ${tokenOne.ticker}` : ""}
              </span>
            </div>
          </div>

          {/* ---- Switch button ---- */}
          <div className="switchRow">
            <div className="switchButton" onClick={switchTokens}>
              <ArrowDownOutlined className="switchArrow" />
            </div>
          </div>

          {/* ---- Buy input ---- */}
          <div className="inputGroup">
            <div className="inputLabel">Buy</div>
            <div className="inputWrapper">
              <Input
                placeholder="0"
                value={tokenTwoAmount}
                disabled={true}
              />
              <div className="assetSelect" onClick={() => openModal(2)}>
                <img
                  src={tokenTwo.img}
                  alt={tokenTwo.ticker}
                  className="assetLogo"
                />
                {tokenTwo.ticker}
                <DownOutlined />
              </div>
            </div>
            <div className="inputMeta">
              <span className="usdValue">
                {usdTwo ? `$${usdTwo}` : ""}
              </span>
              <span className="walletBalance">
                {balanceTwoFormatted ? `${balanceTwoFormatted} ${tokenTwo.ticker}` : ""}
              </span>
            </div>
          </div>

          <div
            className={`swapButton ${
              !tokenOneAmount || !isConnected || isPending ? "disabled" : ""
            }`}
            onClick={executeSwap}
          >
            {!isConnected
              ? "Connect Wallet"
              : isPending
              ? "Swapping..."
              : "Swap"}
          </div>
        </div>

        <RiskPanel riskData={riskData} token={tokenTwo} />
      </div>
    </>
  );
}

export default Swap;