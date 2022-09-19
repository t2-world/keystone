import { useState } from 'react';
import { useMutation, useLazyQuery, gql } from '@keystone-6/core/admin-ui/apollo';
import { ethers, providers } from 'ethers';

const getMetaMaskProvider = () => {
  return new ethers.providers.Web3Provider(window.ethereum);
};

const getMetaMaskAccount = async (provider: providers.Web3Provider) => {
  const accounts = await provider.send('eth_requestAccounts', []);
  return accounts[0];
};

const getMetaMaskSigner = async (provider: providers.Web3Provider) => {
  return provider.getSigner(0);
};

const signMessage = async (provider: providers.Web3Provider, message: string) => {
  const signer = await getMetaMaskSigner(provider);
  return await signer.signMessage(message);
};

export const useMetamaskAuth = ({
  config: {
    identityField,
    secretField,
    nonceField,
    mutationName,
    successTypename,
    failureTypename,
  },
}) => {
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  const startAuthentication = async () => {
    try {
      setLoading(true);

      const provider = getMetaMaskProvider();

      const account = await getMetaMaskAccount(provider);

      const getNonceResponse = await getNonceRequest({ variables: { identity: account } });

      const nonce = getNonceResponse.data.userNonce[nonceField];
      const signature = await signMessage(provider, nonce);

      const result = await authenticateRequest({
        variables: {
          identity: account,
          secret: signature,
        },
      });

      setLoading(false);

      return result;
    } catch (error) {
      setLoading(false);
      // @ts-ignore
      setError(error);
    }
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
    query($identity: String!) {
      userNonce(${identityField}: $identity) {
        ${nonceField}
      }
    }
  `;
  const [getNonceRequest, getNonceResponse] = useLazyQuery(getNonceQuery, {
    fetchPolicy: 'no-cache',
  });

  return [
    startAuthentication,
    {
      error: error || getNonceResponse.error || authenticateResponse.error,
      loading: isLoading,
      data: authenticateResponse.data,
    },
  ];
};
