import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ExcelService {
  constructor(private prisma: PrismaService) {}

  async parseAndValidate(_buffer: Buffer) {
    return { validRows: [], invalidRows: [] };
  }

  async exportEmployees(_employees: any[]): Promise<Buffer> {
    return Buffer.from('');
  }
}
