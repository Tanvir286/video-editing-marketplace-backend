import { PartialType } from '@nestjs/mapped-types';
import { CreateHireDto } from './create-hire.dto';

export class UpdateHireDto extends PartialType(CreateHireDto) {}