import { ethers, Wallet as EOAWallet } from 'ethers';
import { LocalRelayer } from '@biconomy-sdk/relayer';
import { defaultSnapOrigin } from '../config';
import { GetSnapsResponse, Snap } from '../types';

export const Abi = [
  'event SmartWalletCreated(address)',
  'function create() public payable',
  'function getAAWallet() view public returns(address)',
  'function enableModule(address module) public',
  'function isModuleEnabled(address module) public view returns (bool)',
  'function createSession(address sessionKey, address smartAddress, ' +
    'tuple(address whitelistDestination,bytes4[] whitelistMethods,uint256 tokenAmount)[] permissions, ' +
    'tuple(uint256 startTimestamp,uint256 endTimestamp,bool enable) sessionParam) external',
];

export const sessionAbi = [
  'function getSessionInfo(address sessionKey) public view returns (tuple(uint256 startTimestamp,uint256 endTimestamp,bool enable,uint256 nonce) sessionInfo)',
];

// TODO test
const iFaceEthStorage = new ethers.utils.Interface(
  '[{"inputs": [],"name": "count","outputs": [{"internalType": "uint256", "name": "","type": "uint256"}],"stateMutability": "view","type": "function"},{"inputs": [],"name": "update","outputs": [],"stateMutability": "nonpayable","type": "function"}]',
);

const factoryAddress = '0x8D01b1142D8FED28D9fE643250662E890D485cb2';
const sessionAddress = '0x7aEcb0095C9511E4d4EF7ABA0dFcE5b16ad4e818';
const ethStorageAddress = '0xFE932143c6612CbB4ebCF34Cef5C18696eca5186';

export type SessionKeyStorage = {
  owner: string;
  sessionKey: string;
};

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
  if (
    smartAccount &&
    // eslint-disable-next-line eqeqeq
    smartAccount != '0x0000000000000000000000000000000000000000'
  ) {
    const owner = await getEOAAccount();
    return {
      address: smartAccount,
      owner,
    };
  }
  return undefined;
};

export const isSessionModuleEnabled = async (address: any) => {
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  let factoryContract = new ethers.Contract(address, Abi, provider);
  factoryContract = factoryContract.connect(provider.getSigner());
  return await factoryContract.isModuleEnabled(sessionAddress);
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
    if (
      smartAccount &&
      // eslint-disable-next-line eqeqeq
      smartAccount != '0x0000000000000000000000000000000000000000'
    ) {
      const owner = await getEOAAccount();
      return {
        address: smartAccount,
        owner,
      };
    }
  }
  return undefined;
};

export const enableSession = async (address: any) => {
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  let factoryContract = new ethers.Contract(address, Abi, provider);
  factoryContract = factoryContract.connect(provider.getSigner());
  const tx = await factoryContract.enableModule(sessionAddress);
  const receipt = await tx.wait();
  return receipt.status;
};

export const createSessionInfo = async (owner: string) => {
  console.log('create session info');
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'create_session',
        params: {
          owner,
        },
      },
    },
  });
};

export const getPermissionParams = (tokenAddress: string): any => {
  // TODO
  // const encodedData = iFaceEthStorage.encodeFunctionData('transfer', [
  //   '0x1234567890123456789012345678901234567890',
  //   '10000000000',
  // ]);
  const encodedData = iFaceEthStorage.encodeFunctionData('update');
  const transferFunctionSignature = encodedData.slice(0, 10);
  return {
    whitelistDestination: tokenAddress,
    whitelistMethods: [transferFunctionSignature],
    tokenAmount: 0,
  };
};

export const getSessionParams = (): any => {
  const time = Math.floor(Date.now() / 1000);
  return {
    startTimestamp: time,
    endTimestamp: time + 7 * 24 * 60 * 60,
    enable: true,
  };
};

export const pushSession = async (sessionKey: string, smartAddress: string) => {
  const permissionParams = getPermissionParams(ethStorageAddress);
  console.log('permission params ', permissionParams);
  const sessionParams = getSessionParams();

  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  let sessionContract = new ethers.Contract(sessionAddress, Abi, provider);
  sessionContract = sessionContract.connect(provider.getSigner());
  const tx = await sessionContract.createSession(
    sessionKey,
    smartAddress,
    [permissionParams],
    sessionParams,
  );
  const receipt = await tx.wait();
  return receipt.status;
};

export const createSessionForSmartAccount = async (smartAddress: string) => {
  const owner = await getEOAAccount();
  const sessionResult = await createSessionInfo(owner);
  const session = sessionResult as SessionKeyStorage;
  return await pushSession(session.sessionKey, smartAddress);
};

// *******
// *******
// ***send****
// *******
// *******
export const getRelayerWallet = (privateKey: string) => {
  const providerUrl = 'https://galileo.web3q.io:8545';
  const ethersWallet = new EOAWallet(privateKey);
  return ethersWallet.connect(
    new ethers.providers.JsonRpcProvider(providerUrl),
  );
};

export const getNonceForSessionKey = async (
  sessionKey: string,
): Promise<number> => {
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  let sessionContract = new ethers.Contract(
    sessionAddress,
    sessionAbi,
    provider,
  );
  sessionContract = sessionContract.connect(provider.getSigner());
  const result = await sessionContract.getSessionInfo(sessionKey);
  console.log('result', result);

  if (result) {
    return result.nonce.toNumber();
  }
  throw new Error(`Could not get nonce for session key ${sessionKey}`);
};

export const createTx = async (
  owner: string,
  sessionKey: string,
  toAddress: string,
) => {
  const nonceFromModule = await getNonceForSessionKey(sessionKey);
  // TODO upload data
  // const encodedData = iFaceEthStorage.encodeFunctionData('update', [sessionKey]);
  const encodedData = iFaceEthStorage.encodeFunctionData('update');
  const authorizedTx = {
    to: toAddress,
    amount: 0,
    data: encodedData,
    nonce: nonceFromModule,
  };
  return {
    owner,
    sessionKeyModuleAddress: sessionAddress,
    tx: authorizedTx,
  };
};

export const signTx = async (args: object) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'interact',
        params: args,
      },
    },
  });
};

export const sendTx = async (sessionKey: string, tx: any, signature: any) => {
  const relayerWallet = getRelayerWallet(
    process.env.REACT_APP_PKEY ||
      '8cab001cdaded235e252b8de1997a5b02c35f0acef41fe2427ee953d7570aad4',
  );
  const relayer: LocalRelayer = new LocalRelayer(relayerWallet);

  const ABI = [
    'function executeTransaction(address _sessionKey, address payable _to, uint256 _value, bytes calldata _data, bytes calldata signature) external returns (bool success)',
  ];
  const iface = new ethers.utils.Interface(ABI);
  const tx3 = {
    to: sessionAddress,
    value: 0,
    data: iface.encodeFunctionData('executeTransaction', [
      sessionKey,
      tx.tx.to,
      tx.tx.amount,
      tx.tx.data,
      signature,
    ]),
    chainId: 3334,
  };

  const txHash = await relayer.relayAny(tx3);
  console.log(txHash);
  return txHash.hash;
};

export const sendSessionTransaction = async (key: string, file: string) => {
  const owner = await getEOAAccount();

  const tx = await createTx(owner, key, ethStorageAddress);
  const signature = await signTx(tx);
  console.log('--signInfo-', signature, file);
  const hash = await sendTx(key, tx, signature);
  return hash;
};
