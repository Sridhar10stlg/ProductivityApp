import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Divider,
  TextField,
  Typography,
} from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import StarIcon from '@mui/icons-material/Star';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ListAltIcon from '@mui/icons-material/ListAlt';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';
import { useGetListsQuery, useGetTaskStatsQuery, useCreateListMutation } from '../store/todoApi';
import { selectSmartView, selectList } from '../store/todoUiSlice';
import type { RootState } from '../../../store';
import type { SmartView, TaskStats } from '../types/todo.types';

const smartViews: { key: SmartView; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'myday', label: 'My Day', icon: <LightModeIcon />, color: '#ed6c02' },
  { key: 'important', label: 'Important', icon: <StarIcon />, color: '#d32f2f' },
  { key: 'planned', label: 'Planned', icon: <CalendarTodayIcon />, color: '#1976d2' },
  { key: 'all', label: 'All Tasks', icon: <ListAltIcon />, color: '#388e3c' },
];

export function TodoSidebar() {
  const dispatch = useDispatch();
  const { selectedView, selectedListId } = useSelector((state: RootState) => state.todoUi);
  const { data: lists = [] } = useGetListsQuery();
  const { data: stats } = useGetTaskStatsQuery();
  const [createList] = useCreateListMutation();
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');

  const handleCreateList = async () => {
    const name = newListName.trim();
    if (!name) return;
    await createList({ name });
    setNewListName('');
    setShowNewList(false);
  };

  const STAT_KEYS: Record<SmartView, keyof Omit<TaskStats, 'lists'>> = {
    myday: 'myDay',
    important: 'important',
    planned: 'planned',
    all: 'all',
  };

  const getSmartCount = (key: SmartView) => {
    if (!stats) return 0;
    return stats[STAT_KEYS[key]] || 0;
  };

  return (
    <Box sx={{ width: 220, borderRight: '1px solid', borderColor: 'divider', height: '100%', overflow: 'auto' }}>
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
          VIEWS
        </Typography>
      </Box>
      <List dense>
        {smartViews.map((sv) => (
          <ListItemButton
            key={sv.key}
            selected={selectedView === sv.key}
            onClick={() => dispatch(selectSmartView(sv.key))}
            sx={{
              '&.Mui-selected': { bgcolor: `${sv.color}10`, borderRight: `3px solid ${sv.color}` },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: selectedView === sv.key ? sv.color : undefined }}>
              {sv.icon}
            </ListItemIcon>
            <ListItemText
              primary={sv.label}
              primaryTypographyProps={{
                fontWeight: selectedView === sv.key ? 700 : 400,
                fontSize: '0.875rem',
              }}
            />
            <Badge
              badgeContent={getSmartCount(sv.key)}
              color="default"
              sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem', minWidth: 18, height: 18 } }}
            />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ px: 2, pb: 0.5 }}>
        <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
          LISTS
        </Typography>
      </Box>
      <List dense>
        {lists.map((list) => (
          <ListItemButton
            key={list.id}
            selected={selectedListId === list.id}
            onClick={() => dispatch(selectList(list.id))}
            sx={{
              '&.Mui-selected': { bgcolor: '#388e3c10', borderRight: '3px solid #388e3c' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <FolderIcon fontSize="small" sx={{ color: list.color || '#607d8b' }} />
            </ListItemIcon>
            <ListItemText
              primary={list.name}
              primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: selectedListId === list.id ? 700 : 400 }}
            />
            <Badge
              badgeContent={stats?.lists[list.id] || 0}
              color="default"
              sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem', minWidth: 18, height: 18 } }}
            />
          </ListItemButton>
        ))}

        {showNewList ? (
          <Box sx={{ px: 2, py: 0.5 }}>
            <TextField
              autoFocus
              size="small"
              placeholder="List name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateList();
                if (e.key === 'Escape') { setShowNewList(false); setNewListName(''); }
              }}
              onBlur={() => { if (!newListName.trim()) setShowNewList(false); }}
              fullWidth
            />
          </Box>
        ) : (
          <ListItemButton onClick={() => setShowNewList(true)}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <AddIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="New List"
              primaryTypographyProps={{ fontSize: '0.875rem', color: 'primary.main', fontWeight: 500 }}
            />
          </ListItemButton>
        )}
      </List>
    </Box>
  );
}
