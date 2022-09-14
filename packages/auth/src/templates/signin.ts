import { AuthGqlNames } from '../types';

export const signinTemplate = ({
  gqlNames,
  identityField,
  secretField,
}: {
  gqlNames: AuthGqlNames;
  identityField: string;
  secretField: string;
}) => {
  // -- TEMPLATE START
  return `import { getSigninPage } from '@keystone-6/auth/pages/SigninPage'

export default getSigninPage(${JSON.stringify({
    identityField: identityField,
    secretField: secretField,
    mutationName: gqlNames.authenticateItemWithMetamask,
    successTypename: gqlNames.ItemAuthenticationWithMetamaskSuccess,
    failureTypename: gqlNames.ItemAuthenticationWithMetamaskFailure,
  })});
`;
  // -- TEMPLATE END
};
