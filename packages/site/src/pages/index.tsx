import { useContext, useEffect } from 'react';
import styled from 'styled-components';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import {
  SmartAccountActions,
  SmartAccountContext,
} from '../hooks/SmartAccountContext';
import {
  getSessionInfo,
  createSmartAccount,
  enableSession, getSmartAccount,
} from '../utils';
import {
  ConnectButton,
  InstallFlaskButton,
  EnableModuleButton,
  InteractSessionButton,
  Card,
  CreateButton,
} from '../components';

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
  padding: 20px 0px 10px 0px;
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
  margin-top: 40px;
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

  // const notify = (message: string, options?: any) => toast(message, options);

  async function _getAndSaveSessionInfo() {
    if (smartAccount.sessionModuleEnabled) {
      const sessionInfo: any = await getSessionInfo();
      console.log('Session info is : ', sessionInfo);
      if (sessionInfo) {
        saDispatch({
          type: SmartAccountActions.SetSessionKey,
          payload: {
            key: sessionInfo.sessionKey,
            owner: sessionInfo.owner,
          },
        });
      }
    }
  }

  useEffect(() => {
    console.log('State udpated for session', smartAccount.sessionInfo);
  }, [smartAccount.sessionInfo]);

  useEffect(() => {
    _getAndSaveSessionInfo();
  }, [smartAccount.sessionModuleEnabled]);

  useEffect(() => {
    async function checkSmart() {
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
    checkSmart();
  }, [state.installedSnap]);

  useEffect(() => {
    async function checkSessionModue() {
      // if (smartAccount.address) {
      //   const isSessinoModuleEnabled = await isSessionModuleEnabled(
      //     smartAccount.address,
      //   );
      //   if (isSessinoModuleEnabled) {
      //     saDispatch({
      //       type: SmartAccountActions.SetSessionModuleEnabled,
      //       payload: true,
      //     });
      //
      //     // TODO
      //     saDispatch({
      //       type: SmartAccountActions.SetModule,
      //       payload: {
      //         address: '0x2b5Dca28Ad0b7301b78ee1218b1bFC4A7B22E3bC',
      //         enabled: true,
      //         name: 'Session Module',
      //       },
      //     });
      //   }
      // }
    }
    checkSessionModue();
  }, [smartAccount.address]);

  useEffect(() => {
    async function checkSessionModue() {
      if (smartAccount.sessionModuleEnabled) {
        const sessionInfo = await getSessionInfo();
        if (sessionInfo) {
          saDispatch({
            type: SmartAccountActions.SetSessionModuleEnabled,
            payload: true,
          });
        }
      }
    }
    checkSessionModue();
  }, [smartAccount.sessionModuleEnabled]);

  // ************
  // event
  // ************
  const handleConnectClick = async () => {
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleCreateSmartAccountClick = async () => {
    try {
      const _smartAccount = await createSmartAccount();
      if (_smartAccount) {
        saDispatch({
          type: SmartAccountActions.SetSmartAccount,
          payload: {
            _smartAccount,
          },
        });
      }
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleEnableSessionClick = async () => {
    try {
      const txHash: any = await enableSession(smartAccount.address);
      if (txHash) {
        saDispatch({
          type: SmartAccountActions.SetSessionModuleEnabled,
          payload: true,
        });
      }
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleCreateSessionClick = async () => {
    // try {
    //   const txHash: any = await createSessionForSmartAccount();
    //   if (txHash) {
    //     const { emitter } = bncNotify.hash(txHash);
    //     emitter.on('txConfirmed', () => {
    //       notify(
    //         'Session key added on chain. Now you can initiate transactions on your contract without needing to sign every interaction',
    //       );
    //     });
    //   }
    //   _getAndSaveSessionInfo();
    // } catch (e) {
    //   console.error(e);
    //   dispatch({ type: MetamaskActions.SetError, payload: e });
    // }
  };

  const handleSessionInteractonClick = async () => {
    // try {
    //   const txHash: any = await sendSessionTransaction();
    //   if (txHash) {
    //     const { emitter } = bncNotify.hash(txHash);
    //     emitter.on('txConfirmed', () => {
    //       notify('Token transfer via session key successful.');
    //     });
    //   }
    // } catch (e) {
    //   console.error(e);
    //   dispatch({ type: MetamaskActions.SetError, payload: e });
    // }
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
                    disabled={!state.installedSnap}
                  />
                ),
              }}
              disabled={!state.installedSnap}
            />
          </ContainerRow>
          <ContainerRow>
            <div>
              {smartAccount?.address === undefined && (
                <Card
                  content={{
                    title: 'Discover Smart Accounts',
                    description:
                      'Explore more benefits (social recovery and session keys) with smart accounts',
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
                    title: 'Discover Smart Accounts',
                    description: `Smart Account: ${smartAccount.address}`,
                  }}
                  disabled={!state.installedSnap}
                  fullWidth={false}
                />
              )}

              {!smartAccount.sessionModuleEnabled && (
                <Card
                  content={{
                    title: 'Enable Session Module',
                    description: 'Set up temporary session for auto approvals',
                    button: (
                      <EnableModuleButton
                        onClick={handleEnableSessionClick}
                        disabled={!state.installedSnap}
                      />
                    ),
                  }}
                  disabled={!smartAccount.address}
                  fullWidth={false}
                />
              )}
              {smartAccount.sessionModuleEnabled && (
                <Card
                  content={{
                    title: 'Enable Session Module',
                    description:
                      '✅ Session Module is already enabled on your smart account',
                  }}
                  disabled={!smartAccount.address}
                  fullWidth={false}
                />
              )}
            </div>
            <SessionsCard disabled={!smartAccount.sessionModuleEnabled}>
              <SessionHeader>
                <Title>Sessions</Title>
                <button
                  onClick={handleCreateSessionClick}
                  disabled={!smartAccount.sessionModuleEnabled}
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
                title: 'Interact with your Wallet via Session Keys',
                description: '',
                button: (
                  <InteractSessionButton
                    onClick={handleSessionInteractonClick}
                    disabled={smartAccount.sessionInfo.length === 0}
                  />
                ),
              }}
              disabled={smartAccount.sessionInfo.length === 0}
              fullWidth={true}
            />
          </ContainerRow>
        </MainContainer>
      </CardContainer>
    </Container>
  );
};

export default Index;
