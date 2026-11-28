import { createFileRoute } from '@tanstack/react-router';
import { WishlistPage } from '../features/season/components/wishlist-page';
import { loadSeason } from '../features/season/server-fns';
import { requireViewer } from '../shared/routing/require-viewer';

const Wishlist = () => {
  const { person, view } = Route.useLoaderData();
  return <WishlistPage person={person} view={view} />;
};

export const Route = createFileRoute('/wunschzettel')({
  head: () => ({ meta: [{ title: 'Wunschzettel · Wichteln' }] }),
  beforeLoad: requireViewer,
  loader: () => loadSeason(),
  component: Wishlist,
});
