import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, CircularProgress } from '@mui/material';
import { Delete, Print, TaskAlt } from '@mui/icons-material';

import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useNotify } from '@/components/common/Notifications';
import PageHeader from '@/components/common/PageHeader';
import { useApi } from '@/hooks/useApi';
import { apiFetch } from '@/lib/api-client';
import { printElement } from '@/lib/print';

import InvoiceDocument from './InvoiceDocument';

/** One invoice (/invoices/:id): view, approve, print or delete it. */
export default function InvoiceDetailPage() {
  const navigate = useNavigate();
  const notify = useNotify();
  const { id: invoiceId } = useParams();
  const { data, loading, error, reload } = useApi(`/api/user/invoicedetails/${invoiceId}`);
  const documentRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data?.invoice?.length) return <Alert severity="warning">Invoice not found.</Alert>;

  const [invoice] = data.invoice;

  const approve = async () => {
    setBusy(true);
    try {
      await apiFetch('/api/user/invoiceapprove', { method: 'POST', body: { invoiceId } });
      notify.success('Invoice approved and stock deducted');
      reload();
    } catch (approveError) {
      notify.error(approveError.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await apiFetch(`/api/user/invoice/${invoiceId}`, { method: 'DELETE' });
      notify.success('Invoice deleted');
      navigate('/dashboard/user/invoices');
    } catch (deleteError) {
      notify.error(deleteError.message);
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title={invoice.invoice_no}
        subtitle={
          invoice.status
            ? 'Approved: the items have been taken out of stock.'
            : 'Pending: check the invoice, then approve it to deduct the stock.'
        }
        actions={
          <>
            {!invoice.status && (
              <Button variant="contained" startIcon={<TaskAlt />} onClick={approve} disabled={busy}>
                Approve
              </Button>
            )}
            <Button startIcon={<Print />} onClick={() => printElement(documentRef.current)}>
              Print
            </Button>
            <Button color="error" startIcon={<Delete />} onClick={() => setDeleting(true)}>
              Delete
            </Button>
          </>
        }
      />

      <InvoiceDocument ref={documentRef} details={data} />

      <ConfirmDialog
        open={deleting}
        title="Delete invoice"
        message={
          invoice.status
            ? 'This invoice is approved, so its items will go back into stock.'
            : 'Delete this pending invoice?'
        }
        busy={busy}
        onConfirm={remove}
        onClose={() => setDeleting(false)}
      />
    </>
  );
}
