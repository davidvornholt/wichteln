const whitespace = /\s/u;
const webSchemes = new Set(['http:', 'https:']);

// A link must lead to a web page the browser can open: the URL parser takes
// it, its scheme is http or https, and it has no spaces, which a link copied
// from the address bar never has. It imports nothing, so the wish form can
// use it in the browser.
export const isWebAddress = (address: string): boolean => {
  if (whitespace.test(address)) {
    return false;
  }
  try {
    return webSchemes.has(new URL(address).protocol);
  } catch {
    return false;
  }
};
