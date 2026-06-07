import { Test, TestingModule } from '@nestjs/testing';
import { ZameenController } from './zameen.controller';

describe('ZameenController', () => {
  let controller: ZameenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ZameenController],
    }).compile();

    controller = module.get<ZameenController>(ZameenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
