import { Test, TestingModule } from '@nestjs/testing';
import { StaffService } from './staff.service';
import { StaffRepository } from './staff.repository';
import { PasswordService } from '@domains/auth/services/password.service';
import { PrismaService } from '@database/prisma.service';
import { LoggerService } from '@common/logger/logger.service';

describe('StaffService', () => {
  let service: StaffService;
  let repository: StaffRepository;

  const mockStaffProfile = {
    id: 'staff-123',
    userId: 'user-123',
    department: 'SALES',
    designation: 'ASSOCIATE',
    employeeId: 'EMP-0001',
    employmentStatus: 'ACTIVE',
    createdAt: new Date(),
    user: {
      id: 'user-123',
      email: 'staff@example.com',
      firstName: 'Ravi',
      lastName: 'Teja',
      phone: '+91 9876543210',
      accountStatus: 'ACTIVE',
      createdAt: new Date(),
    },
  };

  const mockAttendance = {
    id: 'att-123',
    staffProfileId: 'staff-123',
    date: new Date().toISOString().split('T')[0],
    punchInAt: new Date(Date.now() - 4 * 3600000),
    punchOutAt: null,
    totalHours: 0,
    breakMinutes: 0,
    status: 'PRESENT',
    shiftType: 'GENERAL',
    staffProfile: mockStaffProfile,
  };

  const mockTask = {
    id: 'task-123',
    staffProfileId: 'staff-123',
    title: 'Organize festive sarees rack',
    description: 'Ensure all new arrivals have barcodes',
    priority: 'HIGH',
    status: 'PENDING',
    createdAt: new Date(),
    staffProfile: mockStaffProfile,
    assignedBy: { firstName: 'Admin', lastName: 'User', email: 'admin@vasanthi.in' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffService,
        {
          provide: StaffRepository,
          useValue: {
            findAll: jest.fn().mockResolvedValue({ data: [mockStaffProfile], meta: {} }),
            findById: jest.fn().mockResolvedValue(mockStaffProfile),
            findByUserId: jest.fn().mockResolvedValue(mockStaffProfile),
            findByEmployeeId: jest.fn().mockResolvedValue(null),
            generateEmployeeId: jest.fn().mockResolvedValue('EMP-0001'),
            create: jest.fn().mockResolvedValue(mockStaffProfile),
            update: jest.fn().mockResolvedValue(mockStaffProfile),
            findAttendanceByStaffAndDate: jest.fn().mockResolvedValue(null),
            createAttendance: jest.fn().mockResolvedValue(mockAttendance),
            updateAttendance: jest.fn().mockResolvedValue({ ...mockAttendance, punchOutAt: new Date(), totalHours: 4 }),
            findAttendanceList: jest.fn().mockResolvedValue([mockAttendance]),
            createTask: jest.fn().mockResolvedValue(mockTask),
            updateTask: jest.fn().mockResolvedValue({ ...mockTask, status: 'COMPLETED' }),
            findTaskById: jest.fn().mockResolvedValue(mockTask),
            findTasks: jest.fn().mockResolvedValue([mockTask]),
          },
        },
        {
          provide: PasswordService,
          useValue: { hash: jest.fn().mockResolvedValue('hashed_pwd') },
        },
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn().mockResolvedValue(mockStaffProfile.user) },
            staffProfile: { findMany: jest.fn().mockResolvedValue([mockStaffProfile]) },
          },
        },
        {
          provide: LoggerService,
          useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<StaffService>(StaffService);
    repository = module.get<StaffRepository>(StaffRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should punch in daily attendance for staff', async () => {
    const result = await service.punchIn('user-123', { shiftType: 'GENERAL', location: 'Main Store' });
    expect(result).toBeDefined();
    expect(result.staffProfileId).toBe('staff-123');
    expect(repository.createAttendance).toHaveBeenCalled();
  });

  it('should punch out daily attendance for staff and calculate total hours', async () => {
    jest.spyOn(repository, 'findAttendanceByStaffAndDate').mockResolvedValueOnce(mockAttendance as any);
    const result = await service.punchOut('user-123', { notes: 'Shift completed' });
    expect(result).toBeDefined();
    expect(repository.updateAttendance).toHaveBeenCalled();
  });

  it('should create and assign a staff task', async () => {
    const result = await service.createTask(
      { staffProfileId: 'staff-123', title: 'Inventory count', priority: 'HIGH' },
      'admin-123',
    );
    expect(result.title).toBe('Organize festive sarees rack');
    expect(repository.createTask).toHaveBeenCalled();
  });

  it('should get live attendance roster for super admin', async () => {
    const roster = await service.getAdminLiveRoster();
    expect(roster.stats).toBeDefined();
    expect(roster.roster.length).toBeGreaterThan(0);
  });

  it('should generate staff performance report with attendance and task metrics', async () => {
    const report = await service.getStaffPerformanceReport('staff-123');
    expect(report.staffProfileId).toBe('staff-123');
    expect(report.totalWorkingDays).toBe(26);
    expect(report.taskCompletionRatePercent).toBeDefined();
  });
});
