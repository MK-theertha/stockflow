import {
  Button,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

import { formatMoney } from '@/lib/format';

export const emptyLine = () => ({
  key: crypto.randomUUID(),
  productId: '',
  quantity: 1,
  unitPrice: '',
});

/** quantity × unit price, rounded to 2 decimals. */
export const lineTotal = (line) =>
  Math.round((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0) * 100) / 100;

/**
 * Editable product lines for invoices and purchases.
 *
 * lines:     [{ key, productId, quantity, unitPrice }]
 * showStock: show each product's current stock and warn when a line needs more.
 */
export default function LineItemsEditor({ lines, onChange, products, showStock = false }) {
  const productById = new Map(products.map((product) => [product._id, product]));

  const update = (key, field) => (event) =>
    onChange(
      lines.map((line) => (line.key === key ? { ...line, [field]: event.target.value } : line))
    );
  const remove = (key) => onChange(lines.filter((line) => line.key !== key));

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '45%' }}>Product</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell>Unit price</TableCell>
            <TableCell align="right">Total</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {lines.map((line) => {
            const product = productById.get(line.productId);
            const short = showStock && product && Number(line.quantity) > product.quantity;
            return (
              <TableRow key={line.key}>
                <TableCell>
                  <TextField
                    select
                    required
                    value={line.productId}
                    onChange={update(line.key, 'productId')}
                    helperText={showStock && product ? `In stock: ${product.quantity}` : undefined}
                  >
                    {products.map((p) => (
                      <MenuItem key={p._id} value={p._id}>
                        {p.productName}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    required
                    inputProps={{ min: 1, step: 1 }}
                    value={line.quantity}
                    onChange={update(line.key, 'quantity')}
                    error={short}
                    helperText={short ? 'More than in stock' : undefined}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    required
                    inputProps={{ min: 0, step: 0.01 }}
                    value={line.unitPrice}
                    onChange={update(line.key, 'unitPrice')}
                  />
                </TableCell>
                <TableCell align="right">{formatMoney(lineTotal(line))}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    aria-label="Remove line"
                    onClick={() => remove(line.key)}
                    disabled={lines.length === 1}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Button startIcon={<Add />} onClick={() => onChange([...lines, emptyLine()])} sx={{ mt: 1 }}>
        Add line
      </Button>
      {products.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          No products yet. Create one under Inventory → Products first.
        </Typography>
      )}
    </>
  );
}
