import type { KeystoneDbAPI } from '@keystone-6/core/types';
import { utils} from 'ethers';
const TIMEOUT = 5 // min
function getMinutesBetweenDates(startDate: Date, endDate: Date) {
  var diff = endDate.getTime() - startDate.getTime()
  const min = diff / 60000
  return min.toFixed(0)
}
export async function validateSecret(
  // secretFieldImpl: SecretFieldImpl,
  identityField: string,
  identity: string,
  // secretField: string,
  signature: string,
  // secret: string,
  dbItemAPI: KeystoneDbAPI<any>[string]
): Promise<{ success: false } | { success: true; item: { id: any; [prop: string]: any } }> {
  console.log( 'identityField',identityField,'signature',signature)

  const item = await dbItemAPI.findOne({ where: { [identityField]: identity } });
  // await secretFieldImpl.generateHash('simulated-password-to-counter-timing-attack');
  // eslint-disable-next-line quotes

  if (!item) {

    return { success: false };
  }
   else {
    // const difference: any = getMinutesBetweenDates(new Date(item.nonceCreationDate), new Date())
    const message = `${item.nonce}`
    const signerAddress = utils.verifyMessage(message, signature).toLocaleLowerCase()
  if(signerAddress==identity)
  {
    const difference: any = getMinutesBetweenDates(new Date(item.nonceCreationDate), new Date())
    if (difference < TIMEOUT){
       await dbItemAPI.updateOne({
        where: { publicAddress: item.publicAddress },
        data: { nonce: `${new Date().toISOString()}_${identity}`,nonceCreationDate: `${new Date().toISOString()}`,isValidated: true, }, })
        return { success: true, item };
    }
    else{
  return { success: false };

}

}
else{ return { success: false };}
   }
  }

