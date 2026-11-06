import CrudPage from '@/components/common/CrudPage';
import { thunks } from '@/store/slices/categorySlice';

const columns = [
  { label: 'Name', render: (category) => category.name, search: (category) => category.name },
];
const fields = [{ name: 'name', label: 'Category name', required: true }];

export default function CategoriesPage() {
  return (
    <CrudPage
      title="Categories"
      subtitle="Groups of products, used for filtering and reports."
      noun="category"
      stateKey="categories"
      thunks={thunks}
      columns={columns}
      fields={fields}
    />
  );
}
