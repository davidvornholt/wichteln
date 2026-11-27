import { papers } from '@wichteln/db/papers';
import { motion } from 'motion/react';
import { unrollCurve } from '../../../shared/ui/motion-curves';
import { Paper } from '../../../shared/ui/paper';

const firstRollDelay = 0.1;
const rollStagger = 0.09;

const roll = {
  rolled: { clipPath: 'inset(0 0 100% 0)' },
  unrolled: (index: number) => ({
    clipPath: 'inset(0 0 0% 0)',
    transition: {
      delay: firstRollDelay + rollStagger * index,
      duration: 0.9,
      ease: unrollCurve,
    },
  }),
};

// The five wrapping papers side by side, unrolling one after another.
export const PaperRolls = () => (
  <div aria-hidden="true" className="grid h-[42dvh] min-h-64 grid-cols-5">
    {papers.map((paper, index) => (
      <motion.div
        animate="unrolled"
        custom={index}
        initial="rolled"
        key={paper}
        variants={roll}
      >
        <Paper className="size-full" paper={paper} tile={1.2} />
      </motion.div>
    ))}
  </div>
);
