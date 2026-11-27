import { Schema } from 'effect';
import { webAddress, wishLimits } from './wish-limits';

const emptyOrWebAddress = new RegExp(`^$|${webAddress.source}`, 'u');

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
  url: optionalText(wishLimits.url).check(Schema.isPattern(emptyOrWebAddress)),
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
