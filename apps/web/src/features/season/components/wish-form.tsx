import { Check, Plus } from 'lucide-react';
import { type SubmitEvent, useId, useState } from 'react';
import { Button } from '../../../shared/ui/button';
import type { Wish } from '../wish';
import { webAddress, wishLimits, withWebScheme } from '../wish-limits';

export type WishDraft = {
  readonly title: string;
  readonly note: string;
  readonly url: string;
};

type WishFormProps = {
  // The wish being changed, or nothing for a new one.
  readonly wish?: Wish;
  readonly onSave: (draft: WishDraft) => Promise<void>;
  readonly onCancel?: () => void;
};

const fieldClass =
  'w-full border-2 border-field bg-card px-3 text-ink transition-colors placeholder:font-normal placeholder:text-ink-soft hover:border-ink-soft focus:border-ink focus:outline-none';
const labelClass = 'mb-1.5 block font-bold text-[0.9375rem]';

const failedSaving =
  'Der Wunsch ist nicht gespeichert. Prüfe die Internetverbindung und versuch es noch einmal.';

// Writes a new wish or changes one. A new wish clears the form once it is on
// the list, ready for the next one.
export const WishForm = ({ wish, onSave, onCancel }: WishFormProps) => {
  const id = useId();
  const [title, setTitle] = useState(wish?.title ?? '');
  const [note, setNote] = useState(wish?.note ?? '');
  const [url, setUrl] = useState(wish?.url ?? '');
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const draft = {
      title: title.trim(),
      note: note.trim(),
      url: withWebScheme(url.trim()),
    };
    if (draft.url !== '' && !webAddress.test(draft.url)) {
      setProblem(
        'Das ist kein Link. Kopiere ihn am besten aus der Adresszeile des Browsers.',
      );
      return;
    }
    setSaving(true);
    setProblem(null);
    try {
      await onSave(draft);
      if (wish === undefined) {
        setTitle('');
        setNote('');
        setUrl('');
      }
    } catch {
      setProblem(failedSaving);
    } finally {
      setSaving(false);
    }
  };

  // The form checks the link itself, so a link without https:// is completed
  // instead of refused in the browser's own words.
  return (
    <form className="space-y-4" noValidate={true} onSubmit={submit}>
      <div>
        <label className={labelClass} htmlFor={`${id}-title`}>
          {wish === undefined ? 'Was wünschst du dir?' : 'Wunsch'}
        </label>
        <input
          autoComplete="off"
          className={`${fieldClass} h-13 font-bold text-lg`}
          id={`${id}-title`}
          maxLength={wishLimits.title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ein Buch, ein Spiel, ein Gutschein …"
          required={true}
          value={title}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor={`${id}-note`}>
          Details <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <textarea
          className={`${fieldClass} min-h-24 resize-y py-2.5 leading-snug`}
          id={`${id}-note`}
          maxLength={wishLimits.note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Größe, Farbe, wo es das gibt"
          value={note}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor={`${id}-url`}>
          Link <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <input
          aria-describedby={problem === null ? undefined : `${id}-problem`}
          autoComplete="url"
          className={`${fieldClass} h-12`}
          id={`${id}-url`}
          inputMode="url"
          maxLength={wishLimits.url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://"
          type="url"
          value={url}
        />
      </div>
      {problem === null ? null : (
        <p
          className="font-bold text-kirsch-deep"
          id={`${id}-problem`}
          role="alert"
        >
          {problem}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button
          disabled={saving || title.trim() === ''}
          icon={
            wish === undefined ? (
              <Plus aria-hidden="true" size={20} />
            ) : (
              <Check aria-hidden="true" size={20} />
            )
          }
          type="submit"
        >
          {wish === undefined ? 'Auf den Zettel' : 'Speichern'}
        </Button>
        {onCancel === undefined ? null : (
          <Button onClick={onCancel} variant="quiet">
            Abbrechen
          </Button>
        )}
      </div>
    </form>
  );
};
