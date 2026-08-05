import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ExtensionService } from './extension.service';
import { CreateExtensionDto } from './dto/create-extension.dto';
import { UpdateExtensionDto } from './dto/update-extension.dto';

@Controller('extension')
export class ExtensionController {
  
  constructor(private readonly extensionService: ExtensionService) {}
  

 // job wise extionlist ta ber koro a api banai daw
  

  
}

