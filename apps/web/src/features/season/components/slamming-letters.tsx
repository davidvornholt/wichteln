import { motion } from 'motion/react';
import { inSeconds, letterStaggerMilliseconds } from './gift-timing';

// Each letter drops out of the air, huge and blurred, and lands with a
// thud, tilted alternately left and right before it settles.
const tilt = 9;
const dropScale = 2.3;
const dropBlur = 'blur(6px)';

const letter = {
  hidden: (index: number) => ({
    opacity: 0,
    scale: dropScale,
    y: '-0.3em',
    rotate: index % 2 === 0 ? -tilt : tilt,
    filter: dropBlur,
  }),
  shown: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotate: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 640,
      damping: 21,
      mass: 0.9,
      opacity: { duration: 0.12 },
      filter: { duration: 0.16 },
    },
  },
} as const;

type SlammingLettersProps = {
  readonly text: string;
  // Seconds before the first letter lands.
  readonly delay: number;
  // False shows the text in place, for a gift that was already unwrapped.
  readonly animate: boolean;
};

// Sets the name letter by letter, each slamming down after the one before.
// Screen readers read it as one word.
export const SlammingLetters = ({
  text,
  delay,
  animate,
}: SlammingLettersProps) => (
  <>
    <span className="sr-only">{text}</span>
    <motion.span
      animate="shown"
      aria-hidden="true"
      className="inline-flex"
      initial={animate ? 'hidden' : false}
      variants={{
        shown: {
          transition: {
            delayChildren: delay,
            staggerChildren: inSeconds(letterStaggerMilliseconds),
          },
        },
      }}
    >
      {Array.from(text).map((character, index) => (
        <motion.span
          className="inline-block origin-bottom"
          custom={index}
          // biome-ignore lint/suspicious/noArrayIndexKey: the letters of a name never reorder.
          key={index}
          variants={letter}
        >
          {character}
        </motion.span>
      ))}
    </motion.span>
  </>
);
