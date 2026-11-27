// How long each part of a wish may be. The form and the server both enforce
// them; this module imports nothing, so the form can use it in the browser.
export const wishLimits = {
  title: 120,
  note: 600,
  url: 2000,
} as const;

// A link must lead to a web page.
export const webAddress = /^https?:\/\/\S+$/u;

const hasScheme = /^[a-z][a-z\d+.-]*:/iu;

// People often copy a shop's address without its scheme, such as
// amazon.de/…, so a link without one is taken to be a secure web page.
export const withWebScheme = (address: string): string =>
  address === '' || hasScheme.test(address) ? address : `https://${address}`;
