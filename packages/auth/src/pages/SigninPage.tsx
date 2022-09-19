/** @jsxRuntime classic */
/** @jsx jsx */

import { useEffect } from 'react';

import { jsx, H1, Stack, Center } from '@keystone-ui/core';
import { Button } from '@keystone-ui/button';
import { Notice } from '@keystone-ui/notice';

import { useRawKeystone, useReinitContext } from '@keystone-6/core/admin-ui/context';
import { useRouter } from '@keystone-6/core/admin-ui/router';
import { LoadingDots } from '@keystone-ui/loading';
import { SigninContainer } from '../components/SigninContainer';
import { useRedirect } from '../hooks/useFromRedirect';
import { useMetamaskAuth } from '../hooks/useMetamaskAuth';

type SigninPageProps = {
  identityField: string;
  secretField: string;
  nonceField: string;
  mutationName: string;
  successTypename: string;
  failureTypename: string;
};

export const getSigninPage = (props: SigninPageProps) => () => <SigninPage {...props} />;

export const SigninPage = ({
  identityField,
  secretField,
  nonceField,
  mutationName,
  successTypename,
  failureTypename,
}: SigninPageProps) => {
  const [authenticate, { error, data, loading }] = useMetamaskAuth({
    config: {
      identityField,
      secretField,
      nonceField,
      mutationName,
      successTypename,
      failureTypename,
    },
  });
  const reinitContext = useReinitContext();
  const router = useRouter();
  const rawKeystone = useRawKeystone();
  const redirect = useRedirect();

  const handleAuthenticateWithMetaMask = async () => {
    const result = await authenticate();
    if (result?.data?.authenticate?.__typename === successTypename) {
      reinitContext();
      router.push(redirect);
    }
  };

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

  return (
    <SigninContainer title="Keystone - Sign In">
      <Stack gap="xlarge" as="div">
        <H1>Sign In</H1>
        {error && (
          <Notice title="Error" tone="negative">
            {error.reason || error.message}
          </Notice>
        )}
        {data?.authenticate?.__typename === failureTypename && (
          <Notice title="Error" tone="negative">
            {data?.authenticate.message}
          </Notice>
        )}
        <Button
          weight="bold"
          tone="active"
          isLoading={
            loading ||
            // this is for while the page is loading but the mutation has finished successfully
            data?.authenticate?.__typename === successTypename
          }
          onClick={handleAuthenticateWithMetaMask}
        >
          Sign in with MetaMask
        </Button>
      </Stack>
    </SigninContainer>
  );
};
