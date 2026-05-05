import { ArrayNotEmpty, IsArray, IsMongoId } from "class-validator";

export class AssignVisibleProjectsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  visibleProjectIds!: string[];
}
