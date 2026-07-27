import { useState } from 'react';
import { Box, Checkbox, TextField, IconButton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useUpdateSubTaskMutation, useDeleteSubTaskMutation } from '../store/todoApi';
import type { SubTask } from '../types/todo.types';

interface SubTaskItemProps {
  subtask: SubTask;
  taskId: number;
}

export function SubTaskItem({ subtask, taskId }: SubTaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(subtask.title);
  const [updateSubTask] = useUpdateSubTaskMutation();
  const [deleteSubTask] = useDeleteSubTaskMutation();

  const handleToggle = () => {
    updateSubTask({ taskId, id: subtask.id, data: { completed: !subtask.completed } });
  };

  const handleSave = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== subtask.title) {
      updateSubTask({ taskId, id: subtask.id, data: { title: trimmed } });
    } else {
      setTitle(subtask.title);
    }
    setEditing(false);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, py: 0.25 }}>
      <Checkbox checked={subtask.completed} onChange={handleToggle} size="small" />

      {editing ? (
        <TextField
          autoFocus
          size="small"
          variant="standard"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') { setTitle(subtask.title); setEditing(false); }
          }}
          sx={{ flex: 1 }}
        />
      ) : (
        <Typography
          variant="body2"
          onClick={() => setEditing(true)}
          sx={{
            flex: 1,
            cursor: 'pointer',
            textDecoration: subtask.completed ? 'line-through' : 'none',
            color: subtask.completed ? 'text.disabled' : 'text.primary',
          }}
        >
          {subtask.title}
        </Typography>
      )}

      <IconButton size="small" onClick={() => deleteSubTask({ taskId, id: subtask.id })}>
        <DeleteIcon fontSize="small" sx={{ color: 'text.disabled' }} />
      </IconButton>
    </Box>
  );
}
