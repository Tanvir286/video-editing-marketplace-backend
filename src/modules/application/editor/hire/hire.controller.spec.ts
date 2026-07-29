import { Test, TestingModule } from '@nestjs/testing';
import { HireController } from './hire.controller';
import { HireService } from './hire.service';

describe('HireController', () => {
  let controller: HireController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HireController],
      providers: [HireService],
    }).compile();

    controller = module.get<HireController>(HireController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
