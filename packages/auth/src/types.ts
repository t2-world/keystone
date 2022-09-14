import { BaseListTypeInfo } from '@keystone-6/core/types';

export type AuthGqlNames = {
  authenticateItemWithMetamask: string;
  ItemAuthenticationWithMetamaskResult: string;
  ItemAuthenticationWithMetamaskSuccess: string;
  ItemAuthenticationWithMetamaskFailure: string;
};

export type AuthConfig<ListTypeInfo extends BaseListTypeInfo> = {
  /** The key of the list to authenticate users with */
  listKey: ListTypeInfo['key'];
  /** The path of the field the identity is stored in; must be text-ish */
  identityField: ListTypeInfo['fields'];
  /** The path of the field the secret is stored in; must be password-ish */
  secretField: ListTypeInfo['fields'];
  /** Session data population */
  sessionData?: string;
};

export type SecretFieldImpl = {
  generateHash: (secret: string) => Promise<string>;
  compare: (secret: string, hash: string) => Promise<string>;
};
