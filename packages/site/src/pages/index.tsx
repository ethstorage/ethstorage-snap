import { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import {
  SmartAccountActions,
  SmartAccountContext,
} from '../hooks/SmartAccountContext';
import {
  getSessionInfo,
  createSmartAccount,
  getSmartAccount,
  createSessionForSmartAccount,
  getBalance,
  mintNft,
} from '../utils';
import {
  ConnectButton,
  InstallFlaskButton,
  Card,
  CreateButton,
  FileUploader,
  MintButton,
} from '../components';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  margin-top: 7.6rem;
  margin-bottom: 7.6rem;
  ${({ theme }) => theme.mediaQueries.small} {
    padding-left: 2.4rem;
    padding-right: 2.4rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
    width: auto;
  }
`;

const Heading = styled.h1`
  margin-top: 0;
  margin-bottom: 2.4rem;
  text-align: center;
`;

const Span = styled.span`
  color: ${(props) => props.theme.colors.primary.default};
`;

const CardContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 90rem;
  width: 100%;
  height: 100%;
  margin-top: 1.5rem;
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.error.muted};
  border: 1px solid ${({ theme }) => theme.colors.error.default};
  color: ${({ theme }) => theme.colors.error.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-bottom: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;
  ${({ theme }) => theme.mediaQueries.small} {
    padding: 1.6rem;
    margin-bottom: 1.2rem;
    margin-top: 1.2rem;
    max-width: 100%;
  }
`;

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  padding: 10px;
  width: 100%;
`;

const ContainerRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  width: 100%;
  margin: 0px;
  padding: 10px;
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.large};
  margin: 0;
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: ${({ theme }) => theme.fontSizes.text};
  }
`;

const SessionBody = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  padding: 10px 0px 10px 0px;
`;

const SessionRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-top: 5px;
  padding: 2px;
`;

const SessionsCard = styled.div<{ disabled: boolean }>`
  display: flex;
  flex-direction: column;
  width: 500px;
  background-color: ${({ theme }) => theme.colors.card.default};
  margin-top: 2.4rem;
  margin-bottom: 2.4rem;
  padding: 2.4rem;
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.default};
  box-shadow: ${({ theme }) => theme.shadows.default};
  filter: opacity(${({ disabled }) => (disabled ? '.4' : '1')});
  align-self: stretch;
  ${({ theme }) => theme.mediaQueries.small} {
    width: 100%;
    margin-top: 1.2rem;
    margin-bottom: 1.2rem;
    padding: 1.6rem;
  }
`;

const SessionOverviewMessage = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  margin-top: 10px;
  padding: 10px;
`;

const SessionHeader = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
`;

const Index = () => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [smartAccount, saDispatch] = useContext(SmartAccountContext);

  const [account, setAccount] = useState(null);
  const [sessionSinger, setSessionSinger] = useState(null);
  const [balance, setBalance] = useState('0');
  const [uploadFileInfo, setUploadFileInfo] = useState(null);
  const [musicNftUrl, setMusicNftUrl] = useState('');

  useEffect(() => {
    async function checkAccount() {
      if (state.installedSnap) {
        const accounts: any = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
        }
      }
    }
    checkAccount();
  }, [state.installedSnap]);

  useEffect(() => {
    const timer: NodeJS.Timeout = setInterval(async () => {
      if (account) {
        const b = await getBalance(account);
        setBalance(b);
      }
    }, 5000);
    return () => {
      clearInterval(timer);
    };
  }, [account]);

  async function _getAndSaveSessionInfo() {
    if (smartAccount.address) {
      const sessionInfo: any = await getSessionInfo();
      console.log('Session info is : ', sessionInfo);
      if (sessionInfo) {
        saDispatch({
          type: SmartAccountActions.SetSessionKey,
          payload: {
            owner: sessionInfo.owner,
            key: sessionInfo.sessionKey,
          },
        });
        setSessionSinger(sessionInfo.sessionKeySigner);
      }
    }
  }

  useEffect(() => {
    async function checkAAWallet() {
      if (state.installedSnap && account) {
        const _smartAccount = await getSmartAccount();
        if (_smartAccount) {
          saDispatch({
            type: SmartAccountActions.SetSmartAccount,
            payload: {
              _smartAccount,
            },
          });
        }
      }
    }
    checkAAWallet();
  }, [state.installedSnap, account]);

  useEffect(() => {
    _getAndSaveSessionInfo();
  }, [smartAccount.address]);

  // ************
  // event
  // ************
  const handleConnectClick = async () => {
    try {
      const accounts: any = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
      }
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleCreateSmartAccountClick = async () => {
    try {
      const _smartAccount = await createSmartAccount();
      console.log(_smartAccount);
      if (_smartAccount) {
        saDispatch({
          type: SmartAccountActions.SetSmartAccount,
          payload: {
            _smartAccount,
          },
        });
        toast('Creat AA Account Success!');
      }
    } catch (e) {
      console.error(e);
      toast('Creat AA Account Fail!');
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleCreateSessionClick = async () => {
    try {
      const status: any = await createSessionForSmartAccount();
      if (status) {
        _getAndSaveSessionInfo();
        toast('Create Session Key Success!');
      }
    } catch (e) {
      console.error(e);
      toast('Create Session Key Fail!');
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleMintClick = async () => {
    try {
      const url: string | undefined = await mintNft(
        sessionSinger,
        uploadFileInfo,
      );
      if (url) {
        setMusicNftUrl(url);
        toast('Mint Success!');
      }
    } catch (e) {
      console.error(e);
      toast('Mint Fail!');
      setMusicNftUrl(e.message);
    }
  };

  return (
    <Container>
      <Heading>
        Welcome to <Span>EthStorage Snap</Span>
      </Heading>
      <CardContainer>
        {state.error && (
          <ErrorMessage>
            <b>An error happened:</b> {state.error.message}
          </ErrorMessage>
        )}
        {!state.isFlask && (
          <Card
            content={{
              title: 'Install',
              description:
                'Snaps is pre-release software only available in MetaMask Flask, a canary distribution for developers with access to upcoming features.',
              button: <InstallFlaskButton />,
            }}
            fullWidth
          />
        )}

        <MainContainer>
          <ContainerRow>
            <Card
              content={{
                title: 'Connect',
                description:
                  'Get started by connecting to and installing the example snap.',
                button: (
                  <ConnectButton
                    onClick={handleConnectClick}
                    disabled={account !== null}
                  />
                ),
              }}
              disabled={account !== null}
            />
          </ContainerRow>
          <ContainerRow>
            <div>
              {smartAccount?.address === undefined && (
                <Card
                  content={{
                    title: '1 Discover AA Accounts',
                    description:
                      'Explore more benefits (social recovery and session keys) with AA accounts',
                    button: (
                      <CreateButton
                        onClick={handleCreateSmartAccountClick}
                        disabled={!state.installedSnap}
                      />
                    ),
                  }}
                  disabled={!state.installedSnap}
                  fullWidth={false}
                />
              )}
              {smartAccount?.address !== undefined && (
                <Card
                  content={{
                    title: '1 Discover AA Accounts',
                    description: `AA Account: ${smartAccount.address}`,
                  }}
                  disabled={!state.installedSnap}
                  fullWidth={false}
                />
              )}
            </div>
            <SessionsCard disabled={!smartAccount.address}>
              <SessionHeader>
                <Title>2 Sessions</Title>
                <button
                  onClick={handleCreateSessionClick}
                  disabled={!smartAccount.address}
                >
                  + Create Session
                </button>
              </SessionHeader>
              <SessionBody>
                {smartAccount.sessionInfo &&
                  smartAccount.sessionInfo.length > 0 && (
                    <SessionRow>
                      <div>{`${smartAccount.sessionInfo[0].key}`}</div>
                      <div>Active</div>
                    </SessionRow>
                  )}

                {smartAccount.sessionInfo &&
                  smartAccount.sessionInfo.length === 0 && (
                    <SessionOverviewMessage>
                      You have not created any sessions. Click + Create Session
                      button to create your session.
                    </SessionOverviewMessage>
                  )}
              </SessionBody>
            </SessionsCard>
          </ContainerRow>
          <ContainerRow>
            <Card
              content={{
                title: '3 Transfer Gas Fee',
                description: `Transfer MATIC to the AA account as gas: ${balance} MATIC`,
              }}
              disabled={smartAccount.sessionInfo.length === 0}
              fullWidth={false}
            />
            <SessionsCard disabled={smartAccount.sessionInfo.length === 0}>
              <SessionHeader>
                <Title>4 Interact with your Wallet via Session Keys</Title>
              </SessionHeader>
              <SessionBody>
                <FileUploader
                  sessionSinger={sessionSinger}
                  setUploadFileInfo={setUploadFileInfo}
                />
              </SessionBody>
            </SessionsCard>
          </ContainerRow>
          <ContainerRow>
            <Card
              content={{
                title: '5 Mint Music NFT',
                description: `${musicNftUrl}`,
                button: (
                  <MintButton
                    onClick={handleMintClick}
                    disabled={uploadFileInfo === null}
                  />
                ),
              }}
              disabled={uploadFileInfo === null}
              fullWidth={true}
            />
          </ContainerRow>
        </MainContainer>
      </CardContainer>
      <ToastContainer />
    </Container>
  );
};

export default Index;
