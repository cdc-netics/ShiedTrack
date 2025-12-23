import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as crypto from 'crypto';

/**
 * Entidad SystemConfig
 * Almacena configuración global del sistema (credenciales SMTP encriptadas)
 * SOLO accesible por rol OWNER
 */
@Schema({ timestamps: true })
export class SystemConfig extends Document {
  @Prop({ required: true, unique: true, default: 'smtp_config' })
  configKey: string; // Identificador único de configuración

  // Credenciales SMTP encriptadas
  @Prop({ required: true })
  smtp_host: string;

  @Prop({ required: true })
  smtp_port: number;

  @Prop({ required: true })
  smtp_secure: boolean; // true para 465, false para 587

  @Prop({ required: true })
  smtp_user_encrypted: string; // Usuario encriptado

  @Prop({ required: true })
  smtp_pass_encrypted: string; // Contraseña encriptada

  @Prop()
  smtp_from_email: string; // Email remitente (ej: noreply@shieldtrack.com)

  @Prop()
  smtp_from_name: string; // Nombre remitente (ej: ShieldTrack Notificaciones)

  @Prop({ type: Types.ObjectId, ref: 'User' })
  lastModifiedBy?: Types.ObjectId; // Usuario que modificó por última vez

  // Timestamps automáticos: createdAt, updatedAt
}

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);

// Clave de encriptación (en producción debe estar en variable de entorno segura)
const ENCRYPTION_KEY = process.env.SMTP_ENCRYPTION_KEY || 'default-32-char-encryption-key!!'; // 32 caracteres
const ENCRYPTION_IV_LENGTH = 16;

/**
 * Función utilitaria para encriptar texto
 * Usa AES-256-CBC para encriptar credenciales SMTP
 */
export function encryptText(text: string): string {
  const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
    iv
  );
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Función utilitaria para desencriptar texto
 * Desencripta credenciales SMTP almacenadas
 */
export function decryptText(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedText = parts.join(':');
  
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
    iv
  );
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Método estático para encriptar texto
 */
SystemConfigSchema.statics.encrypt = encryptText;

/**
 * Método estático para desencriptar texto
 */
SystemConfigSchema.statics.decrypt = decryptText;

/**
 * Método de instancia para obtener credenciales desencriptadas
 * Retorna objeto con credenciales listas para nodemailer
 */
SystemConfigSchema.methods.getDecryptedCredentials = function() {
  return {
    host: this.smtp_host,
    port: this.smtp_port,
    secure: this.smtp_secure,
    auth: {
      user: decryptText(this.smtp_user_encrypted),
      pass: decryptText(this.smtp_pass_encrypted)
    },
    from: {
      email: this.smtp_from_email,
      name: this.smtp_from_name
    }
  };
};

// Índice único para configKey
SystemConfigSchema.index({ configKey: 1 }, { unique: true });
