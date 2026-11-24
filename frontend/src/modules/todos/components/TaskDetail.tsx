import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  MenuItem,
  Divider,
  Chip,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import LightModeIcon from '@mui/icons-material/LightMode';
import AddIcon from '@mui/icons-material/Add';
import dayjs from 'dayjs';
import { useUpdateTaskMutation, useDeleteTaskMutation, useCreateSubTaskMutation, useGetListsQuery } from '../store/todoApi';
import { SubTaskItem } from './SubTaskItem';
import type { Task, Priority } from '../types/todo.types';

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'NONE', label: 'None', color: '#bdbdbd' },
  { value: 'LOW', label: 'Low', color: '#1976d2' },
  { value: 'MEDIUM', label: 'Medium', color: '#ed6c02' },
  { value: 'HIGH', label: 'High', color: '#d32f2f' },
];

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetail({ task, onClose }: TaskDetailProps) {
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [createSubTask] = useCreateSubTaskMutation();
  const { data: lists = [] } = useGetListsQuery();

  const [newStepTitle, setNewStepTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [note, setNote] = useState(task.note || '');

  const handleTitleSave = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== task.title) {
      updateTask({ id: task.id, data: { title: trimmed } });
    }
    setEditingTitle(false);
  };

  const handleNoteBlur = () => {
    if (note !== (task.note || '')) {
      updateTask({ id: task.id, data: { note: note || null } });
    }
  };

  const handleAddStep = () => {
    const trimmed = newStepTitle.trim();
    if (!trimmed) return;
    createSubTask({ taskId: task.id, title: trimmed });
    setNewStepTitle('');
  };

  const handleDelete = async () => {
    await deleteTask(task.id);
    onClose();
  };

  return (
    <Box
      sx={{
        width: 350,
        borderLeft: '1px solid',
        borderColor: 'divider',
        height: '100%',
        overflow: 'auto',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, pb: 1 }}>
        <IconButton size="small" onClick={() => updateTask({ id: task.id, data: { important: !task.important } })}>
          {task.important ? <StarIcon sx={{ color: '#d32f2f' }} /> : <StarBorderIcon />}
        </IconButton>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, px: 2, pb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Title */}
        {editingTitle ? (
          <TextField
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => { if (e.key === 'Enter') handleTitleSave(); }}
            variant="standard"
            inputProps={{ style: { fontSize: '1.1rem', fontWeight: 600 } }}
          />
        ) : (
          <Typography
            variant="h6"
            fontWeight={600}
            onClick={() => { setTitle(task.title); setEditingTitle(true); }}
            sx={{
              cursor: 'pointer',
              textDecoration: task.completed ? 'line-through' : 'none',
              color: task.completed ? 'text.disabled' : 'text.primary',
            }}
          >
            {task.title}
          </Typography>
        )}

        {/* My Day toggle */}
        <Chip
          icon={<LightModeIcon />}
          label={task.myDay ? 'Added to My Day' : 'Add to My Day'}
          variant={task.myDay ? 'filled' : 'outlined'}
          color={task.myDay ? 'warning' : 'default'}
          size="small"
          onClick={() => updateTask({ id: task.id, data: { myDay: !task.myDay } })}
          sx={{ alignSelf: 'flex-start' }}
        />

        {/* Steps / Sub-tasks */}
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Steps
          </Typography>
          {task.subtasks.map((st) => (
            <SubTaskItem key={st.id} subtask={st} taskId={task.id} />
          ))}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <AddIcon fontSize="small" color="primary" />
            <TextField
              size="small"
              variant="standard"
              placeholder="Add a step"
              value={newStepTitle}
              onChange={(e) => setNewStepTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddStep(); }}
              sx={{ flex: 1 }}
            />
          </Box>
        </Box>

        <Divider />

        {/* Due date */}
        <TextField
          label="Due Date"
          type="date"
          size="small"
          value={task.dueDate ? dayjs(task.dueDate).format('YYYY-MM-DD') : ''}
          onChange={(e) => updateTask({ id: task.id, data: { dueDate: e.target.value || null } })}
          InputLabelProps={{ shrink: true }}
        />

        {/* Priority */}
        <TextField
          select
          label="Priority"
          size="small"
          value={task.priority}
          onChange={(e) => updateTask({ id: task.id, data: { priority: e.target.value as Priority } })}
        >
          {PRIORITIES.map((p) => (
            <MenuItem key={p.value} value={p.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color }} />
                {p.label}
              </Box>
            </MenuItem>
          ))}
        </TextField>

        {/* Move to list */}
        <TextField
          select
          label="List"
          size="small"
          value={task.listId ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            updateTask({ id: task.id, data: { listId: val ? parseInt(val, 10) : null } });
          }}
        >
          <MenuItem value="">None</MenuItem>
          {lists.map((list) => (
            <MenuItem key={list.id} value={list.id}>{list.name}</MenuItem>
          ))}
        </TextField>

        {/* Note */}
        <TextField
          label="Note"
          multiline
          minRows={3}
          size="small"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={handleNoteBlur}
          placeholder="Add a note..."
        />

        <Divider />

        {/* Delete */}
        <Button
          startIcon={<DeleteIcon />}
          color="error"
          size="small"
          onClick={handleDelete}
          sx={{ alignSelf: 'flex-start' }}
        >
          Delete Task
        </Button>
      </Box>
    </Box>
  );
}
