// Made-up people for the accessibility suite. a11y/serve.ts gives each of
// them a personal link with this fixed secret, so a test can sign in as
// anyone by opening /willkommen#<secret>.
const secretLength = 43;

const secretFor = (name: string) =>
  `a11y-${name.toLowerCase()}-`.padEnd(secretLength, 'x');

export const family = [
  { name: 'Mara', paper: 'kirsch', secret: secretFor('Mara') },
  { name: 'Maximilian', paper: 'tanne', secret: secretFor('Maximilian') },
  { name: 'Ida', paper: 'senf', secret: secretFor('Ida') },
  // Took part only in earlier seasons.
  { name: 'Kemal', paper: 'kobalt', secret: secretFor('Kemal') },
] as const;

export type FamilyName = (typeof family)[number]['name'];

export const welcomePath = (name: FamilyName) =>
  `/willkommen#${family.find((person) => person.name === name)?.secret ?? ''}`;

export const a11yPort = 3121;
