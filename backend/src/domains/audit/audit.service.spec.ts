import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { AuditRepository } from './audit.repository';
import { LoggerService } from '@common/logger/logger.service';

describe('AuditService', () => {
  let service: AuditService;
  let repository: AuditRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: AuditRepository,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
          },
        },
        {
          provide: LoggerService,
          useValue: { log: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repository = module.get<AuditRepository>(AuditRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log audit event', async () => {
    await service.log({
      action: 'TEST',
      module: 'test',
      resource: 'test',
      userId: 'user-1',
    });
    expect(repository.create).toHaveBeenCalled();
  });
});
