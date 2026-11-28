import { motion } from 'motion/react';

// How far each letter tilts before it lands, alternating left and right.
const tilt = 8;
const letterStagger = 0.055;

const letter = {
  hidden: (index: number) => ({
    y: '0.55em',
    opacity: 0,
    rotate: index % 2 === 0 ? -tilt : tilt,
  }),
  shown: {
    y: 0,
    opacity: 1,
    rotate: 0,
    transition: { type: 'spring', stiffness: 520, damping: 17 },
  },
} as const;

type RisingLettersProps = {
  readonly text: string;
  // Seconds before the first letter rises.
  readonly delay: number;
  // False shows the text in place, for a page that has already played it.
  readonly animate?: boolean;
};

// Sets text letter by letter, each springing up into place after the one
// before. Screen readers read the text as one word.
export const RisingLetters = ({
  text,
  delay,
  animate = true,
}: RisingLettersProps) => (
  <>
    <span className="sr-only">{text}</span>
    <motion.span
      animate="shown"
      aria-hidden="true"
      className="inline-flex"
      initial={animate ? 'hidden' : false}
      variants={{
        shown: {
          transition: { delayChildren: delay, staggerChildren: letterStagger },
        },
      }}
    >
      {Array.from(text).map((character, index) => (
        <motion.span
          className="inline-block"
          custom={index}
          // biome-ignore lint/suspicious/noArrayIndexKey: the letters of a text never reorder.
          key={index}
          variants={letter}
        >
          {character}
        </motion.span>
      ))}
    </motion.span>
  </>
);
