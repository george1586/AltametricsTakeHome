import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service.ts';
import z from 'zod';
import { JwtAuthGuard } from '../auth/jwt.strategy.ts';
import { paginationQuerySchema, type PaginationQuery } from '../common/pagination.schema.ts';
import { CurrentUser } from '../common/current-user-decorator.ts';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  getInvoices(
    @CurrentUser() user: { userId: string },
    @Query({ schema: paginationQuerySchema }) query: PaginationQuery,
  ) {
    return this.invoicesService.findAll(user.userId, query);
  }

  @Get(':id')
  getInvoice(
    @CurrentUser() user: { userId: string },
    @Param('id', { schema: z.uuid() }) id: string,
  ) {
    return this.invoicesService.findOne(user.userId, id);
  }
}

