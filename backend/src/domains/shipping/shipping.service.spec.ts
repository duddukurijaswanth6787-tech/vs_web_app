import { Test, TestingModule } from '@nestjs/testing';
import { ShippingService } from './shipping.service';
import { ShippingRepository } from './shipping.repository';
import { AuditService } from '@domains/audit/audit.service';

describe('ShippingService', () => {
  let service: ShippingService;
  let repository: ShippingRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShippingService,
        {
          provide: ShippingRepository,
          useValue: {
            findMethods: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ShippingService>(ShippingService);
    repository = module.get<ShippingRepository>(ShippingRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get shipping methods', async () => {
    const result = await service.getMethods();
    expect(result).toEqual([]);
    expect(repository.findMethods).toHaveBeenCalled();
  });
});
