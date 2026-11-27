import type { CSSProperties } from 'react';

// Tells the .paper rule in styles/papers.css how large to draw the pattern.
export const paperStyle = (tile: number, style?: CSSProperties) =>
  ({ ...style, '--tile': tile }) as CSSProperties;
