import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { User } from './schemas/user.schema';
import { RegisterUserDto, LoginDto, EnableMfaDto, UpdateUserDto } from './dto/auth.dto';
import { UserRole } from '../../common/enums';
import { UserAreaService } from './user-area.service';
import { EmailService } from '../email/email.service';

/**
 * Servicio de autenticación y gestión de usuarios
 * Maneja registro, login, JWT, MFA y RBAC
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private userAreaService: UserAreaService,
    private emailService: EmailService,
  ) {}

  /**
   * Registra un nuevo usuario en el sistema
   * Los roles administrativos requieren MFA habilitado después del registro
   * 
   * RESTRICCIÓN RBAC: CLIENT_ADMIN solo puede crear ANALYST o VIEWER
   * Si intenta crear ADMIN → 403 Forbidden
   */
  async register(dto: RegisterUserDto, currentUser?: any): Promise<User> {
    // Verificar si el email ya existe
    const existingUser = await this.userModel.findOne({ email: dto.email });
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // RBAC: CLIENT_ADMIN solo puede crear ANALYST o VIEWER
    if (currentUser && currentUser.role === UserRole.CLIENT_ADMIN) {
      const restrictedRoles = [
        UserRole.OWNER,
        UserRole.PLATFORM_ADMIN,
        UserRole.CLIENT_ADMIN,
        UserRole.AREA_ADMIN
      ];

      if (restrictedRoles.includes(dto.role)) {
        throw new ForbiddenException(
          'CLIENT_ADMIN solo puede crear usuarios con rol ANALYST o VIEWER. ' +
          'No tiene permisos para crear otros administradores.'
        );
      }

      // Forzar mismo clientId que el creador
      dto.clientId = currentUser.clientId;
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Crear usuario
    const user = new this.userModel({
      ...dto,
      password: hashedPassword,
    });

    const savedUser = await user.save();

    // Si se proporcionaron áreas, asignarlas
    if (dto.areaIds && dto.areaIds.length > 0) {
      try {
        const assignedBy = currentUser ? currentUser.userId : savedUser._id.toString();
        await this.userAreaService.assignMultipleAreas(
          savedUser._id.toString(),
          dto.areaIds,
          assignedBy
        );
      } catch (areaError) {
        this.logger.error(`Error asignando áreas al usuario ${savedUser._id}: ${areaError.message}`);
      }
    }

    this.logger.log(`Usuario registrado: ${savedUser.email} con rol ${savedUser.role}${currentUser ? ` por ${currentUser.email}` : ''}`);

    // 📧 Enviar email de bienvenida
    try {
      await this.emailService.notifyUserCreated(
        savedUser.email,
        `${savedUser.firstName} ${savedUser.lastName}`,
        savedUser.role,
        dto.password
      );
      this.logger.log(`Email de bienvenida enviado a ${savedUser.email}`);
    } catch (emailError) {
      this.logger.warn(`No se pudo enviar email de bienvenida a ${savedUser.email}: ${emailError.message}`);
      // No fallar el registro si el email falla
    }

    return savedUser;
  }

  /**
   * Autenticación de usuario con soporte para MFA
   */
  async login(dto: LoginDto): Promise<{ accessToken: string; user: Partial<User> }> {
    // Buscar usuario
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar MFA si está habilitado
    if (user.mfaEnabled) {
      if (!dto.mfaToken) {
        throw new UnauthorizedException('Se requiere código MFA');
      }

      if (!user.mfaSecret) {
        throw new UnauthorizedException('MFA no configurado correctamente');
      }

      const isMfaValid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: dto.mfaToken,
        window: 2, // Acepta tokens dentro de un rango de tiempo
      });

      if (!isMfaValid) {
        throw new UnauthorizedException('Código MFA inválido');
      }
    }

    // 🚧 VALIDACIÓN MFA DESHABILITADA PARA DESARROLLO
    // En producción, descomentar para requerir MFA en roles administrativos
    // const adminRoles = [UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.CLIENT_ADMIN];
    // if (adminRoles.includes(user.role) && !user.mfaEnabled) {
    //   this.logger.warn(`Usuario administrativo ${user.email} intenta login sin MFA habilitado`);
    //   throw new UnauthorizedException('MFA obligatorio para usuarios administrativos. Por favor habilite MFA.');
    // }

    // Actualizar último login
    user.lastLogin = new Date();
    
    // Asegurar que el usuario tiene un activeTenantId configurado
    // Para OWNER/PLATFORM_ADMIN: no es obligatorio
    // Para otros roles: usar clientId, o el primer tenantId disponible
    if (!user.activeTenantId && (user.clientId || (user.tenantIds && user.tenantIds.length > 0))) {
      if (user.clientId) {
        user.activeTenantId = user.clientId;
      } else if (user.tenantIds && user.tenantIds.length > 0) {
        user.activeTenantId = user.tenantIds[0];
      }
    }
    
    await user.save();

    // Generar JWT
    const payload = { sub: user._id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`Login exitoso: ${user.email}`);

    return {
      accessToken,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        clientId: user.clientId,
        tenantIds: user.tenantIds,
        activeTenantId: user.activeTenantId,
        mfaEnabled: user.mfaEnabled,
      },
    };
  }

  /**
   * Genera un secreto MFA y devuelve el QR code para escanear
   */
  async setupMfa(userId: string): Promise<{ secret: string; qrCode: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA ya está habilitado');
    }

    // Generar secreto
    const secret = speakeasy.generateSecret({
      name: `ShieldTrack (${user.email})`,
      issuer: 'ShieldTrack',
    });

    // Guardar secreto temporal (se activa después de verificar)
    user.mfaSecret = secret.base32;
    await user.save();

    // Generar QR code
    if (!secret.otpauth_url) {
      throw new BadRequestException('Error al generar OTP URL');
    }
    const qrCode = await qrcode.toDataURL(secret.otpauth_url);

    this.logger.log(`MFA setup iniciado para usuario: ${user.email}`);

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  /**
   * Habilita MFA después de verificar el código
   */
  async enableMfa(userId: string, dto: EnableMfaDto): Promise<{ success: boolean }> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.mfaSecret) {
      throw new BadRequestException('Setup de MFA no iniciado');
    }

    // Verificar código
    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: dto.token,
      window: 2,
    });

    if (!isValid) {
      throw new BadRequestException('Código MFA inválido');
    }

    // Activar MFA
    user.mfaEnabled = true;
    await user.save();

    this.logger.log(`MFA habilitado para usuario: ${user.email}`);

    return { success: true };
  }

  /**
   * Deshabilita MFA (requiere verificación)
   */
  async disableMfa(userId: string, token: string): Promise<{ success: boolean }> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.mfaEnabled) {
      throw new BadRequestException('MFA no está habilitado');
    }

    if (!user.mfaSecret) {
      throw new BadRequestException('MFA no configurado correctamente');
    }

    // Verificar código antes de deshabilitar
    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!isValid) {
      throw new BadRequestException('Código MFA inválido');
    }

    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    await user.save();

    this.logger.log(`MFA deshabilitado para usuario: ${user.email}`);

    return { success: true };
  }

  /**
   * Busca usuario por ID
   */
  async findById(userId: string): Promise<User> {
    return this.userModel.findById(userId).select('-password -mfaSecret');
  }

  /**
   * Actualiza un usuario
   */
  async updateUser(userId: string, dto: UpdateUserDto): Promise<User> {
    const { areaIds, ...updateData } = dto;
    const user = await this.userModel.findByIdAndUpdate(userId, updateData, { new: true }).select('-password -mfaSecret');
    
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (areaIds) {
      try {
        await this.userAreaService.replaceUserAreas(userId, areaIds, userId);
      } catch (error) {
        this.logger.error(`Error actualizando áreas para usuario ${userId}: ${error.message}`);
      }
    }

    this.logger.log(`Usuario actualizado: ${user.email}`);
    return user;
  }

  /**
   * Lista usuarios (con filtros opcionales)
   * Solo muestra usuarios activos (no eliminados lógicamente)
   */
  async findAll(clientId?: string): Promise<User[]> {
    const query: any = { isDeleted: { $ne: true } };
    if (clientId) {
      query.clientId = clientId;
    }
    return this.userModel.find(query).select('-password -mfaSecret');
  }

  /**
   * Eliminar usuario (SOFT DELETE - no eliminación física)
   */
  async deleteUser(userId: string, currentUser: any): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Prevenir eliminación del OWNER
    if (user.role === UserRole.OWNER) {
      throw new ForbiddenException('No se puede eliminar el usuario OWNER');
    }

    // Marcar como eliminado (soft delete)
    user.isDeleted = true;
    user.isActive = false;
    user.deletedAt = new Date();
    user.deletedBy = currentUser.userId;
    await user.save();

    this.logger.warn(`Usuario marcado como eliminado: ${user.email} por ${currentUser.email}`);
    
    return { message: 'Usuario desactivado exitosamente' };
  }

  /**
   * Reactivar usuario eliminado
   */
  async reactivateUser(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    user.isDeleted = false;
    user.isActive = true;
    user.deletedAt = undefined;
    user.deletedBy = undefined;
    await user.save();

    this.logger.log(`Usuario reactivado: ${user.email}`);
    
    return this.userModel.findById(userId).select('-password -mfaSecret');
  }

  /**
   * Cambiar contexto de tenant sin logout (OWNER/PLATFORM_ADMIN)
   * Genera un nuevo JWT con el clientId del tenant seleccionado
   */
  async switchTenant(clientId: string, currentUser: any): Promise<{ accessToken: string; client: any }> {
    // Solo OWNER y PLATFORM_ADMIN pueden cambiar de tenant
    if (!['OWNER', 'PLATFORM_ADMIN'].includes(currentUser.role)) {
      throw new ForbiddenException('No tiene permisos para cambiar de tenant');
    }

    // Verificar que el cliente existe
    const Client = this.userModel.db.collection('clients');
    const client = await Client.findOne({ _id: new this.userModel.base.Types.ObjectId(clientId) });
    
    if (!client) {
      throw new BadRequestException('Cliente no encontrado');
    }

    // Generar nuevo JWT con el clientId del tenant
    const payload = { 
      sub: currentUser.userId, 
      email: currentUser.email, 
      role: currentUser.role,
      clientId: clientId, // Nuevo contexto
    };
    
    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`${currentUser.email} cambió a tenant: ${client.name} (${clientId})`);

    return {
      accessToken,
      client: {
        _id: client._id,
        name: client.name,
        email: client.email,
      },
    };
  }
}
