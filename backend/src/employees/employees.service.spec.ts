import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesService } from './employees.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let mockPrismaService: {
    employee: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      upsert: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockPrismaService = {
      employee: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        upsert: vi.fn().mockImplementation((args) => args),
      },
      $transaction: vi.fn().mockImplementation(async (ops) => {
        if (Array.isArray(ops)) return ops;
        return [];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  describe('upsertMany', () => {
    it('should return { upserted: 0 } gracefully when rows array is empty', async () => {
      const result = await service.upsertMany([], 'user-1');
      expect(result).toEqual({ upserted: 0 });
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should return { upserted: 0 } gracefully when rows is undefined/null', async () => {
      const result = await service.upsertMany(undefined as any, 'user-1');
      expect(result).toEqual({ upserted: 0 });
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should batch upsert operations in prisma.$transaction', async () => {
      const rows: CreateEmployeeDto[] = [
        {
          empCode: 'EMP001',
          name: 'John Doe',
          departmentId: 'dept-1',
          salary: 50000,
          joinDate: '2024-01-01',
          status: 'ACTIVE',
          lastUpdatedDate: '2024-06-01',
        },
        {
          empCode: 'EMP002',
          name: 'Jane Smith',
          departmentId: 'dept-2',
          salary: 60000,
          joinDate: '2024-02-01',
          status: 'INACTIVE',
        },
      ];

      const result = await service.upsertMany(rows, 'user-1');
      expect(mockPrismaService.employee.upsert).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ upserted: 2 });
    });
  });
});
