import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../../../common/enums';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true })
  firstName!: string;

  @Prop({ required: true })
  lastName!: string;

  @Prop({ required: true, enum: UserRole })
  role!: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'Client' })
  clientId?: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'Area', default: [] })
  areaIds!: Types.ObjectId[];

  // NUEVO: proyectos visibles por usuario
  @Prop({ type: [Types.ObjectId], ref: 'Project', default: [] })
  visibleProjectIds!: Types.ObjectId[];

  @Prop({ default: false })
  mfaEnabled!: boolean;

  @Prop()
  mfaSecret?: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy?: Types.ObjectId;

  @Prop()
  lastLogin?: Date;

  @Prop({ type: [Types.ObjectId], ref: 'Tenant', default: [] })
  tenantIds?: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Tenant' })
  activeTenantId?: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 });
UserSchema.index({ clientId: 1, role: 1 });
UserSchema.index({ visibleProjectIds: 1 });