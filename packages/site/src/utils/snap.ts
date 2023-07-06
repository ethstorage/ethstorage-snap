import { ethers } from 'ethers';
import { defaultSnapOrigin } from '../config';
import { GetSnapsResponse, Snap } from '../types';

export const Abi = [
  'event SmartWalletCreated(address)',
  'function create() public payable',
  'function enableModule(address module) public',
  'function getAAWallet() view public returns(address)',
];

const factoryAddress = '0x642744e069495828526a063533217F8E50A6C443';
const sessionAddress = '0x2Ce097F05ba8f823b32C5039f9C4a035e9816C68';

/**
 * Get the installed snaps in MetaMask.
 *
 * @returns The snaps installed in MetaMask.
 */
export const getSnaps = async (): Promise<GetSnapsResponse> => {
  return (await window.ethereum.request({
    method: 'wallet_getSnaps',
  })) as unknown as GetSnapsResponse;
};

/**
 * Connect a snap to MetaMask.
 *
 * @param snapId - The ID of the snap.
 * @param params - The params to pass with the snap to connect.
 */
export const connectSnap = async (
  snapId: string = defaultSnapOrigin,
  params: Record<'version' | string, unknown> = {},
) => {
  await window.ethereum.request({
    method: 'wallet_requestSnaps',
    params: {
      [snapId]: params,
    },
  });
};

/**
 * Get the snap from MetaMask.
 *
 * @param version - The version of the snap to install (optional).
 * @returns The snap object returned by the extension.
 */
export const getSnap = async (version?: string): Promise<Snap | undefined> => {
  try {
    const snaps = await getSnaps();

    return Object.values(snaps).find(
      (snap) =>
        snap.id === defaultSnapOrigin && (!version || snap.version === version),
    );
  } catch (e) {
    console.log('Failed to obtain installed snap', e);
    return undefined;
  }
};

/**
 * Invoke the "hello" method from the example snap.
 */
export const sendHello = async () => {
  await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: { snapId: defaultSnapOrigin, request: { method: 'hello' } },
  });
};

export const isLocalSnap = (snapId: string) => snapId.startsWith('local:');

// smart account info
export const getSessionInfo = async () => {
  console.log('invoking snap to get session info');
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'get_session_info' },
    },
  });
};

export const getSmartAccount = async () => {
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  let factoryContract = new ethers.Contract(factoryAddress, Abi, provider);
  factoryContract = factoryContract.connect(provider.getSigner());
  const smartAccount = await factoryContract.getAAWallet();
  if (smartAccount && smartAccount != '0x0000000000000000000000000000000000000000') {
    const owner = window.ethereum.selectedAddress;
    return {
      address: smartAccount,
      owner,
    };
  }
  return undefined;
};

export const createSmartAccount = async () => {
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  let factoryContract = new ethers.Contract(factoryAddress, Abi, provider);
  factoryContract = factoryContract.connect(provider.getSigner());
  const tx = await factoryContract.create({
    value: ethers.utils.parseEther('1'),
  });
  const receipt = await tx.wait();
  console.log(`Transaction: ${tx.hash}`);

  if (receipt.status) {
    const smartAccount = await factoryContract.getAAWallet();
    if (smartAccount && smartAccount != '0x0000000000000000000000000000000000000000') {
      if (!window.ethereum.selectedAddress) {
        await window.ethereum.enable();
      }
      const owner = window.ethereum.selectedAddress;
      return {
        address: smartAccount,
        owner,
      };
    }
  }
  return undefined;
};

export const enableSession = async (address: any) => {
  console.log("----",address);
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  let factoryContract = new ethers.Contract(address, Abi, provider);
  factoryContract = factoryContract.connect(provider.getSigner());
  const tx = await factoryContract.enableModule(sessionAddress);
  const receipt = await tx.wait();
  return receipt.status;
};
