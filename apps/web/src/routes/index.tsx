import { createFileRoute } from '@tanstack/react-router';
import { Landing } from '../features/access/components/landing';
import { SeasonHome } from '../features/season/components/season-home';
import { loadSeason } from '../features/season/server-fns';

const Home = () => {
  const season = Route.useLoaderData();
  if (season === null) {
    return <Landing />;
  }
  return (
    <SeasonHome
      person={season.person}
      unwrapped={season.unwrapped}
      view={season.view}
    />
  );
};

export const Route = createFileRoute('/')({
  loader: ({ context }) => (context.viewer === null ? null : loadSeason()),
  component: Home,
});
