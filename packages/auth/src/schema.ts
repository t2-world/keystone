import { ExtendGraphqlSchema, getGqlNames } from '@keystone-6/core/types';

import { assertInputObjectType, GraphQLString, GraphQLID, parse, validate } from 'graphql';
import { graphql } from '@keystone-6/core';
import { AuthGqlNames } from './types';
import { getMetaMaskAuthSchema } from './gql/getMetaMaskAuthSchema';

export const getSchemaExtension = ({
  identityField,
  listKey,
  secretField,
  nonceField,
  gqlNames,
  sessionData,
}: {
  identityField: string;
  listKey: string;
  secretField: string;
  nonceField: string;
  gqlNames: AuthGqlNames;
  sessionData: string;
}): ExtendGraphqlSchema =>
  graphql.extend(base => {
    const uniqueWhereInputType = assertInputObjectType(
      base.schema.getType(`${listKey}WhereUniqueInput`)
    );
    const identityFieldOnUniqueWhere = uniqueWhereInputType.getFields()[identityField];
    if (
      identityFieldOnUniqueWhere?.type !== GraphQLString &&
      identityFieldOnUniqueWhere?.type !== GraphQLID
    ) {
      throw new Error(
        `createAuth was called with an identityField of ${identityField} on the list ${listKey} ` +
          `but that field doesn't allow being searched uniquely with a String or ID. ` +
          `You should likely add \`isIndexed: 'unique'\` ` +
          `to the field at ${listKey}.${identityField}`
      );
    }
    const baseSchema = getMetaMaskAuthSchema({
      identityField,
      listKey,
      secretField,
      nonceField,
      gqlNames,
      base,
    });

    // technically this will incorrectly error if someone has a schema extension that adds a field to the list output type
    // and then wants to fetch that field with `sessionData` but it's extremely unlikely someone will do that since if
    // they want to add a GraphQL field, they'll probably use a virtual field
    let ast;
    let query = `query($id: ID!) { ${
      getGqlNames({
        listKey,
        // this isn't used to get the itemQueryName and we don't know it here
        pluralGraphQLName: '',
      }).itemQueryName
    }(where: { id: $id }) { ${sessionData} } }`;
    try {
      ast = parse(query);
    } catch (err) {
      throw new Error(
        `The query to get session data has a syntax error, the sessionData option in your createAuth usage is likely incorrect\n${err}`
      );
    }

    const errors = validate(base.schema, ast);
    if (errors.length) {
      throw new Error(
        `The query to get session data has validation errors, the sessionData option in your createAuth usage is likely incorrect\n${errors.join(
          '\n'
        )}`
      );
    }

    return [baseSchema.extension];
  });
