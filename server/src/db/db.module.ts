import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { db } from './db.ts';

export const DB = 'DB';
export type Db = typeof db;

@Global()
@Module({
    providers: [{ provide: DB, useValue: db }],
    exports: [DB],
})
export class DbModule implements OnApplicationShutdown {
    async onApplicationShutdown() {
        await db.close();
    }
}