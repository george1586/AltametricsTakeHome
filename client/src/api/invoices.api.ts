import { http } from './http.ts';
import { invoicePageSchema, invoiceSchema } from '../schemas/invoice.schema.ts';

export const PAGE_SIZE = 10;

export async function getInvoices(page: number) {
  const { data } = await http.get('/invoices', { params: { page, limit: PAGE_SIZE } });
  return invoicePageSchema.parse(data);
}

export async function getInvoice(id: string) {
  const { data } = await http.get(`/invoices/${id}`);
  return invoiceSchema.parse(data);
}