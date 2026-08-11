import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { AuditService } from '@domains/audit/audit.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let repository: NotificationRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: NotificationRepository,
          useValue: {
            getUnreadCount: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    repository = module.get<NotificationRepository>(NotificationRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get unread count', async () => {
    const userId = 'user-1';
    const result = await service.getUnreadCount(userId);
    expect(result).toBe(0);
    expect(repository.getUnreadCount).toHaveBeenCalledWith(userId);
  });
});
