import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { NotificationEvent, NotificationScope } from "../../../common/enums";

export type NotificationTemplateDocument = NotificationTemplate & Document;

@Schema({ timestamps: true })
export class NotificationTemplate extends Document {
  @Prop({ required: true, unique: true, trim: true, index: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, enum: NotificationEvent, index: true })
  event: NotificationEvent;

  @Prop({
    required: true,
    enum: [NotificationScope.GLOBAL, NotificationScope.TENANT],
    default: NotificationScope.GLOBAL,
    index: true,
  })
  scope: NotificationScope;

  @Prop({ type: Types.ObjectId, ref: "Tenant", index: true })
  tenantId?: Types.ObjectId;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  bodyHtml: string;

  @Prop({ type: [String], default: [] })
  variables: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: "User" })
  createdBy?: Types.ObjectId;
}

export const NotificationTemplateSchema =
  SchemaFactory.createForClass(NotificationTemplate);

NotificationTemplateSchema.index({
  event: 1,
  scope: 1,
  tenantId: 1,
  isActive: 1,
});
