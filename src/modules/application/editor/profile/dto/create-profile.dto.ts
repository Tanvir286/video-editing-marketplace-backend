import { IsOptional, IsString } from "class-validator";

export class CreateProfileDto {
  
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    bio?: string;

    @IsString()
    @IsOptional()
    location?: string

    @IsString()
    @IsOptional()
    language?: string;
}
