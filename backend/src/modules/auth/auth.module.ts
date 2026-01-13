import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserAreaService } from './user-area.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User, UserSchema } from './schemas/user.schema';
import { UserAreaAssignment, UserAreaAssignmentSchema } from './schemas/user-area-assignment.schema';
import { Area, AreaSchema } from '../area/schemas/area.schema';
import { EmailModule } from '../email/email.module';

/**
 * Módulo de autenticación
 * Maneja registro, login, MFA y JWT
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserAreaAssignment.name, schema: UserAreaAssignmentSchema },
      { name: Area.name, schema: AreaSchema },
    ]),
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'shieldtrack-secret-key-change-in-production',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '8h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, UserAreaService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, UserAreaService, JwtStrategy],
})
export class AuthModule {}
