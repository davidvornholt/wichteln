import { getCookie, setCookie } from '@tanstack/react-start/server';
import { isProduction } from '../../shared/env/server';

const cookieName = 'wichteln_ausgepackt';
const yearSeconds = 31_536_000;

// Whether this device has unwrapped the gift of the season, so it opens
// straight to the name. Every new device gets to unwrap it once.
export const hasUnwrapped = (year: number) =>
  getCookie(cookieName) === String(year);

export const rememberUnwrapped = (year: number) => {
  setCookie(cookieName, String(year), {
    maxAge: yearSeconds,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: isProduction(),
  });
};
