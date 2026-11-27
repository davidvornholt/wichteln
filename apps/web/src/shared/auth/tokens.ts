// Secrets in personal links and session cookies: 32 random bytes, written in
// base64url. The database keeps only their SHA-256 hash, so a copy of the
// database signs nobody in.
const tokenBytes = 32;

export const newToken = (): string =>
  Buffer.from(crypto.getRandomValues(new Uint8Array(tokenBytes))).toString(
    'base64url',
  );

export const hashToken = (token: string): string =>
  new Bun.CryptoHasher('sha256').update(token).digest('hex');

const wellFormedToken = /^[A-Za-z0-9_-]{43}$/u;

// A token as newToken writes it. Anything else cannot match a stored hash, so
// it is refused before the database is asked.
export const isWellFormedToken = (value: string): boolean =>
  wellFormedToken.test(value);
