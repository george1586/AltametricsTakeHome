import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import type { Invoice } from '../../schemas/invoice.schema.ts';
import { formatAmount, formatDate } from '../../lib/format.ts';

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, Invoice>();

const columns = helper.columns([
  helper.accessor('vendor_name', { header: 'Payee' }),
  helper.accessor('description', { header: 'Description' }),
  helper.accessor('due_date', { header: 'Due Date', cell: (info) => formatDate(info.getValue()) }),
  helper.accessor('amount', { header: 'Amount', cell: (info) => formatAmount(info.getValue()) }),
  helper.accessor('paid', {
    header: 'Status',
    cell: (info) =>
      info.getValue() ? (
        <span className="text-[#5b6cd6]">Paid</span>
      ) : (
        <span className="font-medium text-amber-600">Open</span>
      ),
  }),
]);

interface Props {
  invoices: Invoice[];
  onSelect: (id: string) => void;
}

export function InvoiceTable({ invoices, onSelect }: Props) {
  const table = useTable({ features, columns, data: invoices });

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[#929fe3] text-white">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th key={header.id} scope="col" className="border-r border-white/30 px-5 py-4 font-semibold last:border-r-0">
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              tabIndex={0}
              onClick={() => onSelect(row.original.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(row.original.id);
                }
              }}
              className="cursor-pointer text-gray-700 transition hover:bg-[#f2f4fd] focus:bg-[#f2f4fd] focus:outline-none"
            >
              {row.getAllCells().map((cell) => (
                <td key={cell.id} className="border-r border-gray-200 px-5 py-4 last:border-r-0">
                  <table.FlexRender cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}