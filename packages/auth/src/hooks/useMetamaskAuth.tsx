import { useMutation, useLazyQuery, gql } from '@keystone-6/core/admin-ui/apollo';
import { ethers } from 'ethers';

export const useMetamaskAuth = ({
  config: { identityField, secretField, mutationName, successTypename, failureTypename },
}) => {
  const getMetaMaskProvider = () => {
    return new ethers.providers.Web3Provider(window.ethereum);
  };

  const getMetaMaskAccount = async () => {
    const provider = getMetaMaskProvider();
    const accounts = await provider.send('eth_requestAccounts', []);
    return accounts[0];
  };

  const getMetaMaskSigner = async () => {
    const provider = getMetaMaskProvider();
    return provider.getSigner();
  };

  const signMessage = async (message: string) => {
    const signer = await getMetaMaskSigner();
    return await signer.signMessage(message);
  };

  const startAuthentication = async () => {
    const account = await getMetaMaskAccount();

    const getNonceResponse = await getNonceRequest({ variables: { publicAddress: account } });

    const nonce = getNonceResponse.data.userNonce.nonce;
    const signature = await signMessage(nonce);

    return await authenticateRequest({
      variables: {
        identity: account,
        secret: signature,
      },
    });
  };

  const authenticateMutation = gql`
    mutation($identity: String!, $secret: String!) {
      authenticate: ${mutationName}(${identityField}: $identity, ${secretField}: $secret) {
        ... on ${successTypename} {
          item {
            id
          }
        }
        ... on ${failureTypename} {
          message
        }
      }
    }
  `;
  const [authenticateRequest, authenticateResponse] = useMutation(authenticateMutation);

  const getNonceQuery = gql`
    query ($publicAddress: String!) {
      userNonce(publicAddress: $publicAddress) {
        nonce
      }
    }
  `;
  const [getNonceRequest, getNonceResponse] = useLazyQuery(getNonceQuery, {
    fetchPolicy: 'no-cache',
  });

  return [
    startAuthentication,
    {
      error: getNonceResponse.error || authenticateResponse.error,
      loading: getNonceResponse.loading || authenticateResponse.loading,
      data: authenticateResponse.data,
    },
  ];
};