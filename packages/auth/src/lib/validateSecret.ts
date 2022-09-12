import type { KeystoneDbAPI } from '@keystone-6/core/types';
import { SecretFieldImpl } from '../types';
import { utils } from 'ethers';
const TIMEOUT = 5; // min
function getMinutesBetweenDates(startDate: Date, endDate: Date) {
  var diff = endDate.getTime() - startDate.getTime();
  const min = diff / 60000;
  return min.toFixed(0);
}
export async function validateSecret(
  secretFieldImpl: SecretFieldImpl,
  identityField: string,
  identity: string,
  secretField: string,
  secret: string,
  dbItemAPI: KeystoneDbAPI<any>[string]
): Promise<{ success: false } | { success: true; item: { id: any; [prop: string]: any } }> {
  const item = await dbItemAPI.findOne({ where: { [identityField]: identity } });
  if (!item) {
    return { success: false };
  } else {
    const message = `${item.nonce}`;
    const signerAddress = utils.verifyMessage(message, secret).toLocaleLowerCase();
    if (signerAddress !== identity) {
      return { success: false };
    }
    const difference: any = getMinutesBetweenDates(new Date(item.nonceCreationDate), new Date());
    if (difference > TIMEOUT) {
      return { success: false };
    }
    await dbItemAPI.updateOne({
      where: { publicAddress: item.publicAddress },
      data: {
        nonce: `${new Date().toISOString()}_${identity}`,
        nonceCreationDate: `${new Date().toISOString()}`,
        isValidated: true,
      },
    });
    return { success: true, item };
  }
}
