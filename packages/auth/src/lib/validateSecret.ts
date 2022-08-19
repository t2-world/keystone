import type { KeystoneDbAPI } from '@keystone-6/core/types';
import { SecretFieldImpl } from '../types';

export async function validateSecret(
  secretFieldImpl: SecretFieldImpl,
  identityField: string,
  identity: string,
  secretField: string,
  secret: string,
  dbItemAPI: KeystoneDbAPI<any>[string]
): Promise<{ success: false } | { success: true; item: { id: any; [prop: string]: any } }> {
  console.log('validateSecret - ', secret, secretField, secretFieldImpl, identityField, identity)
  const item = await dbItemAPI.findOne({ where: { [identityField]: identity } });
  if (!item || !item[secretField]) {
    // See "Identity Protection" in the README as to why this is a thing
    await secretFieldImpl.generateHash('simulated-password-to-counter-timing-attack');
    return { success: false };
  } else if (!!secret) {
    // Authenticated!
    return { success: true, item };
  } else {
    return { success: false };
  }
}
