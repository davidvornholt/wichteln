import { motion } from 'motion/react';
import { FitName } from '../../../shared/ui/fit-name';
import { RisingLetters } from '../../../shared/ui/rising-letters';
import { PaperRolls } from './paper-rolls';

const wordmark = 'Wichteln';
// The wordmark rises once the paper rolls are half unrolled, and the text
// follows once it stands.
const wordmarkDelay = 0.55;
const textDelay = 1.05;

// The page a device that is not signed in sees.
export const Landing = () => (
  <main className="min-h-dvh">
    <PaperRolls />
    <div className="mx-auto max-w-xl px-5 pt-8 pb-16">
      <h1>
        <FitName name={wordmark}>
          <RisingLetters delay={wordmarkDelay} text={wordmark} />
        </FitName>
      </h1>
      <motion.div
        animate={{ opacity: 1 }}
        initial={{ opacity: 0 }}
        transition={{ delay: textDelay, duration: 0.5 }}
      >
        <p className="mt-6 max-w-[34ch] text-lg leading-relaxed">
          Öffne den persönlichen Link, den David dir geschickt hat. Er meldet
          dieses Gerät an, und du siehst, wen du dieses Jahr beschenkst.
        </p>
        <p className="mt-4 max-w-[38ch] text-ink-soft leading-relaxed">
          Auf dem Handy und auf dem Tablet funktioniert derselbe Link.
        </p>
      </motion.div>
    </div>
  </main>
);
