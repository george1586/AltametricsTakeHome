import { z } from 'zod';

export const invoiceSchema = z.object({
  id: z.uuid(),
  vendor_name: z.string(),
  amount: z.coerce.number(),
  due_date: z.coerce.date(),
  description: z.string(),
  paid: z.boolean(),
});
export type Invoice = z.infer<typeof invoiceSchema>;

export const invoicePageSchema = z.object({
  data: z.array(invoiceSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});
export type InvoicePage = z.infer<typeof invoicePageSchema>;