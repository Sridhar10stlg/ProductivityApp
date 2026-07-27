import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, TextField, Typography, InputAdornment, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LightModeIcon from '@mui/icons-material/LightMode';
import StarIcon from '@mui/icons-material/Star';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { useGetTasksQuery, useGetListsQuery, useCreateTaskMutation } from '../store/todoApi';
import { selectTask } from '../store/todoUiSlice';
import { TaskItem } from './TaskItem';
import { TodoImportExportDialog } from './TodoImportExportDialog';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { EmptyState } from '../../../shared/components/EmptyState';
import type { RootState } from '../../../store';

const VIEW_CONFIG: Record<string, { title: string; icon: React.ReactNode; color: string }> = {
  myday: { title: 'My Day', icon: <LightModeIcon />, color: '#ed6c02' },
  important: { title: 'Important', icon: <StarIcon />, color: '#d32f2f' },
  planned: { title: 'Planned', icon: <CalendarTodayIcon />, color: '#1976d2' },
  all: { title: 'All Tasks', icon: <ListAltIcon />, color: '#388e3c' },
};

export function TaskListView() {
  const dispatch = useDispatch();
  const { selectedView, selectedListId, selectedTaskId } = useSelector((state: RootState) => state.todoUi);
  const { data: lists = [] } = useGetListsQuery();
  const [createTask] = useCreateTaskMutation();

  const queryParams = selectedView
    ? { view: selectedView }
    : selectedListId
      ? { listId: selectedListId }
      : { view: 'all' as const };

  const { data: tasks = [], isLoading } = useGetTasksQuery(queryParams);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showImportExport, setShowImportExport] = useState(false);

  const viewConfig = selectedView ? VIEW_CONFIG[selectedView] : null;
  const currentList = selectedListId ? lists.find((l) => l.id === selectedListId) : null;
  const headerTitle = viewConfig?.title || currentList?.name || 'Tasks';
  const headerColor = viewConfig?.color || currentList?.color || '#388e3c';

  // Only assign listId when viewing a specific list
  const handleAddTask = async () => {
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;

    await createTask({
      title: trimmed,
      listId: selectedListId || undefined,
      myDay: selectedView === 'myday' ? true : undefined,
      important: selectedView === 'important' ? true : undefined,
    });
    setNewTaskTitle('');
  };

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {viewConfig && <Box sx={{ color: headerColor }}>{viewConfig.icon}</Box>}
          <Typography variant="h5" fontWeight={700} color={headerColor} sx={{ flex: 1 }}>
            {headerTitle}
          </Typography>
          <Tooltip title="Import / Export">
            <IconButton size="small" onClick={() => setShowImportExport(true)}>
              <SwapVertIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Add task */}
      <Box sx={{ px: 3, pb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Add a task"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AddIcon color="primary" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper',
              },
            }}
          />
        </Box>

      {/* Task list */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2 }}>
        {isLoading ? (
          <LoadingSpinner />
        ) : tasks.length === 0 ? (
          <EmptyState message="No tasks here yet" />
        ) : (
          <>
            {incompleteTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                selected={selectedTaskId === task.id}
                onClick={() => dispatch(selectTask(task.id))}
              />
            ))}

            {completedTasks.length > 0 && (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ px: 1.5, pt: 2, display: 'block' }}>
                  Completed ({completedTasks.length})
                </Typography>
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    selected={selectedTaskId === task.id}
                    onClick={() => dispatch(selectTask(task.id))}
                  />
                ))}
              </>
            )}
          </>
        )}
      </Box>

      <TodoImportExportDialog
        open={showImportExport}
        onClose={() => setShowImportExport(false)}
      />
    </Box>
  );
}
