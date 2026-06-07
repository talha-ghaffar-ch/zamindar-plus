import { Test, TestingModule } from '@nestjs/testing';
import { ZameenService } from './zameen.service';

describe('ZameenService', () => {
  let service: ZameenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZameenService],
    }).compile();

    service = module.get<ZameenService>(ZameenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
