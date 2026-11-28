import postgres from 'postgres';

// Production reaches PostgreSQL through its Unix socket, written as a
// percent-encoded host (postgresql://user@%2Frun%2Fpostgresql/db). postgres.js
// treats a host that starts with a slash as a socket directory.
export const postgresOptionsForUrl = (url: string) => {
  const { hostname } = new URL(url);
  if (!hostname.toLowerCase().startsWith('%2f')) {
    return {};
  }
  return { host: decodeURIComponent(hostname) } as const;
};

export const makePostgresConnection = (url: string) =>
  postgres(url, { ...postgresOptionsForUrl(url), onnotice: () => undefined });
