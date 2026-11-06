import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';

const NotificationContext = createContext(null);

/**
 * One app-wide snackbar, so pages don't each manage their own.
 *
 *   const notify = useNotify();
 *   notify.success('Saved');
 *   notify.error(error.message);
 */
export function NotificationProvider({ children }) {
  const [message, setMessage] = useState(null);

  const show = useCallback((severity) => (text) => setMessage({ severity, text }), []);
  const notify = useMemo(() => ({ success: show('success'), error: show('error') }), [show]);
  const close = () => setMessage(null);

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <Snackbar
        open={Boolean(message)}
        autoHideDuration={5000}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {message ? (
          <Alert onClose={close} severity={message.severity} variant="filled">
            {message.text}
          </Alert>
        ) : undefined}
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export const useNotify = () => useContext(NotificationContext);
