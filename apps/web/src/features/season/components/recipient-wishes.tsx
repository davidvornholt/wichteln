import { motion } from 'motion/react';
import { useId } from 'react';
import { WishTag } from '../../../shared/ui/wish-tag';
import type { Recipient } from '../wish';

const wishStagger = 0.08;

// The wish list of the person the signed-in person gives to.
export const RecipientWishes = ({
  recipient,
}: {
  readonly recipient: Recipient;
}) => {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="mt-14">
      <h2
        className="font-display font-extrabold text-[2.25rem] uppercase leading-[0.9]"
        id={headingId}
      >
        Wunschzettel von {recipient.name}
      </h2>
      {recipient.wishes.length === 0 ? (
        <p className="mt-4 max-w-[34ch] text-ink-soft leading-relaxed">
          {recipient.name} hat noch nichts aufgeschrieben. Schau in ein paar
          Tagen wieder rein.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {recipient.wishes.map((wish, index) => (
            <motion.li
              animate={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: -14 }}
              key={wish.id}
              transition={{
                delay: wishStagger * index,
                duration: 0.4,
                ease: 'easeOut',
              }}
            >
              <WishTag
                note={wish.note}
                paper={recipient.paper}
                title={wish.title}
                url={wish.url}
              />
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
};
