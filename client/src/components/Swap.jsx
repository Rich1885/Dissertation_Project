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

import { useAccount, useSendTransaction, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, erc20Abi } from "viem";

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

  function handleSlippageChange(e) {
    setSlippage(e.target.value);
  }

  function changeAmount(e) {
    setTokenOneAmount(e.target.value);

    if (e.target.value && prices) {
      setTokenTwoAmount((e.target.value * prices.ratio).toFixed(2));
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
    const res = await axios.get("http://localhost:3001/tokenPrice", {
      params: { addressOne: one, addressTwo: two },
    });
    setPrices(res.data);
  }

  async function fetchRisk(address) {
    try {
      const res = await axios.get("http://localhost:3001/tokenRisk", {
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

      const res = await axios.get("http://localhost:3001/swap", {
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
          <div className="inputs">
            <Input
              placeholder="0"
              value={tokenOneAmount}
              onChange={changeAmount}
              disabled={!prices}
            />
            <Input placeholder="0" value={tokenTwoAmount} disabled={true} />
            <div className="switchButton" onClick={switchTokens}>
              <ArrowDownOutlined className="switchArrow" />
            </div>
            <div className="assetOne" onClick={() => openModal(1)}>
              <img
                src={tokenOne.img}
                alt="assetOneLogo"
                className="assetLogo"
              />
              {tokenOne.ticker}
              <DownOutlined />
            </div>
            <div className="assetTwo" onClick={() => openModal(2)}>
              <img
                src={tokenTwo.img}
                alt="assetOneLogo"
                className="assetLogo"
              />
              {tokenTwo.ticker}
              <DownOutlined />
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

        <RiskPanel riskData={riskData} />
      </div>
    </>
  );
}

export default Swap;