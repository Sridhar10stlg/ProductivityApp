import { Box, Checkbox, Typography, IconButton } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import dayjs from 'dayjs';
import { useUpdateTaskMutation } from '../store/todoApi';
import type { Task } from '../types/todo.types';

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: '#d32f2f',
  MEDIUM: '#ed6c02',
  LOW: '#1976d2',
};

interface TaskItemProps {
  task: Task;
  selected: boolean;
  onClick: () => void;
}

export function TaskItem({ task, selected, onClick }: TaskItemProps) {
  const [updateTask] = useUpdateTaskMutation();

  const toggleCompleted = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask({ id: task.id, data: { completed: !task.completed } });
  };

  const toggleImportant = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask({ id: task.id, data: { important: !task.important } });
  };

  const isOverdue = task.dueDate && !task.completed && dayjs(task.dueDate).isBefore(dayjs(), 'day');
  const subtaskDone = task.subtasks.filter((s) => s.completed).length;
  const subtaskTotal = task.subtasks.length;

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 1,
        cursor: 'pointer',
        bgcolor: selected ? 'action.selected' : 'transparent',
        borderRadius: 1,
        '&:hover': { bgcolor: selected ? 'action.selected' : 'action.hover' },
        transition: 'background 0.15s',
      }}
    >
      <Checkbox
        checked={task.completed}
        onClick={toggleCompleted}
        size="small"
        sx={{
          color: task.priority !== 'NONE' ? PRIORITY_COLORS[task.priority] : undefined,
          '&.Mui-checked': { color: '#bdbdbd' },
        }}
      />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            textDecoration: task.completed ? 'line-through' : 'none',
            color: task.completed ? 'text.disabled' : 'text.primary',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {task.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.25 }}>
          {task.dueDate && (
            <Typography variant="caption" color={isOverdue ? 'error.main' : 'text.secondary'}>
              {dayjs(task.dueDate).format('MMM D')}
            </Typography>
          )}
          {subtaskTotal > 0 && (
            <Typography variant="caption" color="text.secondary">
              {subtaskDone}/{subtaskTotal}
            </Typography>
          )}
          {task.list && (
            <Typography variant="caption" color="text.secondary">
              {task.list.name}
            </Typography>
          )}
        </Box>
      </Box>

      <IconButton size="small" onClick={toggleImportant}>
        {task.important ? (
          <StarIcon fontSize="small" sx={{ color: '#d32f2f' }} />
        ) : (
          <StarBorderIcon fontSize="small" sx={{ color: 'text.disabled' }} />
        )}
      </IconButton>
    </Box>
  );
}
