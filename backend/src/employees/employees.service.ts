import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { EmployeeQueryDto } from './dto/employee-query.dto.js';
import { Prisma, EmployeeStatus } from '@prisma/client';

const SORTABLE_FIELDS = ['name', 'empCode', 'salary', 'joinDate', 'status', 'lastUpdatedDate'];

function toDateOrNow(val?: string | null): Date {
  return val ? new Date(val) : new Date();
}

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: EmployeeQueryDto) {
    const { search, departmentId, status, page = 1, limit = 20, sortBy = 'name', order = 'asc' } = query;
    const safeSortBy = SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'name';
    const safeOrder = order === 'desc' ? 'desc' : 'asc';
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;

    const where: Prisma.EmployeeWhereInput = {
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(status ? { status: status as EmployeeStatus } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        include: { department: true },
        orderBy: { [safeSortBy]: safeOrder },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { data, total, page: pageNum, limit: limitNum };
  }

  async findOne(id: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { id },
      include: { department: true },
    });
    if (!emp) throw new NotFoundException(`Employee ${id} not found`);
    return emp;
  }

  async create(dto: CreateEmployeeDto, userId: string) {
    try {
      return await this.prisma.employee.create({
        data: {
          empCode: dto.empCode,
          name: dto.name,
          departmentId: dto.departmentId,
          salary: dto.salary,
          joinDate: new Date(dto.joinDate),
          status: dto.status as EmployeeStatus,
          lastUpdatedDate: toDateOrNow(dto.lastUpdatedDate),
          createdById: userId,
        },
        include: { department: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException(`Employee with code ${dto.empCode} already exists`);
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateEmployeeDto, userId: string) {
    await this.findOne(id);
    try {
      return await this.prisma.employee.update({
        where: { id },
        data: {
          ...(dto.empCode !== undefined && { empCode: dto.empCode }),
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
          ...(dto.salary !== undefined && { salary: dto.salary }),
          ...(dto.joinDate !== undefined && { joinDate: new Date(dto.joinDate) }),
          ...(dto.status !== undefined && { status: dto.status as EmployeeStatus }),
          lastUpdatedDate: toDateOrNow(dto.lastUpdatedDate),
          updatedById: userId,
        },
        include: { department: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException(`Employee with code ${dto.empCode} already exists`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.employee.delete({ where: { id } });
    return { message: 'Employee deleted' };
  }

  async upsertMany(rows: CreateEmployeeDto[] = [], userId: string) {
    if (!rows || rows.length === 0) {
      return { upserted: 0 };
    }

    const operations = rows.map((row) =>
      this.prisma.employee.upsert({
        where: { empCode: row.empCode },
        update: {
          name: row.name,
          departmentId: row.departmentId,
          salary: row.salary,
          joinDate: new Date(row.joinDate),
          status: row.status as EmployeeStatus,
          lastUpdatedDate: toDateOrNow(row.lastUpdatedDate),
          updatedById: userId,
        },
        create: {
          empCode: row.empCode,
          name: row.name,
          departmentId: row.departmentId,
          salary: row.salary,
          joinDate: new Date(row.joinDate),
          status: row.status as EmployeeStatus,
          lastUpdatedDate: toDateOrNow(row.lastUpdatedDate),
          createdById: userId,
        },
      }),
    );

    const results = await this.prisma.$transaction(operations);
    return { upserted: results.length };
  }
}
