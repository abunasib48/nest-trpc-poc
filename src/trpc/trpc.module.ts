import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { UserModule } from '../user/user.module.js';
import { TrpcRouter } from './trpc.router.js';

@Module({
  imports: [UserModule],
  providers: [TrpcRouter],
})
export class TrpcModule implements NestModule {
  constructor(private readonly trpcRouter: TrpcRouter) {}

  // Mounts the tRPC HTTP handler inside the very same Nest/Express server.
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(createExpressMiddleware({ router: this.trpcRouter.appRouter }))
      .forRoutes('/trpc');
  }
}
