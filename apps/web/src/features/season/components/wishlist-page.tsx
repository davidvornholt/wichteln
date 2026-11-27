import type { SignedInPerson } from '../../../shared/auth/signed-in-person';
import type { SeasonView } from '../wish';
import { WishlistEditor } from './wishlist-editor';

type WishlistPageProps = {
  readonly person: SignedInPerson;
  readonly view: SeasonView;
};

// The page where a person writes their own wish list.
export const WishlistPage = ({ person, view }: WishlistPageProps) => (
  <>
    <h1 className="font-display font-extrabold text-[2.75rem] uppercase leading-[0.88]">
      Dein Wunschzettel
      {view.kind === 'taking-part' ? (
        <span className="block text-ink-soft">{view.year}</span>
      ) : null}
    </h1>
    {view.kind === 'taking-part' ? (
      <>
        <p className="mt-3 mb-8 max-w-[38ch] text-ink-soft leading-relaxed">
          Wer dich beschenkt, sieht diesen Zettel. Je genauer, desto besser:
          Größe, Farbe, wo es das gibt.
        </p>
        <WishlistEditor
          paper={person.paper}
          wishes={view.ownWishes}
          year={view.year}
        />
      </>
    ) : (
      <p className="mt-3 max-w-[38ch] text-ink-soft leading-relaxed">
        {view.kind === 'no-season'
          ? 'Sobald die nächste Wichtelrunde beginnt, kannst du hier deine Wünsche aufschreiben.'
          : `Bei der Wichtelrunde ${view.year} bist du nicht dabei, deshalb gibt es diesmal keinen Wunschzettel von dir.`}
      </p>
    )}
  </>
);
