import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { DbModule } from './db/db.module.ts';
import { LoggerMiddleware } from './common/middleware.ts';
import { InvoicesModule } from './invoices/invoices.module.ts';

@Module({
  imports: [AuthModule, DbModule, InvoicesModule],
  controllers: [AppController],
  providers: [AppService],

})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}