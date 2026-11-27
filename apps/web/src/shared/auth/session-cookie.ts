import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/react-start/server';
import { isProduction } from '../env/server';

// In production, the __Host- prefix lets only this host set the cookie, over
// HTTPS and for every path, so an app on a sibling subdomain cannot plant a
// session for the whole domain. The development server runs on plain HTTP,
// where browsers need not accept the prefix.
const cookieName = () =>
  isProduction() ? '__Host-wichteln_session' : 'wichteln_session';

export const readSessionCookie = (): string | undefined =>
  getCookie(cookieName());

export const writeSessionCookie = (token: string, expiresAt: Date) => {
  setCookie(cookieName(), token, {
    expires: expiresAt,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: isProduction(),
  });
};

// The browser refuses to delete a __Host- cookie without these attributes.
export const clearSessionCookie = () => {
  deleteCookie(cookieName(), { path: '/', secure: isProduction() });
};
