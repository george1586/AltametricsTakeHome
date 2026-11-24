import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getInvoices, PAGE_SIZE } from '../../api/invoices.api.ts';
import { getErrorMessage } from '../../lib/errors.ts';
import { invoiceSelected, pageChanged } from '../../store/uiSlice.ts';
import { useAppDispatch, useAppSelector } from '../../store/store.ts';
import { InvoiceTable } from './InvoiceTable.tsx';
import { InvoiceModal } from './InvoiceModal.tsx';
import { Pagination } from './Pagination.tsx';

export function InvoicesPage() {
  const dispatch = useAppDispatch();
  const page = useAppSelector((state) => state.ui.page);

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useQuery({
    queryKey: ['invoices', page],
    queryFn: () => getInvoices(page),
    placeholderData: keepPreviousData,
  });

  return (
    <section>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Invoices</h1>

      {isPending && <p className="py-10 text-center text-gray-500">Loading invoices…</p>}

      {isError && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{getErrorMessage(error)}</span>
          <button type="button" onClick={() => refetch()} className="font-medium underline">Try again</button>
        </div>
      )}

      {data && data.meta.total === 0 && (
        <p className="rounded-lg border border-dashed border-gray-300 py-10 text-center text-gray-500">You don't have any invoices yet.</p>
      )}

      {data && data.meta.total > 0 && (
        <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <InvoiceTable invoices={data.data} onSelect={(id) => dispatch(invoiceSelected(id))} />
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            pageSize={PAGE_SIZE}
            onChange={(next) => dispatch(pageChanged(next))}
          />
        </div>
      )}

      <InvoiceModal />
    </section>
  );
}