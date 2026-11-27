// The wrapping papers a person can have. Each one is a colour and a pattern
// in the web app, and it marks that person everywhere their name appears.
// This module imports nothing, so the browser can use it without the schema.
export const papers = ['kirsch', 'tanne', 'kobalt', 'senf', 'pflaume'] as const;
export type Paper = (typeof papers)[number];
