import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
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

  const mockEmployee = {
    id: 'emp-1',
    empCode: 'EMP001',
    name: 'Alice',
    departmentId: 'dept-1',
    salary: 50000,
    joinDate: new Date('2024-01-01'),
    status: 'ACTIVE',
    lastUpdatedDate: new Date('2024-06-01'),
    createdById: 'user-1',
    updatedById: null,
    department: { id: 'dept-1', name: 'Engineering', code: 'ENG' },
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

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return paginated employees with default params', async () => {
      const mockEmployees = [mockEmployee];
      mockPrismaService.employee.findMany.mockResolvedValue(mockEmployees);
      mockPrismaService.employee.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result).toEqual({ data: mockEmployees, total: 1, page: 1, limit: 20 });
      expect(mockPrismaService.employee.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.employee.count).toHaveBeenCalledTimes(1);
    });

    it('should filter by search when provided', async () => {
      mockPrismaService.employee.findMany.mockResolvedValue([mockEmployee]);
      mockPrismaService.employee.count.mockResolvedValue(1);

      await service.findAll({ search: 'Alice' });

      const findManyCall = mockPrismaService.employee.findMany.mock.calls[0][0];
      expect(findManyCall.where).toMatchObject({
        name: { contains: 'Alice', mode: 'insensitive' },
      });
    });

    it('should use safe sort field fallback when invalid sortBy is given', async () => {
      mockPrismaService.employee.findMany.mockResolvedValue([]);
      mockPrismaService.employee.count.mockResolvedValue(0);

      await service.findAll({ sortBy: 'invalid' } as any);

      const findManyCall = mockPrismaService.employee.findMany.mock.calls[0][0];
      expect(findManyCall.orderBy).toEqual({ name: 'asc' });
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return an employee when found', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);

      const result = await service.findOne('emp-1');

      expect(result).toEqual(mockEmployee);
      expect(mockPrismaService.employee.findUnique).toHaveBeenCalledWith({
        where: { id: 'emp-1' },
        include: { department: true },
      });
    });

    it('should throw NotFoundException when employee not found', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(null);

      await expect(service.findOne('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    const createDto: CreateEmployeeDto = {
      empCode: 'EMP001',
      name: 'Alice',
      departmentId: 'dept-1',
      salary: 50000,
      joinDate: '2024-01-01',
      status: 'ACTIVE',
    };

    it('should create and return employee successfully', async () => {
      mockPrismaService.employee.create.mockResolvedValue(mockEmployee);

      const result = await service.create(createDto, 'user-1');

      expect(result).toEqual(mockEmployee);
      expect(mockPrismaService.employee.create).toHaveBeenCalledTimes(1);
      const callArg = mockPrismaService.employee.create.mock.calls[0][0];
      expect(callArg.data.empCode).toBe('EMP001');
      expect(callArg.data.createdById).toBe('user-1');
    });

    it('should throw ConflictException when empCode already exists', async () => {
      mockPrismaService.employee.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.create(createDto, 'user-1')).rejects.toThrow(ConflictException);
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    const updateDto = { name: 'Alice Updated', salary: 60000 };

    it('should update and return employee successfully', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);
      const updatedEmployee = { ...mockEmployee, name: 'Alice Updated', salary: 60000 };
      mockPrismaService.employee.update.mockResolvedValue(updatedEmployee);

      const result = await service.update('emp-1', updateDto, 'user-1');

      expect(result).toEqual(updatedEmployee);
      expect(mockPrismaService.employee.update).toHaveBeenCalledTimes(1);
      const callArg = mockPrismaService.employee.update.mock.calls[0][0];
      expect(callArg.data.updatedById).toBe('user-1');
    });

    it('should throw ConflictException on duplicate empCode during update', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrismaService.employee.update.mockRejectedValue({ code: 'P2002' });

      await expect(service.update('emp-1', { empCode: 'EMP002' }, 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('should delete employee and return success message', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrismaService.employee.delete.mockResolvedValue(mockEmployee);

      const result = await service.remove('emp-1');

      expect(result).toEqual({ message: 'Employee deleted' });
      expect(mockPrismaService.employee.delete).toHaveBeenCalledWith({ where: { id: 'emp-1' } });
    });

    it('should throw NotFoundException when employee not found for remove', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(null);

      await expect(service.remove('not-found')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.employee.delete).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // upsertMany
  // ---------------------------------------------------------------------------
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
