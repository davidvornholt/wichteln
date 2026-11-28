import type { Paper as PaperName } from '@wichteln/db/papers';
import { FitName } from '../../../shared/ui/fit-name';
import { Paper } from '../../../shared/ui/paper';

type GiftTagProps = {
  readonly name: string;
  readonly paper: PaperName;
};

// The tag hanging from the bow with the name of the person the gift is for.
// It sways on its string until the gift opens, then drops off.
export const GiftTag = ({ name, paper }: GiftTagProps) => (
  <div className="gift-tag">
    <div className="gift-tag-sway">
      <div className="absolute top-0 left-[calc(50%-0.75px)] h-[21cqi] w-[1.5px] bg-card/85" />
      {/* The shadow sits on a wrapper, because the tag's cut corners would
          clip a shadow of its own. */}
      <div className="absolute inset-x-0 top-[16cqi] drop-shadow-[0_2px_3px_oklch(0.21_0.03_268/0.4)] filter">
        <div className="hanging-tag bg-card">
          <Paper className="h-[9cqi]" paper={paper} tile={0.45} />
          <div className="px-[2.5cqi] pt-[2cqi] pb-[3cqi] text-center text-ink">
            <span className="block font-bold text-[3.4cqi] text-ink-soft uppercase tracking-[0.14em]">
              Für
            </span>
            <FitName className="mt-[0.5cqi]" name={name} />
          </div>
        </div>
      </div>
    </div>
  </div>
);
