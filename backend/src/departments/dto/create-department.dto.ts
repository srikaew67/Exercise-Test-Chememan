import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  code?: string;
}
