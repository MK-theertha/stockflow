import CrudPage from '@/components/common/CrudPage';
import { thunks } from '@/store/slices/unitSlice';

const columns = [{ label: 'Name', render: (unit) => unit.name, search: (unit) => unit.name }];
const fields = [
  { name: 'name', label: 'Unit name', required: true, helperText: 'e.g. kg, box, piece' },
];

export default function UnitsPage() {
  return (
    <CrudPage
      title="Units"
      subtitle="How products are counted and sold."
      noun="unit"
      stateKey="units"
      thunks={thunks}
      columns={columns}
      fields={fields}
    />
  );
}
