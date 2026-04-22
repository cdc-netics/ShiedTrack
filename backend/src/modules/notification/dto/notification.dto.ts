import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  NotificationChannel,
  NotificationEvent,
  NotificationRecipientType,
  NotificationScope,
} from '../../../common/enums';

export class NotificationRecipientDto {
  @IsEnum(NotificationRecipientType)
  type: NotificationRecipientType;

  @IsString()
  value: string;
}

export class CreateNotificationTemplateDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsEnum(NotificationEvent)
  event: NotificationEvent;

  @IsOptional()
  @IsEnum(NotificationScope)
  scope?: NotificationScope;

  @IsOptional()
  @IsMongoId()
  tenantId?: string;

  @IsString()
  subject: string;

  @IsString()
  bodyHtml: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateNotificationTemplateDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(NotificationEvent)
  event?: NotificationEvent;

  @IsOptional()
  @IsEnum(NotificationScope)
  scope?: NotificationScope;

  @IsOptional()
  @IsMongoId()
  tenantId?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  bodyHtml?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateNotificationRuleDto {
  @IsString()
  name: string;

  @IsEnum(NotificationEvent)
  event: NotificationEvent;

  @IsEnum(NotificationScope)
  scope: NotificationScope;

  @IsOptional()
  @IsMongoId()
  tenantId?: string;

  @IsOptional()
  @IsMongoId()
  projectId?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationRecipientDto)
  recipients?: NotificationRecipientDto[];

  @IsOptional()
  @IsMongoId()
  templateId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  throttleMinutes?: number;

  @IsOptional()
  @IsBoolean()
  includeContextRecipients?: boolean;
}

export class UpdateNotificationRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(NotificationEvent)
  event?: NotificationEvent;

  @IsOptional()
  @IsEnum(NotificationScope)
  scope?: NotificationScope;

  @IsOptional()
  @IsMongoId()
  tenantId?: string;

  @IsOptional()
  @IsMongoId()
  projectId?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationRecipientDto)
  recipients?: NotificationRecipientDto[];

  @IsOptional()
  @IsMongoId()
  templateId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  throttleMinutes?: number;

  @IsOptional()
  @IsBoolean()
  includeContextRecipients?: boolean;
}

export class ListNotificationRulesDto {
  @IsOptional()
  @IsEnum(NotificationEvent)
  event?: NotificationEvent;

  @IsOptional()
  @IsEnum(NotificationScope)
  scope?: NotificationScope;
}

export class ListNotificationTemplatesDto {
  @IsOptional()
  @IsEnum(NotificationEvent)
  event?: NotificationEvent;

  @IsOptional()
  @IsEnum(NotificationScope)
  scope?: NotificationScope;
}
