import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, IconButton, Tooltip } from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';

import ConfirmDialog from './ConfirmDialog';
import DataTable from './DataTable';
import EntityFormDialog from './EntityFormDialog';
import { useNotify } from './Notifications';
import PageHeader from './PageHeader';

/**
 * A complete list / add / edit / delete page for one resource backed by a
 * slice from createCrudSlice(). Pages only describe their columns and fields:
 *
 *   <CrudPage
 *     title="Units"
 *     noun="unit"
 *     stateKey="units"
 *     thunks={{ fetchAll, add, update, remove }}
 *     columns={[{ label: 'Name', render: (row) => row.name, search: (row) => row.name }]}
 *     fields={[{ name: 'name', label: 'Unit name', required: true }]}
 *   />
 */
export default function CrudPage({
  title,
  subtitle,
  noun,
  stateKey,
  thunks,
  columns,
  fields,
  describe = (row) => row.name,
}) {
  const dispatch = useDispatch();
  const notify = useNotify();
  const { [stateKey]: rows, loading, error } = useSelector((state) => state[stateKey]);

  // null = closed, {} = adding, { row } = editing
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dispatch(thunks.fetchAll());
  }, [dispatch, thunks]);

  // Thunks reject with the API's error message, so it can be shown as is.
  const run = async (action, successMessage) => {
    setBusy(true);
    try {
      await dispatch(action).unwrap();
      notify.success(successMessage);
      return true;
    } catch (message) {
      notify.error(message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (values) => {
    const row = editing?.row;
    const saved = row
      ? await run(thunks.update({ ...values, _id: row._id }), `${capitalize(noun)} updated`)
      : await run(thunks.add(values), `${capitalize(noun)} added`);
    if (saved) setEditing(null);
  };

  const handleDelete = async () => {
    if (await run(thunks.remove(deleting._id), `${capitalize(noun)} deleted`)) setDeleting(null);
  };

  const actionColumn = {
    label: 'Actions',
    align: 'right',
    render: (row) => (
      <>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => setEditing({ row })}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={() => setDeleting(row)}>
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </>
    ),
  };

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={() => setEditing({})}>
            Add {noun}
          </Button>
        }
      />

      <DataTable
        columns={[...columns, actionColumn]}
        rows={rows}
        loading={loading}
        error={error}
        emptyText={`No ${noun}s yet. Click "Add ${noun}" to create one.`}
      />

      <EntityFormDialog
        key={editing ? (editing.row?._id ?? 'new') : 'closed'}
        open={Boolean(editing)}
        title={editing?.row ? `Edit ${noun}` : `Add ${noun}`}
        fields={fields}
        row={editing?.row ?? null}
        busy={busy}
        onSubmit={handleSave}
        onClose={() => setEditing(null)}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${noun}`}
        message={`Delete "${deleting ? describe(deleting) : ''}"? This cannot be undone.`}
        busy={busy}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
