import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as dbModule from '../db/db.module.ts';
import { PaginationQuery } from '../common/pagination.schema.ts';

@Injectable()
export class InvoicesService {
    constructor(
        @Inject(dbModule.DB)
        private readonly db: dbModule.Db,
    ) { };

    async findAll(userId: string, { page, limit }: PaginationQuery) {
        const mine = this.db.orm.public.Invoice.where({ user_id: userId });

        const data = await mine
            .orderBy((i) => i.due_date.asc())
            .limit(limit)
            .offset((page - 1) * limit)
            .all();
        const { total } = await mine.aggregate((a) => ({ total: a.count() }));

        return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async findOne(userId: string, id: string) {
        const invoice = await this.db.orm.public.Invoice.where({ id, user_id: userId }).first();
        if (!invoice) throw new NotFoundException('Invoice not found');
        return invoice;
    }

}
