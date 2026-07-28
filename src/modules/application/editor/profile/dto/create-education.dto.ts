import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class  CreateEducationDto {
  @ApiProperty({ example: 'Bachelor of Science' })
  @IsNotEmpty()
  @IsString()
  course_name: string;

  @ApiProperty({ example: 'Computer Science' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ example: 2023 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  passing_year: number;
}
