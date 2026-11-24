import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getInvoice } from '../../api/invoices.api.ts';
import { formatAmount, formatDate } from '../../lib/format.ts';
import { getErrorMessage } from '../../lib/errors.ts';
import { invoiceSelected } from '../../store/uiSlice.ts';
import { useAppDispatch, useAppSelector } from '../../store/store.ts';

export function InvoiceModal() {
  const dispatch = useAppDispatch();
  const id = useAppSelector((state) => state.ui.selectedInvoiceId);
  const close = () => dispatch(invoiceSelected(null));

  const { data: invoice, isPending, isError, error, refetch } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id!),
    enabled: id !== null,
  });

  useEffect(() => {
    if (!id) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && dispatch(invoiceSelected(null));
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [id, dispatch]);

  if (!id) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 id="invoice-title" className="text-lg font-semibold text-gray-900">Invoice details</h2>
          <button type="button" onClick={close} aria-label="Close" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {isPending && <p className="text-sm text-gray-500">Loading invoice…</p>}

          {isError && (
            <div role="alert" className="space-y-3">
              <p className="text-sm text-red-700">{getErrorMessage(error)}</p>
              <button type="button" onClick={() => refetch()} className="text-sm font-medium text-[#5b6cd6] hover:underline">
                Try again
              </button>
            </div>
          )}

          {invoice && (
            <dl className="space-y-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <dt className="text-gray-500">Payee</dt>
                  <dd className="mt-0.5 text-base font-semibold text-gray-900">{invoice.vendor_name}</dd>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${invoice.paid ? 'bg-[#e8ebfb] text-[#5b6cd6]' : 'bg-amber-50 text-amber-700'}`}>
                  {invoice.paid ? 'Paid' : 'Open'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-gray-500">Amount</dt>
                  <dd className="mt-0.5 text-gray-900">{formatAmount(invoice.amount)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Due date</dt>
                  <dd className="mt-0.5 text-gray-900">{formatDate(invoice.due_date)}</dd>
                </div>
              </div>
              <div>
                <dt className="text-gray-500">Description</dt>
                <dd className="mt-0.5 text-gray-900">{invoice.description}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Invoice ID</dt>
                <dd className="mt-0.5 break-all font-mono text-xs text-gray-600">{invoice.id}</dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}