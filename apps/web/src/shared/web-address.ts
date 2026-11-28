const whitespace = /\s/u;
const webScheme = /^https?:\/\//iu;
const webSchemes = new Set(['http:', 'https:']);

// A link must lead to a web page the browser can open: it starts with
// http:// or https://, the URL parser takes it, and it has no spaces, which a
// link copied from the address bar never has. Without both slashes, as in
// https:example.com, the parser still finds the host the wish tag shows, but
// the browser opens the address as a path on this app. It imports nothing,
// so the wish form can use it in the browser.
export const isWebAddress = (address: string): boolean => {
  if (whitespace.test(address) || !webScheme.test(address)) {
    return false;
  }
  try {
    return webSchemes.has(new URL(address).protocol);
  } catch {
    return false;
  }
};
