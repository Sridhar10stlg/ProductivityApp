import { useNavigate } from 'react-router-dom';
import { Box, Card, CardActionArea, CardContent, Typography, Grid, alpha } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import ChecklistIcon from '@mui/icons-material/Checklist';
import TableChartIcon from '@mui/icons-material/TableChart';

const modules = [
  {
    title: 'Finance Tracker',
    description: 'Track income & expenses, view calendar, analyze spending patterns across accounts.',
    icon: <AccountBalanceWalletIcon sx={{ fontSize: 48 }} />,
    color: '#1976d2',
    path: '/expenses',
    ready: true,
  },
  {
    title: 'Daily Streaks',
    description: 'Build habits with daily streak tracking. Stay consistent and watch your streaks grow.',
    icon: <WhatshotIcon sx={{ fontSize: 48 }} />,
    color: '#f57c00',
    path: '/streaks',
    ready: false,
  },
  {
    title: 'To-Do / Tasks',
    description: 'Organize your tasks, set priorities, and manage your daily to-do lists effectively.',
    icon: <ChecklistIcon sx={{ fontSize: 48 }} />,
    color: '#388e3c',
    path: '/todos',
    ready: true,
  },
  {
    title: 'Task Worklog',
    description: 'Log time spent on tasks, generate reports, and track your productivity over time.',
    icon: <TableChartIcon sx={{ fontSize: 48 }} />,
    color: '#7b1fa2',
    path: '/worklog',
    ready: false,
  },
];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Welcome back!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choose a module to get started.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {modules.map((mod) => (
          <Grid item xs={12} sm={6} md={6} lg={3} key={mod.path}>
            <Card
              sx={{
                height: '100%',
                position: 'relative',
                overflow: 'visible',
                border: '1px solid',
                borderColor: mod.ready ? 'transparent' : 'divider',
                opacity: mod.ready ? 1 : 0.6,
                transition: 'all 0.2s',
                '&:hover': mod.ready
                  ? {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${alpha(mod.color, 0.25)}`,
                      borderColor: mod.color,
                    }
                  : {},
              }}
            >
              <CardActionArea
                disabled={!mod.ready}
                onClick={() => navigate(mod.path)}
                sx={{ height: '100%', p: 1 }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(mod.color, 0.1),
                      color: mod.color,
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {mod.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {mod.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {mod.description}
                  </Typography>
                  {!mod.ready && (
                    <Typography
                      variant="caption"
                      sx={{
                        mt: 2,
                        display: 'inline-block',
                        bgcolor: 'action.hover',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontWeight: 600,
                      }}
                    >
                      Coming Soon
                    </Typography>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
