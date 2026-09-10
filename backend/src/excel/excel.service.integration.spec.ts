import { Test, TestingModule } from '@nestjs/testing';
import ExcelJS from 'exceljs';
import { ExcelService } from './excel.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('ExcelService (integration)', () => {
  let service: ExcelService;
  let mockPrismaService: {
    department: {
      findMany: ReturnType<typeof vi.fn>;
    };
  };

  /**
   * Helper: build a real Excel workbook buffer from a 2D array of rows.
   * First row is always the standard header; additional rows are data rows.
   */
  async function createWorkbookBuffer(rows: unknown[][]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sheet1');
    sheet.addRow(['ID', 'Name', 'Department', 'Salary', 'Join Date', 'Status', 'Last Updated Date']);
    for (const r of rows) {
      sheet.addRow(r);
    }
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  beforeEach(async () => {
    // Default mock — individual tests override where needed
    mockPrismaService = {
      department: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'dept-1', name: 'Engineering', code: 'ENG' },
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

  // ─── Test 1: Excel serial date number ────────────────────────────────────────
  describe('Excel serial date number', () => {
    it('should parse a numeric serial date (e.g. 45292) to a valid ISO string joinDate', async () => {
      // 45292 is the Excel serial for 2024-01-10 (days since 1899-12-30)
      const serialDate = 45292;

      const buffer = await createWorkbookBuffer([
        ['EMP001', 'Alice', 'Engineering', 75000, serialDate, 'ACTIVE', serialDate],
      ]);

      const result = await service.parseAndValidate(buffer);

      expect(result.invalidRows).toHaveLength(0);
      expect(result.validRows).toHaveLength(1);

      const { joinDate } = result.validRows[0];
      // Must be a valid ISO string (parseable by Date)
      const parsed = new Date(joinDate);
      expect(isNaN(parsed.getTime())).toBe(false);
      // The serial 45292 corresponds to 2024-01-01
      expect(joinDate).toMatch(/^2024-01-01/);
    });
  });

  // ─── Test 2: Formula cell result object ──────────────────────────────────────
  describe('formula cell (result object)', () => {
    it('should parse salary from a formula cell { formula, result } object', async () => {
      // Build the workbook manually so we can set a formula-result object directly
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Sheet1');

      // Header row
      sheet.addRow(['ID', 'Name', 'Department', 'Salary', 'Join Date', 'Status', 'Last Updated Date']);

      // Data row: set salary cell to a formula result object
      const dataRow = sheet.addRow([
        'EMP002',
        'Bob',
        'Engineering',
        null, // placeholder — will be replaced below
        '2024-02-15',
        'ACTIVE',
        '2024-05-10',
      ]);
      // Simulate ExcelJS formula cell value (what ExcelJS reads back from xlsx with cached results)
      dataRow.getCell(4).value = { formula: '=C2*1000', result: 50000 } as any;

      const arrayBuffer = await workbook.xlsx.writeBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await service.parseAndValidate(buffer);

      expect(result.invalidRows).toHaveLength(0);
      expect(result.validRows).toHaveLength(1);
      expect(result.validRows[0].salary).toBe(50000);
    });
  });

  // ─── Test 3: Empty workbook (no data rows) ────────────────────────────────────
  describe('empty workbook (no data rows)', () => {
    it('should return { validRows: [], invalidRows: [] } for a sheet with only a header row', async () => {
      // createWorkbookBuffer with zero data rows => only header
      const buffer = await createWorkbookBuffer([]);

      const result = await service.parseAndValidate(buffer);

      expect(result.validRows).toHaveLength(0);
      expect(result.invalidRows).toHaveLength(0);
    });

    it('should return { validRows: [], invalidRows: [] } for a completely empty workbook', async () => {
      // Workbook with one sheet and no rows at all
      const workbook = new ExcelJS.Workbook();
      workbook.addWorksheet('Empty');
      const arrayBuffer = await workbook.xlsx.writeBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await service.parseAndValidate(buffer);

      expect(result.validRows).toHaveLength(0);
      expect(result.invalidRows).toHaveLength(0);
    });
  });

  // ─── Test 4: Department lookup by code ───────────────────────────────────────
  describe('department lookup by department code', () => {
    it('should match department by code "ENG" to dept-1', async () => {
      // Override mock to expose department with a code field
      mockPrismaService.department.findMany.mockResolvedValue([
        { id: 'dept-1', name: 'Engineering', code: 'ENG' },
      ]);

      const buffer = await createWorkbookBuffer([
        ['EMP003', 'Charlie', 'ENG', 60000, '2024-03-01', 'ACTIVE', '2024-03-01'],
      ]);

      const result = await service.parseAndValidate(buffer);

      expect(result.invalidRows).toHaveLength(0);
      expect(result.validRows).toHaveLength(1);
      expect(result.validRows[0].departmentId).toBe('dept-1');
    });

    it('should also match department by full name "Engineering" to dept-1', async () => {
      mockPrismaService.department.findMany.mockResolvedValue([
        { id: 'dept-1', name: 'Engineering', code: 'ENG' },
      ]);

      const buffer = await createWorkbookBuffer([
        ['EMP004', 'Dana', 'Engineering', 70000, '2024-04-01', 'ACTIVE', '2024-04-01'],
      ]);

      const result = await service.parseAndValidate(buffer);

      expect(result.invalidRows).toHaveLength(0);
      expect(result.validRows).toHaveLength(1);
      expect(result.validRows[0].departmentId).toBe('dept-1');
    });
  });

  // ─── Test 5: exportEmployees with Decimal-like salary ────────────────────────
  describe('exportEmployees with Decimal-like salary', () => {
    it('should export Decimal-like string salary as a numeric cell value', async () => {
      const mockEmployees = [
        {
          empCode: 'EMP005',
          name: 'Eve',
          department: { name: 'Engineering' },
          // Prisma Decimal is serialised as a string in many contexts
          salary: '75000.50',
          joinDate: new Date('2024-05-01T00:00:00.000Z'),
          status: 'ACTIVE',
          lastUpdatedDate: new Date('2024-06-01T00:00:00.000Z'),
        },
      ];

      const buffer = await service.exportEmployees(mockEmployees);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      // Read back the workbook and verify the salary cell is numeric
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const sheet = workbook.getWorksheet('Employees');
      expect(sheet).toBeDefined();

      const salaryCell = sheet!.getRow(2).getCell(4);
      // Number('75000.50') => 75000.5
      expect(salaryCell.value).toBe(75000.5);
    });

    it('should export a Decimal-object salary (with toString) as numeric', async () => {
      // Simulate a Prisma Decimal object that has a numeric valueOf / toString
      const decimalLike = {
        toString: () => '85000.00',
        valueOf: () => 85000,
        toNumber: () => 85000,
      };

      const mockEmployees = [
        {
          empCode: 'EMP006',
          name: 'Frank',
          department: { name: 'Engineering' },
          salary: decimalLike,
          joinDate: '2024-06-01',
          status: 'INACTIVE',
          lastUpdatedDate: '2024-07-01',
        },
      ];

      const buffer = await service.exportEmployees(mockEmployees);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const sheet = workbook.getWorksheet('Employees');

      const salaryCell = sheet!.getRow(2).getCell(4);
      // Number({ toString: () => '85000.00' }) => 85000
      expect(salaryCell.value).toBe(85000);
    });
  });
});
