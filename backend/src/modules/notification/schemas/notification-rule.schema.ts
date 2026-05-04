import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import {
  NotificationChannel,
  NotificationEvent,
  NotificationRecipientType,
  NotificationScope,
} from "../../../common/enums";

export type NotificationRuleDocument = NotificationRule & Document;

@Schema({ _id: false })
export class NotificationRecipient {
  @Prop({ required: true, enum: NotificationRecipientType })
  type: NotificationRecipientType;

  @Prop({ required: true, trim: true })
  value: string;
}

export const NotificationRecipientSchema = SchemaFactory.createForClass(
  NotificationRecipient,
);

@Schema({ timestamps: true })
export class NotificationRule extends Document {
  @Prop({ unique: true, sparse: true, trim: true })
  systemKey?: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, enum: NotificationEvent, index: true })
  event: NotificationEvent;

  @Prop({ required: true, enum: NotificationScope, index: true })
  scope: NotificationScope;

  @Prop({ type: Types.ObjectId, ref: "Tenant", index: true })
  tenantId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Project", index: true })
  projectId?: Types.ObjectId;

  @Prop({ default: true })
  enabled: boolean;

  @Prop({
    required: true,
    enum: NotificationChannel,
    default: NotificationChannel.EMAIL,
  })
  channel: NotificationChannel;

  @Prop({ type: [NotificationRecipientSchema], default: [] })
  recipients: NotificationRecipient[];

  @Prop({ type: Types.ObjectId, ref: "NotificationTemplate" })
  templateId?: Types.ObjectId;

  @Prop({ default: 0 })
  throttleMinutes: number;

  @Prop({ default: true })
  includeContextRecipients: boolean;

  @Prop({ type: Types.ObjectId, ref: "User" })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User" })
  lastModifiedBy?: Types.ObjectId;

  @Prop()
  lastTriggeredAt?: Date;
}

export const NotificationRuleSchema =
  SchemaFactory.createForClass(NotificationRule);

NotificationRuleSchema.index({
  event: 1,
  scope: 1,
  tenantId: 1,
  projectId: 1,
});
