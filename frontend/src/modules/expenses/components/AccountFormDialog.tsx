import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import { IconPicker } from '../../../shared/components/IconPicker';
import { useCreateAccountMutation } from '../store/expenseApi';

interface AccountFormDialogProps {
  open: boolean;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  '#4caf50', '#2196f3', '#e91e63', '#ff9800', '#9c27b0',
  '#f44336', '#00bcd4', '#607d8b', '#795548', '#3f51b5',
];

export function AccountFormDialog({ open, onClose }: AccountFormDialogProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('AccountBalance');
  const [color, setColor] = useState('#2196f3');
  const [createAccount, { isLoading }] = useCreateAccountMutation();

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await createAccount({ name: name.trim(), icon, color });
    setName('');
    setIcon('AccountBalance');
    setColor('#2196f3');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Account</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Account Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            autoFocus
            placeholder="e.g., SBI Bank, HDFC, PayTM"
          />
          <IconPicker value={icon} onChange={setIcon} />
          <Box>
            <Box component="span" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              Color:
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              {COLOR_OPTIONS.map((c) => (
                <Box
                  key={c}
                  onClick={() => setColor(c)}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: c,
                    cursor: 'pointer',
                    border: color === c ? '3px solid' : '2px solid transparent',
                    borderColor: color === c ? 'text.primary' : 'transparent',
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isLoading || !name.trim()}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
