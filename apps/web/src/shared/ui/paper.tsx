import type { Paper as PaperName } from '@wichteln/db/papers';
import type { CSSProperties, ReactNode } from 'react';
import { classNames } from './class-names';
import { paperStyle } from './paper-style';

// The wrapping papers, plus the dark one every gift comes in before it is
// unwrapped.
export type PaperPattern = PaperName | 'wrap';

type PaperProps = {
  readonly paper: PaperPattern;
  // Scales the pattern, so a small swatch shows the same paper as a gift.
  readonly tile?: number;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
};

export const Paper = ({
  paper,
  tile = 1,
  className,
  style,
  children,
}: PaperProps) => (
  <div
    className={classNames('paper', className)}
    data-paper={paper}
    // biome-ignore lint/nursery/noInlineStyles: The pattern's scale and where the print sits inside a shard are data, not design tokens.
    style={paperStyle(tile, style)}
  >
    {children}
  </div>
);
