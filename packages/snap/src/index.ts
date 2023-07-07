import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { panel, text } from '@metamask/snaps-ui';
import { ethers } from 'ethers';
// import {
//   getSessionParams,
//   getPermissionParams,
//   getEnabledSessionSig,
//   getNonceForSessionKey,
//   encodeTransfer,
//   isModuleEnabled,
// } from './utils/execution';

export const getEOAAccount = async (): Promise<string> => {
  const accounts: any = await ethereum.request({ method: 'eth_accounts' });
  return accounts[0];
};

export type SessionKeyStorage = {
  owner: string;
  sessionKey: string;
  pk: string;
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
      const keyPair = generateKeyPair();
      // const sessionParams = getSessionParams();
      // const eoa = await getEOAAccount();
      await storeSessionInfo({
        owner: 'eoa',
        sessionKey: keyPair.address,
        pk: keyPair.pk,
      });
      return {
        sessionKey: keyPair.address,
        owner: 'eoa',
      };
    }

    // // TODO : Review error
    // // Late promise received after Snap finished execution. Promise will be dropped.
    // case 'interact':
    //   return new Promise((resolve, reject) => {
    //     console.log('inside interact');
    //     // TODO: get session transaction from params that eventually comes from UI
    //
    //     const relayer = new LocalRelayer(
    //       getEOAWallet(
    //         process.env.REACT_APP_PKEY ||
    //         '3ff26792ed7e1c706357a1565293371f2f479d331e6c718ac5c5445360e2cef8',
    //       ),
    //     );
    //     console.log('local relayer init..');
    //     console.log(relayer);
    //     // prepare data or fetch from params
    //     getEOAAccount().then(async (eoa) => {
    //       const sessionInfo: any = await getSessionInfo();
    //       console.log('session info ');
    //       console.log(sessionInfo);
    //
    //       const nonceFromModule = await getNonceForSessionKey(
    //         sessionInfo.sessionKey,
    //       );
    //       console.log('Got nonce from module', nonceFromModule);
    //       const authorizedTx = {
    //         // sessionKey: sessionKey,
    //         to: usdcAddress,
    //         amount: 0,
    //         data: encodeTransfer(receiver, '10000000'),
    //         nonce: nonceFromModule,
    //       };
    //       console.log('authorizedTx');
    //       console.log(authorizedTx);
    //
    //       console.log(eoa);
    //       console.log('eoa');
    //
    //       if (sessionInfo.owner === eoa) {
    //         const signer = new ethers.Wallet(sessionInfo.pk);
    //         const signature = await getEnabledSessionSig(
    //           signer,
    //           config.sessionKeyModule.address,
    //           authorizedTx,
    //           Number(wallet.chainId),
    //         );
    //
    //         console.log('got signature');
    //         console.log(signature);
    //
    //         const tx3 = {
    //           to: config.sessionKeyModule.address,
    //           value: 0,
    //           data: iFaceSessionModule.encodeFunctionData(
    //             'executeTransaction',
    //             [
    //               sessionInfo.sessionKey,
    //               authorizedTx.to,
    //               authorizedTx.amount,
    //               authorizedTx.data,
    //               signature,
    //             ],
    //           ),
    //           chainId: Number(wallet.chainId),
    //         };
    //
    //         console.log('module txn');
    //         console.log(tx3);
    //
    //         const txHash = await relayer.relayAny(tx3);
    //         console.log(txHash);
    //         if (txHash) {
    //           resolve(txHash.hash);
    //         } else {
    //           reject(new Error('reject txn failed'));
    //         }
    //
    //         // relayer calls session module contract
    //       } else {
    //         reject(new Error('reject txn failed'));
    //       }
    //     });
    //   });

    default:
      throw new Error('Method not found.');
  }
};

// return new Promise((resolve, reject) => {
//   const keyPair: KeyPair = generateKeyPair();
//   console.log('keypair..', keyPair.address);
//   const sessionParams = getSessionParams();
//   console.log('session params ', sessionParams);
//   const permissionParams = getPermissionParams(usdcAddress);
//   console.log('permission params ', permissionParams);
//
//   const relayer = new LocalRelayer(
//     getEOAWallet(
//       process.env.REACT_APP_PKEY ||
//       '3ff26792ed7e1c706357a1565293371f2f479d331e6c718ac5c5445360e2cef8',
//     ),
//   );
//   console.log('local relayer init..');
//   console.log(relayer);
//   getsmartAccount().then((_smartAccount) => {
//     _smartAccount.setRelayer(relayer);
//     console.log('relayer is set');
//
//     getEOAAccount()
//       .then(async (eoa) => {
//         await storeSessionInfo({
//           owner: eoa,
//           sessionKey: keyPair.address,
//           pk: keyPair.pk,
//         });
//       })
//       .then(async () => {
//         const tx2 = {
//           to: config.sessionKeyModule.address,
//           data: iFaceSessionModule.encodeFunctionData('createSession', [
//             keyPair.address,
//             [permissionParams],
//             sessionParams,
//           ]),
//         };
//         console.log('prepared txn for create session ');
//         console.log(tx2);
//         const scwTx = await _smartAccount.createTransaction({
//           transaction: tx2,
//         });
//         console.log('wallet txn crearted ');
//         console.log(scwTx);
//         const txHash = await _smartAccount.sendTransaction({
//           tx: scwTx,
//           // gasLimit,
//         });
//         console.log(txHash);
//         if (txHash) {
//           resolve(txHash);
//         } else {
//           reject(new Error('reject txn failed'));
//         }
//       });
//   });
// });
