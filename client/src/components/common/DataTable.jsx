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
 * Table with search and pagination. By default both happen in the browser on `rows`.
 * Pass server={usePagedApi(...)} for long lists, where the server does them instead.
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
  server,
  rowKey = (row) => row._id,
}) {
  const [localQuery, setLocalQuery] = useState('');
  const [localPage, setLocalPage] = useState(0);
  const [localLimit, setLocalLimit] = useState(10);

  const query = server ? server.search : localQuery;
  const page = server ? server.page : localPage;
  const rowsPerPage = server ? server.limit : localLimit;
  const setQuery = server ? server.setSearch : setLocalQuery;
  const setPage = server ? server.setPage : setLocalPage;
  const setRowsPerPage = server ? server.setLimit : setLocalLimit;
  const isLoading = server ? server.loading : loading;
  const errorText = server ? server.error : error;

  const filtered = useMemo(() => {
    if (server) return server.rows;
    const needle = localQuery.trim().toLowerCase();
    if (!needle) return rows ?? [];
    return (rows ?? []).filter((row) =>
      columns.some((column) => column.search?.(row)?.toLowerCase().includes(needle))
    );
  }, [server, rows, columns, localQuery]);

  const offset = paginated ? page * rowsPerPage : 0;
  const visible = paginated && !server ? filtered.slice(offset, offset + rowsPerPage) : filtered;

  return (
    <Paper variant="outlined">
      {searchable && (
        <Box className="no-print" sx={{ p: 2 }}>
          <TextField
            placeholder="Search..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (!server) setPage(0);
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

      {errorText && <Alert severity="error">{errorText}</Alert>}

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
            {isLoading && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 4 }}>
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
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
          {footer && !isLoading && visible.length > 0 && <TableFooter>{footer}</TableFooter>}
        </Table>
      </TableContainer>

      {paginated && (
        <TablePagination
          className="no-print"
          component="div"
          count={server ? server.total : filtered.length}
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
