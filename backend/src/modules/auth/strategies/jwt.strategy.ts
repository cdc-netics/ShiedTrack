import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';

/**
 * Estrategia JWT para autenticación basada en tokens
 * Extrae y valida el token del header Authorization
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {
    // SECURITY FIX H3: No permitir fallback en producción
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET no configurado en producción');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret || 'shieldtrack-secret-key-change-in-production',
    });
  }

  /**
   * Método llamado automáticamente después de verificar el token
   * Valida que el usuario existe y está activo
   */
  async validate(payload: any) {
    const user = await this.userModel.findById(payload.sub).select('-password -mfaSecret');
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    // El objeto retornado se añade a request.user
    return {
      userId: user._id,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
      areaIds: user.areaIds,
    };
  }
}
