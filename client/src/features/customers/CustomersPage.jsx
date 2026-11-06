import { Avatar, Stack } from '@mui/material';

import CrudPage from '@/components/common/CrudPage';
import { thunks } from '@/store/slices/customerSlice';

const columns = [
  {
    label: 'Name',
    render: (c) => (
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar src={c.image || undefined} sx={{ width: 28, height: 28 }}>
          {c.name.charAt(0)}
        </Avatar>
        <span>{c.name}</span>
      </Stack>
    ),
    search: (c) => c.name,
  },
  { label: 'Email', render: (c) => c.email, search: (c) => c.email },
  { label: 'Phone', render: (c) => c.mobileNumber, search: (c) => String(c.mobileNumber) },
  { label: 'Address', render: (c) => c.address, search: (c) => c.address },
];

const fields = [
  { name: 'image', label: 'Photo', type: 'image' },
  { name: 'name', label: 'Name', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'mobileNumber', label: 'Phone', type: 'number', required: true },
  { name: 'address', label: 'Address', type: 'textarea' },
];

export default function CustomersPage() {
  return (
    <CrudPage
      title="Customers"
      subtitle="People and businesses you sell to. New customers can also be added while invoicing."
      noun="customer"
      stateKey="customers"
      thunks={thunks}
      columns={columns}
      fields={fields}
    />
  );
}
