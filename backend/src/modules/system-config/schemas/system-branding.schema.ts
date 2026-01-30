import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Schema para configuración de branding del sistema
 * Permite personalizar favicon, logo y colores
 */
@Schema({ timestamps: true })
export class SystemBranding extends Document {
  @Prop({ required: true, default: 'ShieldTrack' })
  appName: string;

  @Prop()
  faviconUrl?: string;

  @Prop()
  logoUrl?: string;

  @Prop({ default: '#1976d2' })
  primaryColor: string;

  @Prop({ default: '#424242' })
  secondaryColor: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastModifiedBy?: string;
}

export const SystemBrandingSchema = SchemaFactory.createForClass(SystemBranding);
