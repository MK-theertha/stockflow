import CrudPage from '@/components/common/CrudPage';
import { thunks } from '@/store/slices/supplierSlice';

const columns = [
  { label: 'Name', render: (s) => s.name, search: (s) => s.name },
  { label: 'Email', render: (s) => s.email, search: (s) => s.email },
  { label: 'Phone', render: (s) => s.phone, search: (s) => String(s.phone) },
  { label: 'Address', render: (s) => s.address, search: (s) => s.address },
];

const fields = [
  { name: 'name', label: 'Name', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'number', required: true },
  { name: 'address', label: 'Address', type: 'textarea', required: true },
];

export default function SuppliersPage() {
  return (
    <CrudPage
      title="Suppliers"
      subtitle="Businesses you buy stock from."
      noun="supplier"
      stateKey="suppliers"
      thunks={thunks}
      columns={columns}
      fields={fields}
    />
  );
}
