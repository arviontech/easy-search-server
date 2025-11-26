import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient, UserStatus } from '@prisma/client';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private jwtService: JwtService, private prisma: PrismaClient) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('No token provided');
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET,
            });

            //check user is exist or not
            const user = await this.prisma.user.findUnique({ where: { id: payload.userId } });
            if (!user) {
                throw new UnauthorizedException('Unauthorized');
            }

            //check user is active or not
            if (user.status === UserStatus.BLOCKED || user.status === UserStatus.INACTIVE) {
                throw new UnauthorizedException('Unauthorized');
            }

            request['user'] = payload;
        } catch (error) {
            throw new UnauthorizedException('Unauthorized');
        }

        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const authHeader = request.headers.authorization || request.headers['authorization'];

        if (!authHeader) {
            return undefined;
        }


        return authHeader;
    }
}