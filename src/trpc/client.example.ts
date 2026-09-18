/**
 * Tiny typed tRPC client.
 *
 * `AppRouter` is a *type-only* import: nothing from the server is bundled at
 * runtime, but the client gets the full input/output contract from it.
 * Try breaking it — `{ id: '1' }` or `user.email.toUpperCaseX()` are compile
 * errors, with no code generation and no schema file in between.
 */
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './trpc.router.js';

const client = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: 'http://localhost:3000/trpc' })],
});

const id = Number(process.argv[2] ?? 1);

// `user` is inferred as { id: number; name: string; email: string }
const user = await client.user.getById.query({ id });

console.log('tRPC user.getById ->', user);
console.log('inferred fields   ->', user.id, user.name.toUpperCase(), user.email);
