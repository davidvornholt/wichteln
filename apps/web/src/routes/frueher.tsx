import { createFileRoute } from '@tanstack/react-router';
import { ArchiveView } from '../features/archive/components/archive-view';
import { loadArchive } from '../features/archive/server-fns';
import { requireViewer } from '../shared/routing/require-viewer';

const Archive = () => <ArchiveView seasons={Route.useLoaderData()} />;

export const Route = createFileRoute('/frueher')({
  head: () => ({ meta: [{ title: 'Früher · Wichteln' }] }),
  beforeLoad: requireViewer,
  loader: () => loadArchive(),
  component: Archive,
});
