import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { AuthType, UserSchema } from './login.schema.ts';
import * as dbModule from '../db/db.module.ts';
import bcrypt from "bcrypt";
import { UserType } from './login.schema.ts';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

    constructor(
        @Inject(dbModule.DB)
        private readonly db: dbModule.Db,
        private readonly jwt: JwtService
    ) { };

    async login({ email, password }: AuthType) {
        const users = this.db.orm.public.User;
        const user: UserType | null = await users.where({ email: email }).first();
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException('Invalid email or password');
        }
        return {
            accessToken: await this.jwt.signAsync({ sub: user.id, email: user.email }),
            user: { id: user.id, email: user.email, name: user.name },
        };
    };
}
