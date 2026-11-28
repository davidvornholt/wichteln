import type { ReactNode } from 'react';
import { classNames } from './class-names';
import { fitNameStyle, fitNameTextClass } from './fit-name-style';

type FitNameProps = {
  readonly name: string;
  readonly className?: string;
  // What to set instead of the plain name, such as rising letters.
  readonly children?: ReactNode;
};

// A name set as large as the width of its box allows.
export const FitName = ({ name, className, children }: FitNameProps) => (
  <span className={classNames('fit-name block', className)}>
    <span
      className={fitNameTextClass}
      // biome-ignore lint/nursery/noInlineStyles: The letter count is data, not a design token.
      style={fitNameStyle(name)}
    >
      {children ?? name}
    </span>
  </span>
);
