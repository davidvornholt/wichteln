import { createServerFn } from '@tanstack/react-start';
import { currentPerson } from './current-person';

// Who is looking, for the routes to decide what to show. Never throws.
export const getViewer = createServerFn().handler(() => currentPerson());
