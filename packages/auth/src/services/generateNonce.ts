const crypto = require('crypto');

export const generateNonce = (identity: string) => {
  const data = [identity, new Date().toISOString(), crypto.randomUUID()].join('-');
  const hash = crypto.createHash('md5').update(data).digest('hex');

  return `I'm signing this nonce: ${hash}`;
};
