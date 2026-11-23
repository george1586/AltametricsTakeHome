import 'dotenv/config';
import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./prisma/contract.prisma",
    output: "./src/db",
    db: {
      connection: process.env['DATABASE_URL']!,
    },
  }),
});
