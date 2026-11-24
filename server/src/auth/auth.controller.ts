import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthSchema, type AuthType } from './login.schema.ts';
import { AuthService } from './auth.service.ts';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) { };

    @Post('login')
    @HttpCode(200)
    async login(@Body({ schema: AuthSchema }) body: AuthType) {
        return this.authService.login(body);
    }
}