import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EmployeesController } from './employees.controller.js';
import { EmployeesService } from './employees.service.js';
import { ExcelService } from '../excel/excel.service.js';
import { ImportCommitDto } from './dto/import-commit.dto.js';

describe('EmployeesController', () => {
  let controller: EmployeesController;
  let mockEmployeesService: {
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    upsertMany: ReturnType<typeof vi.fn>;
  };
  let mockExcelService: {
    exportEmployees: ReturnType<typeof vi.fn>;
    parseAndValidate: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockEmployeesService = {
      findAll: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      upsertMany: vi.fn().mockResolvedValue({ upserted: 2 }),
    };

    mockExcelService = {
      exportEmployees: vi.fn(),
      parseAndValidate: vi.fn().mockResolvedValue({ validRows: [], invalidRows: [] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [
        {
          provide: EmployeesService,
          useValue: mockEmployeesService,
        },
        {
          provide: ExcelService,
          useValue: mockExcelService,
        },
      ],
    }).compile();

    controller = module.get<EmployeesController>(EmployeesController);
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should call employeesService.findAll with query and return result', async () => {
      const mockResult = { data: [], total: 0, page: 1, limit: 10 };
      mockEmployeesService.findAll.mockResolvedValue(mockResult);

      const query = { page: 1, limit: 10 } as any;
      const result = await controller.findAll(query);

      expect(mockEmployeesService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResult);
    });
  });

  // ---------------------------------------------------------------------------
  // export
  // ---------------------------------------------------------------------------
  describe('export', () => {
    it('should export employees to excel buffer and set appropriate response headers', async () => {
      const mockBuffer = Buffer.from('mock-excel-binary');
      mockEmployeesService.findAll.mockResolvedValue({ data: [{ id: 'emp-1', name: 'Alice' }] });
      mockExcelService.exportEmployees.mockResolvedValue(mockBuffer);

      const res = {
        setHeader: vi.fn(),
        send: vi.fn(),
      } as any;

      await controller.export({} as any, res);

      expect(mockEmployeesService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100000, page: 1, sortBy: 'empCode', order: 'asc' }),
      );
      expect(mockExcelService.exportEmployees).toHaveBeenCalledWith([{ id: 'emp-1', name: 'Alice' }]);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="employees.xlsx"',
      );
      expect(res.send).toHaveBeenCalledWith(mockBuffer);
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    it('should call employeesService.findOne with id and return employee', async () => {
      const mockEmployee = { id: 'emp-1', name: 'Alice' };
      mockEmployeesService.findOne.mockResolvedValue(mockEmployee);

      const result = await controller.findOne('emp-1');

      expect(mockEmployeesService.findOne).toHaveBeenCalledWith('emp-1');
      expect(result).toEqual(mockEmployee);
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should call employeesService.create with dto and user id', async () => {
      const mockEmployee = { id: 'emp-1', name: 'Alice' };
      mockEmployeesService.create.mockResolvedValue(mockEmployee);

      const dto = {
        empCode: 'EMP001',
        name: 'Alice',
        departmentId: 'dept-1',
        salary: 50000,
        joinDate: '2024-01-01',
        status: 'ACTIVE',
      } as any;
      const user = { id: 'user-123' };

      const result = await controller.create(dto, user);

      expect(mockEmployeesService.create).toHaveBeenCalledWith(dto, 'user-123');
      expect(result).toEqual(mockEmployee);
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should call employeesService.update with id, dto, and user id', async () => {
      const mockEmployee = { id: 'emp-1', name: 'Alice Updated' };
      mockEmployeesService.update.mockResolvedValue(mockEmployee);

      const dto = { name: 'Alice Updated' } as any;
      const user = { id: 'user-123' };

      const result = await controller.update('emp-1', dto, user);

      expect(mockEmployeesService.update).toHaveBeenCalledWith('emp-1', dto, 'user-123');
      expect(result).toEqual(mockEmployee);
    });
  });

  // ---------------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('should call employeesService.remove with id and return success message', async () => {
      const mockResult = { message: 'Employee deleted' };
      mockEmployeesService.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('emp-1');

      expect(mockEmployeesService.remove).toHaveBeenCalledWith('emp-1');
      expect(result).toEqual(mockResult);
    });
  });

  // ---------------------------------------------------------------------------
  // import
  // ---------------------------------------------------------------------------
  describe('import', () => {
    it('should throw BadRequestException when no file is uploaded', async () => {
      await expect(controller.import(undefined)).rejects.toThrow(BadRequestException);
      await expect(controller.import(undefined)).rejects.toThrow('Please provide an .xlsx file');
    });

    it('should throw BadRequestException when file has no buffer', async () => {
      const mockFile = {} as Express.Multer.File;
      await expect(controller.import(mockFile)).rejects.toThrow(BadRequestException);
    });

    it('should parse and validate file buffer when valid file is provided', async () => {
      const mockBuffer = Buffer.from('test-excel-data');
      const mockFile = { buffer: mockBuffer } as Express.Multer.File;

      const result = await controller.import(mockFile);
      expect(mockExcelService.parseAndValidate).toHaveBeenCalledWith(mockBuffer);
      expect(result).toEqual({ validRows: [], invalidRows: [] });
    });
  });

  // ---------------------------------------------------------------------------
  // importCommit
  // ---------------------------------------------------------------------------
  describe('importCommit', () => {
    it('should call employeesService.upsertMany with validRows and user id', async () => {
      const dto: ImportCommitDto = {
        validRows: [
          {
            empCode: 'EMP001',
            name: 'John Doe',
            departmentId: 'dept-1',
            salary: 50000,
            joinDate: '2024-01-01',
            status: 'ACTIVE',
          },
        ],
      };

      const result = await controller.importCommit(dto, { id: 'user-123' });
      expect(mockEmployeesService.upsertMany).toHaveBeenCalledWith(dto.validRows, 'user-123');
      expect(result).toEqual({ upserted: 2 });
    });
  });
});
