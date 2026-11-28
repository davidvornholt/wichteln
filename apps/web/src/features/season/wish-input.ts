import { Schema } from 'effect';
import { isWebAddress } from '../../shared/web-address';
import { wishLimits } from './wish-limits';

const isEmptyOrWebAddress = Schema.makeFilter(
  (url: string) =>
    url === '' ||
    isWebAddress(url) ||
    'Der Link führt nicht zu einer Webseite.',
);

// An empty optional field arrives as an empty string from the form and is
// stored as null.
const optionalText = (maximumLength: number) =>
  Schema.Trim.check(Schema.isMaxLength(maximumLength));

export const WishInput = Schema.Struct({
  title: Schema.Trim.check(
    Schema.isMinLength(1),
    Schema.isMaxLength(wishLimits.title),
  ),
  note: optionalText(wishLimits.note),
  url: optionalText(wishLimits.url).check(isEmptyOrWebAddress),
});
export type WishInput = typeof WishInput.Type;

export const decodeWishInput = Schema.decodeUnknownSync(WishInput);

export const WishUpdate = Schema.Struct({
  id: Schema.String.check(Schema.isUUID()),
  wish: WishInput,
});
export const decodeWishUpdate = Schema.decodeUnknownSync(WishUpdate);

export const WishReference = Schema.Struct({
  id: Schema.String.check(Schema.isUUID()),
});
export const decodeWishReference = Schema.decodeUnknownSync(WishReference);

export const Unwrapping = Schema.Struct({
  year: Schema.Int,
});
export const decodeUnwrapping = Schema.decodeUnknownSync(Unwrapping);

export const emptyToNull = (value: string): string | null =>
  value === '' ? null : value;
