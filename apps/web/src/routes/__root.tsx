import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useLocation,
} from '@tanstack/react-router';
import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import { signOut } from '../features/access/server-fns';
import { getViewer } from '../shared/auth/viewer-fn';
import { AppFrame } from '../shared/ui/app-frame';
import { Button } from '../shared/ui/button';
import { PageProblem } from '../shared/ui/page-problem';
import appCss from '../styles.css?url';

const RootDocument = ({ children }: { readonly children: ReactNode }) => (
  <html lang="de">
    <head>
      <HeadContent />
    </head>
    <body>
      {children}
      <Scripts />
    </body>
  </html>
);

const RootLayout = () => {
  const { viewer } = Route.useRouteContext();
  const { pathname } = useLocation();
  const page = <Outlet />;
  return (
    <MotionConfig reducedMotion="user">
      {viewer === null || pathname === '/willkommen' ? (
        page
      ) : (
        <AppFrame
          onSignOut={async () => {
            await signOut();
            // A new document, because the router keeps what the routes
            // visited before loaded, such as the recipient, and the next
            // person using this tab could find it there.
            globalThis.location.replace('/');
          }}
          person={viewer}
        >
          {page}
        </AppFrame>
      )}
    </MotionConfig>
  );
};

const RootError = () => (
  <PageProblem
    action={
      <Button onClick={() => globalThis.location.reload()} variant="secondary">
        Seite neu laden
      </Button>
    }
    title="Das hat nicht geklappt"
  >
    Die Seite konnte nicht geladen werden. Prüfe die Internetverbindung und lade
    sie neu.
  </PageProblem>
);

const RootNotFound = () => (
  <PageProblem title="Diese Seite gibt es nicht">
    Vielleicht ist der Link falsch abgetippt. Auf der Startseite geht es weiter.
  </PageProblem>
);

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      { title: 'Wichteln' },
      { name: 'description', content: 'Unsere Wichtelrunde' },
      { name: 'theme-color', content: '#eff3f7' },
      // Links to wishes lead to other sites. They learn nothing about this
      // one, and search engines leave it out.
      { name: 'referrer', content: 'no-referrer' },
      { name: 'robots', content: 'noindex, nofollow' },
      { name: 'apple-mobile-web-app-title', content: 'Wichteln' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/manifest.webmanifest' },
    ],
  }),
  beforeLoad: async () => ({ viewer: await getViewer() }),
  shellComponent: RootDocument,
  component: RootLayout,
  errorComponent: RootError,
  notFoundComponent: RootNotFound,
});
