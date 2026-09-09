import { IsString, IsNumber, IsDateString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEmployeeDto {
  @IsString()
  @MinLength(1)
  empCode: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  departmentId: string;

  @IsNumber()
  @Type(() => Number)
  salary: number;

  @IsDateString()
  joinDate: string;

  @IsEnum(['ACTIVE', 'INACTIVE', 'RESIGNED', 'ON_LEAVE'])
  status: string;

  @IsOptional()
  @IsDateString()
  lastUpdatedDate?: string;
}
