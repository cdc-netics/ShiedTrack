import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FindingUpdateType } from '../../../common/enums';

/**
 * DTO para crear una actualización de hallazgo
 */
export class CreateFindingUpdateDto {
  @ApiProperty({ description: 'ID del hallazgo' })
  @IsString()
  findingId: string;

  @ApiProperty({ enum: FindingUpdateType, example: FindingUpdateType.FOLLOWUP })
  @IsEnum(FindingUpdateType)
  type: FindingUpdateType;

  @ApiProperty({ description: 'Contenido de la actualización' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ type: [String], description: 'IDs de evidencias asociadas' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceIds?: string[];
}
