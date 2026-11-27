import { createFileRoute } from '@tanstack/react-router';
import { Welcome } from '../features/access/components/welcome';

export const Route = createFileRoute('/willkommen')({
  head: () => ({ meta: [{ title: 'Willkommen · Wichteln' }] }),
  component: Welcome,
});
