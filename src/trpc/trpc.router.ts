import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { UserService } from '../user/user.service.js';
import { publicProcedure, router } from './trpc.base.js';

@Injectable()
export class TrpcRouter {
  // Injected by Nest: the SAME UserService instance the HTTP controller uses.
  constructor(private readonly userService: UserService) {}

  readonly appRouter = router({
    user: router({
      getById: publicProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .query(async ({ input }) => {
          const user = await this.userService.getById(input.id);
          if (!user) {
            throw new TRPCError({ code: 'NOT_FOUND', message: `User ${input.id} not found` });
          }
          return user;
        }),

      create: publicProcedure
        .input(
          z.object({
            name: z.string().min(1),
            email: z.email(),
            gender: z.enum(['male', 'female', 'other']),
            profession: z.string().min(1),
            address: z.string().min(1),
          }),
        )
        .mutation(({ input }) => this.userService.create(input)),
    }),
  });
}

// The typed contract shared with any TypeScript client.
export type AppRouter = TrpcRouter['appRouter'];
