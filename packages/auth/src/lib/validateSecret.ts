import type { KeystoneDbAPI } from '@keystone-6/core/types';
import { utils } from 'ethers';
import { generateNonce } from '../services/generateNonce';
import { isNonceExpired } from '../services/isNonceExpired';

export async function validateSecret(
  identityField: string,
  identityNotFormatted: string,
  secretField: string,
  secret: string,
  nonceField: string,
  dbItemAPI: KeystoneDbAPI<any>[string]
): Promise<{ success: false } | { success: true; item: { id: any; [prop: string]: any } }> {
  const identity = identityNotFormatted.toLowerCase();

  const item = await dbItemAPI.findOne({ where: { [identityField]: identity } });

  if (!item) {
    return { success: false };
  }

  const signerAddress = utils.verifyMessage(item[nonceField], secret).toLocaleLowerCase();
  if (signerAddress !== identity) {
    return { success: false };
  }

  if (isNonceExpired(item.nonceCreationDate)) {
    return { success: false };
  }

  const updatedItem = await dbItemAPI.updateOne({
    where: { [identityField]: item[identityField] },
    data: {
      [nonceField]: generateNonce(identity),
      [`${nonceField}CreationDate`]: new Date().toISOString(),
      isValidated: true,
    },
  });

  return { success: true, item: updatedItem };
}
