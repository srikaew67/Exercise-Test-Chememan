import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateDepartmentDto } from './dto/create-department.dto.js';
import { UpdateDepartmentDto } from './dto/update-department.dto.js';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.department.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    return this.findOneOrFail(id);
  }

  async create(dto: CreateDepartmentDto) {
    try {
      return await this.prisma.department.create({ data: dto });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Department with this name or code already exists');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    await this.findOneOrFail(id);
    try {
      return await this.prisma.department.update({ where: { id }, data: dto });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Department with this name or code already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOneOrFail(id);
    const employeeCount = await this.prisma.employee.count({ where: { departmentId: id } });
    if (employeeCount > 0) {
      throw new ConflictException(
        `Cannot delete department: ${employeeCount} employee(s) still reference it`,
      );
    }
    await this.prisma.department.delete({ where: { id } });
    return { message: 'Department deleted' };
  }

  private async findOneOrFail(id: string) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException(`Department ${id} not found`);
    return dept;
  }
}
