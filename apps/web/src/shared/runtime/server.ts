import { PgLive } from '@wichteln/db/client';
import { Layer, ManagedRuntime } from 'effect';
import { AccessRepositoryLive } from '../auth/access-repository';

// One runtime per server process, so every request shares one pool. Features
// provide their repositories per request on top of its Database.
export const serverRuntime = ManagedRuntime.make(
  AccessRepositoryLive.pipe(Layer.provideMerge(PgLive)),
);
