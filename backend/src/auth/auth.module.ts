import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { LdapService } from './ldap.service';
import { JwtStrategy } from './jwt.strategy';
import { jwtConstants } from './jwt.constants';
import { PrismaService } from '../common/prisma.service';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: {
                expiresIn: jwtConstants.accessTokenExpiration,
            },
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        UserService,
        LdapService,
        JwtStrategy,
    ],
    exports: [AuthService, UserService, LdapService, JwtModule, PassportModule],
})
export class AuthModule { }
