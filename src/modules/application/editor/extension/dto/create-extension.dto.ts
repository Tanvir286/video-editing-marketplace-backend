import { IsInt, IsString, MaxLength, Min } from 'class-validator';

export class CreateExtensionDto {
  @IsString()
  @MaxLength(500)
  message: string;

  @IsInt()
  @Min(1)
  extension_days: number;
}
