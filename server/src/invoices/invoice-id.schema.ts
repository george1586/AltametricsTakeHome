import { z } from 'zod';


export const InvoiceScheme = z.object({
    id: z.uuid({ version: "v7" }),
    vendor_name: z.string(),
    amount: z.coerce.number().positive().multipleOf(0.01),
    due_date: z.coerce.date(),
    description: z.string(),
    paid: z.boolean(),
    user_id: z.uuid({ version: "v7" })
});

export type InvoiceType = z.infer<typeof InvoiceScheme>;

