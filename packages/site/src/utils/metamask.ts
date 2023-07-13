import { ethers } from "ethers";
import {formatEther} from "@ethersproject/units/src.ts";

/**
 * Detect if the wallet injecting the ethereum object is Flask.
 *
 * @returns True if the MetaMask version is Flask, false otherwise.
 */
export const isFlask = async () => {
  const provider = window.ethereum;

  try {
    const clientVersion = await provider?.request({
      method: 'web3_clientVersion',
    });

    const isFlaskDetected = (clientVersion as string[])?.includes('flask');

    return Boolean(provider && isFlaskDetected);
  } catch {
    return false;
  }
};

export const getBalance = async (account: string) => {
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  const balance = await provider.getBalance(account);
  return ethers.utils.formatEther(balance);
};
