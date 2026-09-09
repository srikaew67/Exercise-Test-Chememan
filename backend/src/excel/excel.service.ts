import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service.js';

export interface ValidatedEmployeeRow {
  empCode: string;
  name: string;
  departmentId: string;
  salary: number;
  joinDate: string;
  status: string;
  lastUpdatedDate: string;
}

export interface InvalidRow {
  rowNumber: number;
  rawData: Record<string, unknown>;
  reasons: string[];
}

@Injectable()
export class ExcelService {
  constructor(private prisma: PrismaService) {}

  async parseAndValidate(buffer: Buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const worksheet = workbook.worksheets[0];

    const validRows: ValidatedEmployeeRow[] = [];
    const invalidRows: InvalidRow[] = [];

    if (!worksheet) {
      return { validRows, invalidRows };
    }

    // Load all departments into a name/code->id map for fast lookup
    const departments = await this.prisma.department.findMany();
    const deptMap = new Map<string, string>();
    for (const d of departments) {
      deptMap.set(d.name.toLowerCase().trim(), d.id);
      if (d.code) {
        deptMap.set(d.code.toLowerCase().trim(), d.id);
      }
    }

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header row

      const rawId = row.getCell(1).value;
      const rawName = row.getCell(2).value;
      const rawDept = row.getCell(3).value;
      const rawSalary = row.getCell(4).value;
      const rawJoinDate = row.getCell(5).value;
      const rawStatus = row.getCell(6).value;
      const rawLastUpdated = row.getCell(7).value;

      const rawData: Record<string, unknown> = {
        ID: rawId,
        Name: rawName,
        Department: rawDept,
        Salary: rawSalary,
        'Join Date': rawJoinDate,
        Status: rawStatus,
        'Last Updated Date': rawLastUpdated,
      };

      const reasons: string[] = [];

      const empCode = rawId !== undefined && rawId !== null ? String(rawId).trim() : '';
      if (!empCode) reasons.push('ID is required');

      const name = rawName !== undefined && rawName !== null ? String(rawName).trim() : '';
      if (!name) reasons.push('Name is required');

      const deptName = rawDept !== undefined && rawDept !== null ? String(rawDept).trim() : '';
      if (!deptName) {
        reasons.push('Department is required');
      }
      const departmentId = deptName ? deptMap.get(deptName.toLowerCase()) : undefined;
      if (deptName && !departmentId) {
        reasons.push(`Department '${deptName}' not found in the system`);
      }

      const rawSalaryVal =
        rawSalary && typeof rawSalary === 'object' && 'result' in rawSalary
          ? (rawSalary as any).result
          : rawSalary;
      const salary =
        typeof rawSalaryVal === 'number'
          ? rawSalaryVal
          : parseFloat(String(rawSalaryVal ?? '').replace(/,/g, ''));
      if (isNaN(salary)) reasons.push('Salary must be a numeric value');

      const parseDate = (raw: unknown, fieldName: string): string | null => {
        const val =
          raw && typeof raw === 'object' && 'result' in raw
            ? (raw as any).result
            : raw;
        if (!val && val !== 0) {
          reasons.push(`${fieldName} is required`);
          return null;
        }
        if (val instanceof Date) return val.toISOString();
        if (typeof val === 'number') {
          // Excel serial date (days since 1899-12-30)
          const date = new Date(Math.round((val - 25569) * 86400 * 1000));
          if (!isNaN(date.getTime())) return date.toISOString();
        }
        const d = new Date(String(val));
        if (isNaN(d.getTime())) {
          reasons.push(`${fieldName} is not a valid date`);
          return null;
        }
        return d.toISOString();
      };
      const joinDate = parseDate(rawJoinDate, 'Join Date');
      const lastUpdatedDate = parseDate(rawLastUpdated, 'Last Updated Date');

      const rawStatusStr =
        rawStatus !== undefined && rawStatus !== null ? String(rawStatus).trim() : '';
      const normStatus = rawStatusStr.toUpperCase().replace(/[\s_-]+/g, '');
      let statusStr = '';
      if (normStatus === 'ACTIVE') {
        statusStr = 'ACTIVE';
      } else if (normStatus === 'INACTIVE') {
        statusStr = 'INACTIVE';
      } else if (normStatus === 'RESIGNED') {
        statusStr = 'RESIGNED';
      } else if (normStatus === 'ONLEAVE') {
        statusStr = 'ON_LEAVE';
      }

      if (!statusStr) {
        reasons.push(
          `Status must be one of Active, In Active — got '${rawStatus}'`,
        );
      }

      if (reasons.length > 0) {
        invalidRows.push({ rowNumber, rawData, reasons });
      } else {
        validRows.push({
          empCode,
          name,
          departmentId: departmentId!,
          salary,
          joinDate: joinDate!,
          status: statusStr,
          lastUpdatedDate: lastUpdatedDate!,
        });
      }
    });

    return { validRows, invalidRows };
  }

  async exportEmployees(employees: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Employees');

    sheet.columns = [
      { header: 'ID', key: 'empCode', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Salary', key: 'salary', width: 15, style: { numFmt: '#,##0.00' } },
      { header: 'Join Date', key: 'joinDate', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Last Updated Date', key: 'lastUpdatedDate', width: 20 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    for (const emp of employees) {
      const toDateStr = (v: unknown) => {
        if (!v) return '';
        if (v instanceof Date) return v.toISOString().split('T')[0];
        return String(v).split('T')[0];
      };
      sheet.addRow({
        empCode: emp.empCode,
        name: emp.name,
        department: emp.department?.name ?? '',
        salary: Number(emp.salary),
        joinDate: toDateStr(emp.joinDate),
        status: emp.status,
        lastUpdatedDate: toDateStr(emp.lastUpdatedDate),
      });
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
