import { Contract } from 'ethers';
import { defaultSnapOrigin } from '../config';
import { GetSnapsResponse, Snap } from '../types';
import {
  getZeroDevSigner,
  createSessionKey,
  getRPCProviderOwner,
  createSessionKeySigner,
  ZeroDevSigner,
} from '@zerodevapp/sdk';

const ethStorageAddress = '0x03614D3978b5F508655C0a0480E0b4ed397777De';
const ethStorageAbi = [
  'function mint(bytes memory fileName_, bytes memory musicName_, bytes memory describe_, bytes memory cover_) public',
  'function writeChunk(uint256 fileType, uint256 chunkId, bytes memory name, bytes calldata data) public payable virtual',
  'function getChunkHash(bytes memory name, uint256 chunkId) public view returns (bytes32)',
];

const projectId = '28dda226-fb5f-4b9a-81a0-a95a690f27a2';
const sessionKeyTime = Math.floor(Date.now() / 1000) + 8 * 60 * 60;

export const getEOAAccount = async (): Promise<string> => {
  const accounts: any = await window.ethereum.request({
    method: 'eth_accounts',
  });
  return accounts[0];
};

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
const getAccount = async () => {
  const wallet = getRPCProviderOwner(window.ethereum);
  return await getZeroDevSigner({
    projectId,
    owner: wallet,
  });
};

const querySmartAccount = async (owner: string) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'get_aa',
        params: {
          owner,
        },
      },
    },
  });
};

export const getSmartAccount = async () => {
  console.log('get user AA Wallet');
  const owner = await getEOAAccount();
  const smartAccount = await querySmartAccount(owner);
  if (smartAccount) {
    return {
      owner,
      address: smartAccount,
    };
  }
  return undefined;
};

const saveSmartAccount = async (owner: string, smartAddress: string) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'create_aa',
        params: {
          owner,
          smartAddress,
        },
      },
    },
  });
};

export const createSmartAccount = async () => {
  console.log('create user AA Wallet');
  const owner = await getEOAAccount();
  const signer = await getAccount();
  const address = await signer.getAddress();
  await saveSmartAccount(owner, address);
  return {
    owner,
    address,
  };
};

// session
const querySessionInfo = async (owner: string) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'get_session_info',
        params: {
          owner,
        },
      },
    },
  });
};

export const getSessionInfo = async () => {
  console.log('invoking snap to get session info');
  const owner = await getEOAAccount();
  const sessionInfo = await querySessionInfo(owner);
  if (sessionInfo) {
    const sessionKeySigner = await createSessionKeySigner({
      projectId,
      sessionKeyData: sessionInfo as string,
    });
    console.log('sessionKey', sessionInfo);
    const sessionKey = await sessionKeySigner.getAddress();
    return {
      owner,
      sessionKey,
      sessionKeySigner,
    };
  }
  return undefined;
};

export const saveSessionInfo = async (owner: string, sessionInfo: string) => {
  console.log('create session info');
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'create_session',
        params: {
          owner,
          sessionInfo,
        },
      },
    },
  });
};

export const createSessionForSmartAccount = async () => {
  const owner = await getEOAAccount();
  const zeroSigner: ZeroDevSigner = await getAccount();
  const sessionKey = await createSessionKey(
    zeroSigner,
    [
      {
        to: ethStorageAddress,
        selectors: [], // all method // nftContract.interface.getSighash('function2'),
      },
    ],
    sessionKeyTime,
  );
  await saveSessionInfo(owner, sessionKey);
  return true;
};

// *******
// *******
// ***send****
// *******
// *******
export const sendSessionTransaction = async (
  sessionSinger: any,
  fileType: number,
  chunkId: string,
  name: string,
  data: string,
) => {
  const contract = new Contract(
    ethStorageAddress,
    ethStorageAbi,
    sessionSinger,
  );
  const receipt = await contract.writeChunk(fileType, chunkId, name, data);
  const v = await receipt.wait();
  console.log(v);
  return true;
};

export const getHashKey = async (
  sessionSinger: any,
  hexName: string,
  index: string,
) => {
  const contract = new Contract(
    ethStorageAddress,
    ethStorageAbi,
    sessionSinger,
  );
  return await contract.getChunkHash(hexName, index);
};
