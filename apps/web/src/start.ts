import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';

// Pages and server functions answer for the signed-in person, with their
// recipient and wishes, so neither the browser nor a cache on the way keeps
// a copy. The hashed assets never reach this, so they keep their long cache.
const noStore = createMiddleware().server(({ next }) => {
  setResponseHeader('cache-control', 'private, no-store');
  return next();
});

export const startInstance = createStart(() => ({
  requestMiddleware: [
    // Start checks the origin of server function calls only while no start
    // file lists middleware of its own, so this one lists that check too.
    createCsrfMiddleware({
      filter: ({ handlerType }) => handlerType === 'serverFn',
    }),
    noStore,
  ],
}));
