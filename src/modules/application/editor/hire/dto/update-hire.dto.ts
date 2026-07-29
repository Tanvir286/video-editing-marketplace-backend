import { PartialType } from '@nestjs/swagger';
import { CreateHireDto } from './create-hire.dto';

export class UpdateHireDto extends PartialType(CreateHireDto) {}
