import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  alpha,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BarChartIcon from '@mui/icons-material/BarChart';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import ChecklistIcon from '@mui/icons-material/Checklist';
import TableChartIcon from '@mui/icons-material/TableChart';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SavingsIcon from '@mui/icons-material/Savings';

const DRAWER_WIDTH = 240;

interface ModuleConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  basePath: string;
  ready: boolean;
  subItems: { label: string; icon: React.ReactNode; path: string }[];
}

const modules: ModuleConfig[] = [
  {
    key: 'expenses',
    label: 'Finance Tracker',
    icon: <AccountBalanceWalletIcon />,
    color: '#1976d2',
    basePath: '/expenses',
    ready: true,
    subItems: [
      { label: 'Dashboard', icon: <AccountBalanceWalletIcon />, path: '/expenses' },
      { label: 'Calendar', icon: <CalendarMonthIcon />, path: '/expenses/calendar' },
      { label: 'Analytics', icon: <BarChartIcon />, path: '/expenses/analytics' },
      { label: 'Budgets', icon: <SavingsIcon />, path: '/expenses/budgets' },
    ],
  },
  {
    key: 'streaks',
    label: 'Daily Streaks',
    icon: <WhatshotIcon />,
    color: '#f57c00',
    basePath: '/streaks',
    ready: false,
    subItems: [],
  },
  {
    key: 'todos',
    label: 'To-Do / Tasks',
    icon: <ChecklistIcon />,
    color: '#388e3c',
    basePath: '/todos',
    ready: true,
    subItems: [
      { label: 'Tasks', icon: <ChecklistIcon />, path: '/todos' },
    ],
  },
  {
    key: 'worklog',
    label: 'Task Worklog',
    icon: <TableChartIcon />,
    color: '#7b1fa2',
    basePath: '/worklog',
    ready: true,
    subItems: [
      { label: 'Worklog', icon: <TableChartIcon />, path: '/worklog' },
    ],
  },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const activeModule = modules.find((m) => location.pathname.startsWith(m.basePath));
  const isHome = location.pathname === '/';
  // Todo module has its own sidebar — hide the AppLayout drawer
  const hideDrawer = location.pathname.startsWith('/todos');

  const getPageTitle = () => {
    if (isHome) return 'Home';
    if (activeModule) {
      const subItem = activeModule.subItems.find((s) => s.path === location.pathname);
      return subItem ? `${activeModule.label} - ${subItem.label}` : activeModule.label;
    }
    return 'ProductivityApp';
  };

  const drawer = (
    <Box>
      <Toolbar
        sx={{ cursor: 'pointer' }}
        onClick={() => {
          navigate('/');
          setMobileOpen(false);
        }}
      >
        <Typography variant="h6" fontWeight={700} color="primary">
          ProductivityApp
        </Typography>
      </Toolbar>
      <Divider />

      {activeModule ? (
        <Box>
          <ListItemButton
            onClick={() => {
              navigate('/');
              setMobileOpen(false);
            }}
            sx={{ py: 1.5 }}
          >
            <ListItemIcon>
              <ArrowBackIcon />
            </ListItemIcon>
            <ListItemText
              primary="All Modules"
              primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem', color: 'text.secondary' }}
            />
          </ListItemButton>
          <Divider />

          <Box sx={{ px: 2, py: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ color: activeModule.color }}>{activeModule.icon}</Box>
              <Typography variant="subtitle2" fontWeight={700} color={activeModule.color}>
                {activeModule.label}
              </Typography>
            </Box>
          </Box>

          <List>
            {activeModule.subItems.map((item) => (
              <ListItemButton
                key={item.path}
                selected={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  pl: 3,
                  '&.Mui-selected': {
                    bgcolor: alpha(activeModule.color, 0.08),
                    borderRight: `3px solid ${activeModule.color}`,
                    '&:hover': { bgcolor: alpha(activeModule.color, 0.12) },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: location.pathname === item.path ? activeModule.color : undefined }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: location.pathname === item.path ? 700 : 400,
                    color: location.pathname === item.path ? activeModule.color : undefined,
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      ) : (
        <List>
          <ListItemButton
            selected={isHome}
            onClick={() => {
              navigate('/');
              setMobileOpen(false);
            }}
          >
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>
          <Divider sx={{ my: 1 }} />

          {modules.map((mod) => (
            <ListItemButton
              key={mod.key}
              disabled={!mod.ready}
              onClick={() => {
                navigate(mod.basePath);
                setMobileOpen(false);
              }}
              sx={{
                '&:hover': mod.ready ? { bgcolor: alpha(mod.color, 0.06) } : {},
              }}
            >
              <ListItemIcon sx={{ color: mod.ready ? mod.color : undefined }}>
                {mod.icon}
              </ListItemIcon>
              <ListItemText
                primary={mod.label}
                secondary={!mod.ready ? 'Coming Soon' : undefined}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: hideDrawer ? '100%' : `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: hideDrawer ? 0 : `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        <Toolbar>
          {hideDrawer ? (
            <IconButton
              edge="start"
              onClick={() => navigate('/')}
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
          ) : (
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" fontWeight={600}>
            {getPageTitle()}
          </Typography>
        </Toolbar>
      </AppBar>

      {!hideDrawer && (
        <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: hideDrawer ? 0 : 3,
          width: { sm: hideDrawer ? '100%' : `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
