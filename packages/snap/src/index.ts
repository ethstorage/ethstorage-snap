import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { panel, text } from '@metamask/snaps-ui';
import { ethers } from 'ethers';

export type CreateSessionParams = {
  owner: string;
};

export type SessionKeyStorage = {
  owner: string;
  sessionKey: string;
  pk: string;
};

export const SESSION_TX_TYPE = {
  SessionTransaction: [
    { type: 'address', name: 'to' },
    { type: 'uint256', name: 'amount' },
    { type: 'bytes', name: 'data' },
    { type: 'uint256', name: 'nonce' },
  ],
};

export type SignAuthorizedTx = {
  to: string;
  amount: number;
  data: string;
  nonce: number;
};

export type SignTxType = {
  owner: string;
  sessionKeyModuleAddress: string;
  tx: SignAuthorizedTx;
};

export const getSessionInfo = async () => {
  return await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  });
};

export const storeSessionInfo = async (newState: SessionKeyStorage) => {
  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState },
  });
};

export const clearSessionInfo = async () => {
  return await snap.request({
    method: 'snap_manageState',
    params: { operation: 'clear' },
  });
};

export const generateKeyPair = () => {
  const keyPair = ethers.Wallet.createRandom();
  return {
    address: keyPair.address,
    pk: keyPair.privateKey,
  };
};

export const signData = async (
  owner: string,
  sessionKeyModuleAddress: string,
  authorizedTx: SignAuthorizedTx,
) => {
  const sessionInfo: any = await getSessionInfo();
  if (sessionInfo.owner === owner) {
    const signer = new ethers.Wallet(sessionInfo.pk);
    return await signer._signTypedData(
      { verifyingContract: sessionKeyModuleAddress, chainId: 3334 },
      SESSION_TX_TYPE,
      authorizedTx,
    );
  }
  return undefined;
};

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  switch (request.method) {
    case 'hello':
      return snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            text(`Hello, **${origin}**!`),
            text('This custom confirmation is just for display purposes.'),
            text(
              'But you can edit the snap source code to make it do something, if you want to!',
            ),
          ]),
        },
      });

    // query
    case 'get_session_info': {
      const sessionInfo: any = await getSessionInfo();
      if (sessionInfo) {
        return {
          sessionKey: sessionInfo.sessionKey,
          owner: sessionInfo.owner,
        };
      }
      return undefined;
    }

    case 'create_session': {
      const sessionParams = request.params as CreateSessionParams;
      const keyPair = generateKeyPair();
      // const sessionParams = getSessionParams();
      await storeSessionInfo({
        owner: sessionParams.owner,
        sessionKey: keyPair.address,
        pk: keyPair.pk,
      });
      return {
        sessionKey: keyPair.address,
        owner: sessionParams.owner,
      };
    }

    case 'interact': {
      const data = request.params as SignTxType;
      return await signData(data.owner, data.sessionKeyModuleAddress, data.tx);
    }

    default:
      throw new Error('Method not found.');
  }
};
