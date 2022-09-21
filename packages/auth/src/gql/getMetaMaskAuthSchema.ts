import type { BaseItem } from '@keystone-6/core/types';
import { graphql } from '@keystone-6/core';
import { AuthGqlNames } from '../types';

import { validateSecret } from '../services/validateSecret';
import { utils } from 'ethers';
import { generateNonce } from '../services/generateNonce';

export function getMetaMaskAuthSchema<I extends string, S extends string>({
  listKey,
  identityField,
  secretField,
  nonceField,
  gqlNames,
  base,
}: {
  listKey: string;
  identityField: I;
  secretField: S;
  nonceField: string;
  gqlNames: AuthGqlNames;
  base: graphql.BaseSchemaMeta;
}) {
  const ItemAuthenticationWithMetamaskSuccess = graphql.object<{
    sessionToken: string;
    item: BaseItem;
  }>()({
    name: gqlNames.ItemAuthenticationWithMetamaskSuccess,
    fields: {
      sessionToken: graphql.field({ type: graphql.nonNull(graphql.String) }),
      item: graphql.field({ type: graphql.nonNull(base.object(listKey)) }),
    },
  });
  const ItemAuthenticationWithMetamaskFailure = graphql.object<{ message: string }>()({
    name: gqlNames.ItemAuthenticationWithMetamaskFailure,
    fields: {
      message: graphql.field({ type: graphql.nonNull(graphql.String) }),
    },
  });
  const AuthenticationResult = graphql.union({
    name: gqlNames.ItemAuthenticationWithMetamaskResult,
    types: [ItemAuthenticationWithMetamaskSuccess, ItemAuthenticationWithMetamaskFailure],
    resolveType(val) {
      if ('sessionToken' in val) {
        return gqlNames.ItemAuthenticationWithMetamaskSuccess;
      }
      return gqlNames.ItemAuthenticationWithMetamaskFailure;
    },
  });
  // @ts-ignore
  const extension = {
    query: {
      authenticatedItem: graphql.field({
        type: graphql.union({
          name: 'AuthenticatedItem',
          types: [base.object(listKey) as graphql.ObjectType<BaseItem>],
          resolveType: (root, context) => context.session?.listKey,
        }),
        resolve(root, args, { session, db }) {
          if (typeof session?.itemId === 'string' && typeof session.listKey === 'string') {
            return db[session.listKey].findOne({ where: { id: session.itemId } });
          }
          return null;
        },
      }),
      userNonce: graphql.field({
        type: graphql.object()({
          name: 'UserNonce',
          fields: {
            [nonceField]: graphql.field({ type: graphql.nonNull(graphql.String) }),
          },
        }),
        args: {
          [identityField]: graphql.arg({ type: graphql.nonNull(graphql.String) }),
        },
        resolve: async (root, { [identityField]: identityNotFormatted }, { prisma }) => {
          const identity = identityNotFormatted.toLowerCase();
          if (!utils.isAddress(identity)) {
            return { code: 'FAILURE', message: 'Address invalid' };
          }

          const user = await prisma.user.upsert({
            where: { [identityField]: identity },
            update: {
              [nonceField]: generateNonce(identity),
              [`${nonceField}CreationDate`]: new Date().toISOString(),
              isValidated: false,
            },
            create: {
              [identityField]: identity,
              [nonceField]: generateNonce(identity),
            },
          });

          return {
            [nonceField]: user[nonceField],
          };
        },
      }),
    },
    mutation: {
      [gqlNames.authenticateItemWithMetamask]: graphql.field({
        type: AuthenticationResult,
        args: {
          [identityField]: graphql.arg({ type: graphql.nonNull(graphql.String) }),
          [secretField]: graphql.arg({ type: graphql.nonNull(graphql.String) }),
        },
        async resolve(root, { [identityField]: identity, [secretField]: secret }, context) {
          if (!context.startSession) {
            throw new Error('No session implementation available on context');
          }

          const dbItemAPI = context.sudo().db[listKey];
          const result = await validateSecret(
            identityField,
            identity,
            secretField,
            secret,
            nonceField,
            dbItemAPI
          );

          if (!result.success) {
            return { code: 'FAILURE', message: 'Authentication failed.' };
          }

          // Update system state
          const sessionToken = await context.startSession({
            listKey,
            itemId: result.item.id.toString(),
          });
          return { sessionToken, item: result.item };
        },
      }),
    },
  };
  return { extension, ItemAuthenticationWithMetamaskSuccess };
}
