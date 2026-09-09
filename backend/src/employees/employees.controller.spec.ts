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
