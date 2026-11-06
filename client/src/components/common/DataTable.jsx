import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
} from '@mui/material';
import { Search } from '@mui/icons-material';

/**
 * Table with search and pagination done in the browser.
 * Pass paginated={false} to show every row, e.g. for a report that will be printed.
 *
 * columns: [{ label, render: (row) => node, search?: (row) => string, align? }]
 *   `search` returns the text that the search box matches for that column.
 * footer:  optional <TableRow> elements shown under the rows, e.g. totals.
 */
export default function DataTable({
  columns,
  rows,
  loading,
  error,
  emptyText = 'Nothing here yet.',
  searchable = true,
  paginated = true,
  footer,
  rowKey = (row) => row._id,
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows ?? [];
    return (rows ?? []).filter((row) =>
      columns.some((column) => column.search?.(row)?.toLowerCase().includes(needle))
    );
  }, [rows, columns, query]);

  const offset = paginated ? page * rowsPerPage : 0;
  const visible = paginated ? filtered.slice(offset, offset + rowsPerPage) : filtered;

  return (
    <Paper variant="outlined">
      {searchable && (
        <Box className="no-print" sx={{ p: 2 }}>
          <TextField
            placeholder="Search..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              {columns.map((column) => (
                <TableCell key={column.label} align={column.align}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            )}
            {!loading && visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 4 }}>
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              visible.map((row, index) => (
                <TableRow key={rowKey(row)} hover>
                  <TableCell>{offset + index + 1}</TableCell>
                  {columns.map((column) => (
                    <TableCell key={column.label} align={column.align}>
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
          {footer && !loading && visible.length > 0 && <TableFooter>{footer}</TableFooter>}
        </Table>
      </TableContainer>

      {paginated && (
        <TablePagination
          className="no-print"
          component="div"
          count={filtered.length}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={(event, next) => setPage(next)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
        />
      )}
    </Paper>
  );
}
