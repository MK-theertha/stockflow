import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';

import ImageField from './ImageField';

// A populated reference ({ _id, name }) is edited as its id.
const valueFromRow = (row, field) => {
  if (field.fromRow) return field.fromRow(row);
  const value = row?.[field.name];
  if (value && typeof value === 'object') return value._id;
  return value ?? field.defaultValue ?? '';
};

const initialValues = (fields, row) =>
  Object.fromEntries(fields.map((field) => [field.name, valueFromRow(row, field)]));

/**
 * Add / edit form built from a field list.
 *
 * fields: [{ name, label, type?: 'text' | 'email' | 'number' | 'date' | 'textarea' | 'select' | 'image',
 *            required?, options?: [{ value, label }], helperText?, defaultValue?, fromRow? }]
 * row:    the record being edited, or null to add a new one.
 *
 * The form starts from `row` when it mounts, so give it a `key` that changes per record.
 */
export default function EntityFormDialog({ open, title, fields, row, busy, onSubmit, onClose }) {
  const [values, setValues] = useState(() => initialValues(fields, row));

  const setValue = (name) => (event) =>
    setValues((prev) => ({ ...prev, [name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {fields.map((field) =>
              field.type === 'image' ? (
                <ImageField
                  key={field.name}
                  label={field.label}
                  value={values[field.name] ?? ''}
                  onChange={(url) => setValues((prev) => ({ ...prev, [field.name]: url }))}
                />
              ) : (
                <TextField
                  key={field.name}
                  label={field.label}
                  type={field.type === 'select' || field.type === 'textarea' ? 'text' : field.type}
                  select={field.type === 'select'}
                  multiline={field.type === 'textarea'}
                  minRows={field.type === 'textarea' ? 3 : undefined}
                  InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                  required={field.required}
                  helperText={field.helperText}
                  value={values[field.name] ?? ''}
                  onChange={setValue(field.name)}
                >
                  {field.type === 'select' &&
                    (field.options ?? []).map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                </TextField>
              )
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={busy}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
