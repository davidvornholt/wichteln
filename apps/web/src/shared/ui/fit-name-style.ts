import type { CSSProperties } from 'react';

// Short names would grow taller than they are wide.
const fewestLetters = 3;

// Tells the .fit-name rule in styles.css how many letters it has to fit.
export const fitNameStyle = (name: string) =>
  ({
    '--letters': Math.max(Array.from(name).length, fewestLetters),
  }) as CSSProperties;

export const fitNameTextClass =
  'font-display font-extrabold uppercase leading-[0.82] tracking-[-0.01em]';
