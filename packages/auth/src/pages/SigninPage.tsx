/* eslint-disable react-hooks/rules-of-hooks */
/** @jsxRuntime classic */
/** @jsx jsx */

import { useState, Fragment, FormEvent, useRef, useEffect } from 'react';
import { ethers } from 'ethers';
import { jsx, H1, Stack, VisuallyHidden, Center } from '@keystone-ui/core';
import { Button } from '@keystone-ui/button';
import { TextInput } from '@keystone-ui/fields';
import { Notice } from '@keystone-ui/notice';

import { useMutation, gql } from '@keystone-6/core/admin-ui/apollo';
import { useRawKeystone, useReinitContext } from '@keystone-6/core/admin-ui/context';
import { useRouter } from '@keystone-6/core/admin-ui/router';
import { LoadingDots } from '@keystone-ui/loading';
import { SigninContainer } from '../components/SigninContainer';
import { useRedirect } from '../lib/useFromRedirect';

type SigninPageProps = {
  identityField: string;
  secretField: string;
  mutationName: string;
  successTypename: string;
  publicAddress: string;
  failureTypename: string;
};

export const getSigninPage = (props: SigninPageProps) => () => <SigninPage {...props} />;

export const SigninPage = ({
  identityField,
  secretField,
  mutationName,
  successTypename,
  failureTypename,
  publicAddress
}: SigninPageProps) => {
  const [account, setAccount] = useState([])
  const [signer, setSigner]=useState()
const [nonce, setNonce] = useState('')
const [signature,setSignature] = useState('')
  const mutation = gql`

  mutation getNonce ($publicAddress: String!){
    getNonce(publicAddress: $publicAddress) {
      nonce
    }
  }
`;

const signatureMutation = gql`

mutation signatureAuthentication ($publicAddress: String!){
  signatureAuthentication(publicAddress: $publicAddress) {
    
  }
}
`;


  const [mode, setMode] = useState<'signin' | 'forgot password'>('signin');
  const identityFieldRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    identityFieldRef.current?.focus();
  }, [mode]);

  const [getNonce, { error, loading, data }] = useMutation(mutation);

  const reinitContext = useReinitContext();
  const router = useRouter();
  const rawKeystone = useRawKeystone();
  const redirect = useRedirect();

  // This useEffect specifically handles ending up on the signin page from a SPA navigation
  useEffect(() => {
    if (rawKeystone.authenticatedItem.state === 'authenticated') {
      router.push(redirect);
    }
  }, [rawKeystone.authenticatedItem, router, redirect]);

  if (rawKeystone.authenticatedItem.state === 'authenticated') {
    return (
      <Center fillView>
        <LoadingDots label="Loading page" size="large" />
      </Center>
    );
  }
const connectToMetamask=async (e:any)=>{
e.preventDefault();
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum)

// MetaMask requires requesting permission to connect users accounts

const accounts=await provider.send('eth_requestAccounts', [])
setAccount(accounts)
const signers =await provider.getSigner()
console.log('signer',signer,'accounts',accounts)
await getNonce({variables:{publicAddress:accounts[0] } })
setSigner(signers)
  } catch (error) {
    console.log('error',error);
  }
}

const signMessage=async (e:any)=>{
  e.preventDefault();
try {
  const signature=await signer.signMessage(nonce)
  setSignature(signature)
  console.log('signature',signature)
} catch (error) {
  console.log('errr',error)
}
  }
  console.log('Please log in')


  useEffect(() => {
if(data)
{setNonce(data.getNonce.nonce)} 
{console.log('data',data)}
  },[data])
  return (
    <SigninContainer title="Keystone - Sign In">
      <Stack
        gap="xlarge"
        as="form"
        onSubmit={async (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();

          if (mode === 'signin') {
            try {
              let result = await getNonce({
                variables: {
                  publicAddress: account[0],

                },
              });
              if (result.data.authenticate?.__typename !== successTypename) {
                return;
              }
            } catch (err) {
              return;
            }
            reinitContext();
            router.push(redirect);
          }
        }}
      >
        <H1>Sign In</H1>
        {error && (
          <Notice title="Error" tone="negative">
            {error.message}
          </Notice>
        )}
        {data?.authenticate?.__typename === failureTypename && (
          <Notice title="Error" tone="negative">
            {data?.authenticate.message}
          </Notice>
        )}

        {mode === 'forgot password' ? (
          <Stack gap="medium" across>
            <Button type="submit" weight="bold" tone="active">
              Log reset link
            </Button>
            <Button weight="none" tone="active" onClick={() => setMode('signin')}>
              Go back
            </Button>
          </Stack>
        ) : (
          <Stack gap="medium" across>

       {account.length>0?     <Button
              weight="bold"
              tone="active"
              isLoading={
                loading ||
                // this is for while the page is loading but the mutation has finished successfully
                data?.authenticate?.__typename === successTypename
              }
      onClick={signMessage}
            >
              Sign in
            </Button>:     <Button
              weight="bold"
              tone="active"
              onClick={connectToMetamask}
            >
           Connect To Metamask
            </Button>}
          </Stack>
        )}
      </Stack>
    </SigninContainer>
  );
};
