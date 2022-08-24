import type { KeystoneDbAPI } from '@keystone-6/core/types';
import { SecretFieldImpl } from '../types';

export async function validateSecret(
  // secretFieldImpl: SecretFieldImpl,
  identityField: string,
  identity: string,
  // secretField: string,
  // secret: string,
  dbItemAPI: KeystoneDbAPI<any>[string]
): Promise<{ success: false } | { success: true; item: { id: any; [prop: string]: any } }> {
  console.log('validateSecret - ',  identityField, identity)
  const item = await dbItemAPI.findOne({ where: { [identityField]: identity } });
  // await secretFieldImpl.generateHash('simulated-password-to-counter-timing-attack');
  // eslint-disable-next-line quotes
  console.log("item",item);
  if (!item) {
    // See "Identity Protection" in the README as to why this is a thing
    // await secretFieldImpl.generateHash('simulated-password-to-counter-timing-attack');
    return { success: false };
  }
  // else if (!!secret) {
  //   // Authenticated!
  //   return { success: true, item };
  // }
   else {
    return { success: true, item };
  }
}
