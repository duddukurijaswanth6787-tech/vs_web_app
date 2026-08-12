import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { CartRepository } from './cart.repository';
import { AuditService } from '@domains/audit/audit.service';
import { PrismaService } from '@database/prisma.service';

describe('CartService', () => {
  let service: CartService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: CartRepository,
          useValue: {
            getCartByUser: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
