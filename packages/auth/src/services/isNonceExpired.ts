const NONCE_TIMEOUT = 5 * 60 * 1000;

export const isNonceExpired = nonceCreationDate => {
  const diff = new Date() - new Date(nonceCreationDate);
  return diff > NONCE_TIMEOUT;
};
