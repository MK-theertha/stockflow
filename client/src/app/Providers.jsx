import { CssBaseline, ThemeProvider } from '@mui/material';
import { Provider } from 'react-redux';

import { NotificationProvider } from '@/components/common/Notifications';
import { SessionProvider } from '@/lib/session';
import { store } from '@/store';

import { theme } from './theme';

/** Everything the whole app needs: theme, logged-in user, Redux store, notifications. */
export default function Providers({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SessionProvider>
        <Provider store={store}>
          <NotificationProvider>{children}</NotificationProvider>
        </Provider>
      </SessionProvider>
    </ThemeProvider>
  );
}
