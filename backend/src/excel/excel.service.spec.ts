import { Test, TestingModule } from '@nestjs/testing';
import ExcelJS from 'exceljs';
import { ExcelService } from './excel.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('ExcelService', () => {
  let service: ExcelService;
  let mockPrismaService: {
    department: {
      findMany: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    mockPrismaService = {
      department: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'dept-uuid-1', name: 'Engineering' },
          { id: 'dept-uuid-2', name: 'Human Resources' },
        ]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExcelService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ExcelService>(ExcelService);
  });

  describe('exportEmployees', () => {
    it('should export employees to a valid Excel buffer with correct columns and data', async () => {
      const mockEmployees = [
        {
          empCode: 'EMP001',
          name: 'John Doe',
          department: { name: 'Engineering' },
          salary: 50000,
          joinDate: new Date('2024-01-15T00:00:00.000Z'),
          status: 'ACTIVE',
          lastUpdatedDate: new Date('2024-06-01T00:00:00.000Z'),
        },
        {
          empCode: 'EMP002',
          name: 'Jane Smith',
          department: null,
          salary: 60000,
          joinDate: '2024-02-01',
          status: 'INACTIVE',
          lastUpdatedDate: '2024-05-15',
        },
      ];

      const buffer = await service.exportEmployees(mockEmployees);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      // Verify content by reading back with ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const sheet = workbook.getWorksheet('Employees');
      expect(sheet).toBeDefined();

      // Check header row
      const headerRow = sheet!.getRow(1);
      expect(headerRow.getCell(1).value).toBe('ID');
      expect(headerRow.getCell(2).value).toBe('Name');
      expect(headerRow.getCell(3).value).toBe('Department');
      expect(headerRow.getCell(4).value).toBe('Salary');
      expect(headerRow.getCell(5).value).toBe('Join Date');
      expect(headerRow.getCell(6).value).toBe('Status');
      expect(headerRow.getCell(7).value).toBe('Last Updated Date');

      // Check first employee row
      const row2 = sheet!.getRow(2);
      expect(row2.getCell(1).value).toBe('EMP001');
      expect(row2.getCell(2).value).toBe('John Doe');
      expect(row2.getCell(3).value).toBe('Engineering');
      expect(row2.getCell(4).value).toBe(50000);
      expect(row2.getCell(5).value).toBe('2024-01-15');
      expect(row2.getCell(6).value).toBe('ACTIVE');
      expect(row2.getCell(7).value).toBe('2024-06-01');

      // Check second employee row with null department
      const row3 = sheet!.getRow(3);
      expect(row3.getCell(1).value).toBe('EMP002');
      expect(row3.getCell(2).value).toBe('Jane Smith');
      expect(row3.getCell(3).value).toBe('');
      expect(row3.getCell(4).value).toBe(60000);
      expect(row3.getCell(5).value).toBe('2024-02-01');
      expect(row3.getCell(6).value).toBe('INACTIVE');
      expect(row3.getCell(7).value).toBe('2024-05-15');
    });

    it('should export empty employees list with header row only', async () => {
      const buffer = await service.exportEmployees([]);
      expect(buffer).toBeInstanceOf(Buffer);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const sheet = workbook.getWorksheet('Employees');
      expect(sheet).toBeDefined();
      expect(sheet!.rowCount).toBe(1);
    });
  });

  describe('parseAndValidate', () => {
    async function createWorkbookBuffer(rows: any[][]): Promise<Buffer> {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Sheet1');
      sheet.addRow(['ID', 'Name', 'Department', 'Salary', 'Join Date', 'Status', 'Last Updated Date']);
      for (const r of rows) {
        sheet.addRow(r);
      }
      const arrayBuffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(arrayBuffer);
    }

    it('should parse valid rows successfully', async () => {
      const buffer = await createWorkbookBuffer([
        ['EMP001', 'Alice', 'Engineering', 75000, new Date('2024-01-10T00:00:00.000Z'), 'ACTIVE', new Date('2024-05-01T00:00:00.000Z')],
        ['EMP002', 'Bob', 'human resources', '80000', '2024-02-15', 'INACTIVE', '2024-05-10'],
      ]);

      const result = await service.parseAndValidate(buffer);
      expect(result.invalidRows).toHaveLength(0);
      expect(result.validRows).toHaveLength(2);

      expect(result.validRows[0]).toEqual({
        empCode: 'EMP001',
        name: 'Alice',
        departmentId: 'dept-uuid-1',
        salary: 75000,
        joinDate: new Date('2024-01-10T00:00:00.000Z').toISOString(),
        status: 'ACTIVE',
        lastUpdatedDate: new Date('2024-05-01T00:00:00.000Z').toISOString(),
      });

      expect(result.validRows[1]).toEqual({
        empCode: 'EMP002',
        name: 'Bob',
        departmentId: 'dept-uuid-2',
        salary: 80000,
        joinDate: new Date('2024-02-15').toISOString(),
        status: 'INACTIVE',
        lastUpdatedDate: new Date('2024-05-10').toISOString(),
      });
    });

    it('should collect errors for missing or invalid fields into invalidRows', async () => {
      const buffer = await createWorkbookBuffer([
        ['', '', 'NonExistentDept', 'invalid-salary', 'bad-date', 'INVALID_STATUS', 'not-a-date'],
      ]);

      const result = await service.parseAndValidate(buffer);
      expect(result.validRows).toHaveLength(0);
      expect(result.invalidRows).toHaveLength(1);

      const invalidRow = result.invalidRows[0];
      expect(invalidRow.rowNumber).toBe(2);
      expect(invalidRow.reasons).toEqual(
        expect.arrayContaining([
          'ID is required',
          'Name is required',
          "Department 'NonExistentDept' not found in the system",
          'Salary must be a numeric value',
          'Join Date is not a valid date',
          'Last Updated Date is not a valid date',
          "Status must be one of Active, In Active — got 'INVALID_STATUS'",
        ]),
      );
    });

    it('should report missing department when department cell is empty', async () => {
      const buffer = await createWorkbookBuffer([
        ['EMP003', 'Charlie', '', 50000, '2024-01-01', 'ACTIVE', '2024-01-01'],
      ]);

      const result = await service.parseAndValidate(buffer);
      expect(result.validRows).toHaveLength(0);
      expect(result.invalidRows).toHaveLength(1);
      expect(result.invalidRows[0].reasons).toContain('Department is required');
    });

    it('should handle mixed valid and invalid rows properly', async () => {
      const buffer = await createWorkbookBuffer([
        ['EMP001', 'Alice', 'Engineering', 75000, '2024-01-10', 'ACTIVE', '2024-05-01'],
        ['', 'Incomplete', 'Engineering', 50000, '2024-01-10', 'ACTIVE', '2024-05-01'],
        ['EMP003', 'Charlie', 'Engineering', 60000, '2024-01-10', 'INACTIVE', '2024-05-01'],
      ]);

      const result = await service.parseAndValidate(buffer);
      expect(result.validRows).toHaveLength(2);
      expect(result.invalidRows).toHaveLength(1);
      expect(result.validRows[0].empCode).toBe('EMP001');
      expect(result.validRows[1].empCode).toBe('EMP003');
      expect(result.invalidRows[0].rowNumber).toBe(3);
      expect(result.invalidRows[0].reasons).toContain('ID is required');
    });

    it('should handle valid statuses including In Active and Active', async () => {
      const buffer = await createWorkbookBuffer([
        ['E1', 'Emp 1', 'Engineering', 50000, '2024-01-01', 'ACTIVE', '2024-01-01'],
        ['E2', 'Emp 2', 'Engineering', 50000, '2024-01-01', 'In Active', '2024-01-01'],
        ['E3', 'Emp 3', 'Engineering', 50000, '2024-01-01', 'Inactive', '2024-01-01'],
        ['E4', 'Emp 4', 'Engineering', 50000, '2024-01-01', 'Active', '2024-01-01'],
      ]);

      const result = await service.parseAndValidate(buffer);
      expect(result.invalidRows).toHaveLength(0);
      expect(result.validRows).toHaveLength(4);
      expect(result.validRows.map((r) => r.status)).toEqual(['ACTIVE', 'INACTIVE', 'INACTIVE', 'ACTIVE']);
    });
  });
});
