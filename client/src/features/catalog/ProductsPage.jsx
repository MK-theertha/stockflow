import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Chip } from '@mui/material';

import CrudPage from '@/components/common/CrudPage';
import { fetchCategories } from '@/store/slices/categorySlice';
import { thunks } from '@/store/slices/productSlice';
import { fetchSuppliers } from '@/store/slices/supplierSlice';
import { fetchUnits } from '@/store/slices/unitSlice';

const toOptions = (records) => records.map((record) => ({ value: record._id, label: record.name }));

const isLow = (product) => product.reorderLevel > 0 && product.quantity <= product.reorderLevel;

const columns = [
  { label: 'Product', render: (p) => p.productName, search: (p) => p.productName },
  {
    label: 'Supplier',
    render: (p) => p.supplierNameId?.name,
    search: (p) => p.supplierNameId?.name,
  },
  {
    label: 'Category',
    render: (p) => p.categoryNameId?.name,
    search: (p) => p.categoryNameId?.name,
  },
  { label: 'Unit', render: (p) => p.unitNameId?.name },
  {
    label: 'In stock',
    align: 'right',
    render: (p) => (
      <Chip
        size="small"
        label={p.quantity}
        color={isLow(p) ? 'warning' : 'default'}
        title={isLow(p) ? `At or below reorder level (${p.reorderLevel})` : undefined}
      />
    ),
  },
];

export default function ProductsPage() {
  const dispatch = useDispatch();
  const { suppliers } = useSelector((state) => state.suppliers);
  const { units } = useSelector((state) => state.units);
  const { categories } = useSelector((state) => state.categories);

  // The form's dropdowns need the other lists.
  useEffect(() => {
    dispatch(fetchSuppliers());
    dispatch(fetchUnits());
    dispatch(fetchCategories());
  }, [dispatch]);

  const fields = useMemo(
    () => [
      { name: 'productName', label: 'Product name', required: true },
      { name: 'supplierNameId', label: 'Supplier', type: 'select', options: toOptions(suppliers) },
      { name: 'categoryNameId', label: 'Category', type: 'select', options: toOptions(categories) },
      { name: 'unitNameId', label: 'Unit', type: 'select', options: toOptions(units) },
      {
        name: 'reorderLevel',
        label: 'Reorder level',
        type: 'number',
        defaultValue: 0,
        helperText: 'Warn when stock falls to this level. 0 turns the warning off.',
      },
    ],
    [suppliers, categories, units]
  );

  return (
    <CrudPage
      title="Products"
      subtitle="Stock only changes through approved purchases, invoices and stock adjustments."
      noun="product"
      stateKey="products"
      thunks={thunks}
      columns={columns}
      fields={fields}
      describe={(product) => product.productName}
    />
  );
}
