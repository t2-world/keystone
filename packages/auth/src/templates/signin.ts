import { AuthGqlNames } from '../types';

export const signinTemplate = ({
  gqlNames,
  identityField,
  secretField,
  nonceField,
}: {
  gqlNames: AuthGqlNames;
  identityField: string;
  secretField: string;
  nonceField: string;
}) => {
  // -- TEMPLATE START
  return `import { getSigninPage } from '../../../packages/metaMaskAuth/src/pages/SigninPage'

export default getSigninPage(${JSON.stringify({
    identityField: identityField,
    secretField: secretField,
    nonceField: nonceField,
    mutationName: gqlNames.authenticateItemWithMetamask,
    successTypename: gqlNames.ItemAuthenticationWithMetamaskSuccess,
    failureTypename: gqlNames.ItemAuthenticationWithMetamaskFailure,
  })});
`;
  // -- TEMPLATE END
};
