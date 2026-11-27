import { redirect } from '@tanstack/react-router';
import type { SignedInPerson } from '../auth/signed-in-person';

// Sends a device that is not signed in to the start page, which explains how
// to sign in.
export const requireViewer = ({
  context,
}: {
  readonly context: { readonly viewer: SignedInPerson | null };
}) => {
  if (context.viewer === null) {
    throw redirect({ to: '/' });
  }
};
