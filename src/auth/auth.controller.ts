import { Body, Controller, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateUserSchema } from '../user/userDto/userSchema.dto';
import type { TLogin, TRegistration } from './authDto/authSchema';
import { sendResponse } from '../common/utils/sendResponse';
import { LoginSchema } from './authDto/authDto.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body(new ZodValidationPipe(CreateUserSchema)) payload: TRegistration, @Res({ passthrough: true }) res: Response) {
        const response = await this.authService.registration(payload)

        res.cookie('refreshToken', response.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return sendResponse({
            statusCode: 200,
            success: true,
            message: 'Account created successfully',
            data: {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken
            }
        })
    }

    @Post('login')
    async login(@Body(new ZodValidationPipe(LoginSchema)) payload: TLogin, @Res({ passthrough: true }) res: Response) {
        const response = await this.authService.login(payload)

        res.cookie('refreshToken', response.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return sendResponse({
            statusCode: 200,
            success: true,
            message: 'Login successful',
            data: {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken
            }
        })
    }

    @Post('refresh-token')
    async refreshToken(@Body() payload: { refreshToken: string }, @Res({ passthrough: true }) res: Response) {
        const refreshToken = payload.refreshToken
        const response = await this.authService.refreshToken(refreshToken)

        return sendResponse({
            statusCode: 200,
            success: true,
            message: 'Refresh token successful',
            data: {
                accessToken: response.accessToken,
            }
        })
    }

    @Post('logout')
    async logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
        const userId = req?.user?.userId
        if (!userId) {
            throw new UnauthorizedException('User not found')
        }
        const response = await this.authService.logout(userId)
        res.clearCookie('refreshToken')
        return sendResponse({
            statusCode: 200,
            success: true,
            message: 'Logout successful',
        })
    }
}
