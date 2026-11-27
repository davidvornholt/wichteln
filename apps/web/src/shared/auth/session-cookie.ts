import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/react-start/server';
import { isProduction } from '../env/server';

const cookieName = 'wichteln_session';

export const readSessionCookie = (): string | undefined =>
  getCookie(cookieName);

export const writeSessionCookie = (token: string, expiresAt: Date) => {
  setCookie(cookieName, token, {
    expires: expiresAt,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: isProduction(),
  });
};

export const clearSessionCookie = () => {
  deleteCookie(cookieName, { path: '/' });
};
