import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateEmployeeDto } from './create-employee.dto.js';

export class ImportCommitDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEmployeeDto)
  validRows: CreateEmployeeDto[];
}
