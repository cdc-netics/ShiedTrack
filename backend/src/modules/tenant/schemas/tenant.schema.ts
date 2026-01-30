import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Tenant extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ unique: true, sparse: true })
  code?: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object })
  branding?: {
    displayName?: string;
    logoUrl?: string;
    primaryColor?: string;
  };

  @Prop({ type: Object })
  settings?: Record<string, any>;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
TenantSchema.index({ isActive: 1 });