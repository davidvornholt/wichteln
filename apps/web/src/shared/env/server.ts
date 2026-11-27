// The server's environment boundary: the only application file allowed to
// read process.env (scoped override in the root biome.jsonc). Values are
// read when asked for, so importing this module never fails.
import process from 'node:process';

export const isProduction = () => process.env.NODE_ENV === 'production';

// The origin personal links point to, such as https://wichteln.example.
export const publicOrigin = (): string => {
  const origin = process.env.PUBLIC_ORIGIN;
  if (origin === undefined || origin === '') {
    throw new Error('PUBLIC_ORIGIN is not set.');
  }
  return origin;
};
