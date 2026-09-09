import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import 'multer';
import { EmployeesService } from './employees.service.js';
import { ExcelService } from '../excel/excel.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { EmployeeQueryDto, SortOrder } from './dto/employee-query.dto.js';
import { ImportCommitDto } from './dto/import-commit.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
  constructor(
    private employeesService: EmployeesService,
    private excelService: ExcelService,
  ) {}

  // IMPORTANT: static routes BEFORE :id param routes
  @Get()
  findAll(@Query() query: EmployeeQueryDto) {
    return this.employeesService.findAll(query);
  }

  @Get('export')
  async export(@Query() query: EmployeeQueryDto, @Res() res: Response) {
    const { data } = await this.employeesService.findAll({ ...query, limit: 100000, page: 1, sortBy: 'empCode', order: SortOrder.ASC });
    const buffer = await this.excelService.exportEmployees(data);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="employees.xlsx"');
    res.send(buffer);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateEmployeeDto, @CurrentUser() user: { id: string }) {
    return this.employeesService.create(dto, user.id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async import(@UploadedFile() file?: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Please provide an .xlsx file');
    }
    return this.excelService.parseAndValidate(file.buffer);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('import/commit')
  async importCommit(
    @Body() body: ImportCommitDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.employeesService.upsertMany(body.validRows, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.employeesService.update(id, dto, user.id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }
}
