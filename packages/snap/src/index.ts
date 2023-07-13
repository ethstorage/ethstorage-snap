import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { panel, text } from '@metamask/snaps-ui';

export type AARpcQuestParams = {
  owner: string;
  smartAddress: string;
  sessionInfo: string;
};

export type AAWallet = {
  owner: string;
  smartAddress: string;
  sessionInfo: string;
};

export type AAWalletState = {
  items: AAWallet[];
};

const getStorageState = async () => {
  return await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  });
};

const storeState = async (newState: AAWalletState) => {
  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState },
  });
};

export const getAAWalletByOwner = async (items: AAWallet[], owner: string) => {
  return items.find((value) => {
    return value.owner === owner;
  });
};

export const saveAAWalletByOwner = async (
  items: AAWallet[],
  owner: string,
  smartAddress: string,
) => {
  let index = -1;
  for (let i = 0; i < items.length; i++) {
    if (items[i].owner === owner) {
      index = i;
      break;
    }
  }

  if (index === -1) {
    items.push({ owner, smartAddress, sessionInfo: '' });
  } else {
    items[index] = { owner, smartAddress, sessionInfo: '' };
  }
  return await storeState({
    items,
  });
};

export const saveSessionInfoByOwner = async (
  items: AAWallet[],
  owner: string,
  sessionInfo: string,
) => {
  let index = -1;
  for (let i = 0; i < items.length; i++) {
    if (items[i].owner === owner) {
      index = i;
      break;
    }
  }

  if (index === -1) {
    throw new Error('No Create');
  }

  items[index] = {
    owner,
    smartAddress: items[index].smartAddress,
    sessionInfo,
  };
  return await storeState({
    items,
  });
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
  const aaParams = request.params as AARpcQuestParams;

  let state: AAWalletState | undefined = await getStorageState();
  if (!state) {
    state = {
      items: [],
    };
    await storeState(state);
  }

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

    // aa account
    case 'get_aa': {
      const aaInfo: AAWallet | undefined = await getAAWalletByOwner(
        state.items,
        aaParams.owner,
      );
      if (aaInfo) {
        return aaInfo.smartAddress;
      }
      return undefined;
    }

    case 'create_aa': {
      await saveAAWalletByOwner(
        state.items,
        aaParams.owner,
        aaParams.smartAddress,
      );
      return true;
    }

    // session
    case 'get_session_info': {
      const aaInfo: AAWallet | undefined = await getAAWalletByOwner(
        state.items,
        aaParams.owner,
      );
      if (aaInfo) {
        return aaInfo.sessionInfo;
      }
      return undefined;
    }

    case 'create_session': {
      // const sessionParams = getSessionParams();
      await saveSessionInfoByOwner(
        state.items,
        aaParams.owner,
        aaParams.sessionInfo,
      );
      return true;
    }

    // case 'interact': {
    //   const data = request.params as SignTxType;
    //   return await signData(data.owner, data.sessionKeyModuleAddress, data.tx);
    // }

    default:
      throw new Error('Method not found.');
  }
};
