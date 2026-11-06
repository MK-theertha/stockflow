import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Fullscreen, FullscreenExit, Menu as MenuIcon } from '@mui/icons-material';

import { NAVIGATION } from '@/app/navigation';
import { useSession } from '@/lib/session';

import BrandLogo from './BrandLogo';

const DRAWER_WIDTH = 260;

function Sidebar({ role, onNavigate }) {
  const base = `/dashboard/${role}`;

  return (
    <Box sx={{ overflowY: 'auto' }}>
      <Toolbar sx={{ px: 2 }}>
        <BrandLogo />
      </Toolbar>
      <Divider />
      {NAVIGATION[role].map((section, index) => (
        <List
          key={section.heading ?? index}
          dense
          subheader={
            section.heading && (
              <ListSubheader sx={{ bgcolor: 'transparent', lineHeight: '32px' }}>
                {section.heading}
              </ListSubheader>
            )
          }
        >
          {section.items.map(({ label, path, icon: Icon }) => (
            <ListItemButton
              key={label}
              component={NavLink}
              to={path ? `${base}/${path}` : base}
              end
              onClick={onNavigate}
              sx={{
                mx: 1,
                borderRadius: 1,
                '&.active': { bgcolor: 'action.selected', color: 'primary.main' },
                '&.active .MuiListItemIcon-root': { color: 'primary.main' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          ))}
        </List>
      ))}
    </Box>
  );
}

function AccountMenu({ role }) {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [anchor, setAnchor] = useState(null);
  const user = session?.user;

  const go = (path) => {
    setAnchor(null);
    navigate(`/dashboard/${role}/${path}`);
  };

  return (
    <>
      <Tooltip title="Account">
        <IconButton onClick={(event) => setAnchor(event.currentTarget)} sx={{ p: 0.5 }}>
          <Avatar src={user?.image || undefined} sx={{ width: 34, height: 34 }}>
            {user?.name?.charAt(0)}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2">{user?.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => go('profile')}>Profile</MenuItem>
        <MenuItem onClick={() => go('change-password')}>Change password</MenuItem>
        <MenuItem onClick={() => go('logout')}>Log out</MenuItem>
      </Menu>
    </>
  );
}

function FullscreenButton() {
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));

  const toggle = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
    setFullscreen(Boolean(document.fullscreenElement));
  };

  return (
    <Tooltip title={fullscreen ? 'Exit full screen' : 'Full screen'}>
      <IconButton onClick={toggle}>{fullscreen ? <FullscreenExit /> : <Fullscreen />}</IconButton>
    </Tooltip>
  );
}

/**
 * Layout for every dashboard page: a sidebar built from NAVIGATION[role], a top
 * bar with the account menu, and the page itself as `children`.
 * On small screens the sidebar becomes a slide-out drawer.
 */
export default function DashboardShell({ role, children }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {!isDesktop && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {role === 'admin' ? 'Admin console' : 'My shop'}
          </Typography>
          <FullscreenButton />
          <AccountMenu role={role} />
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop || mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
        >
          <Sidebar role={role} onNavigate={() => setMobileOpen(false)} />
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: { xs: 2, md: 4 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
