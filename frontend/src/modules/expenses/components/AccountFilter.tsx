import {
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  MenuItem,
  Checkbox,
  ListItemText,
  Chip,
  Box,
} from '@mui/material';
import { useGetAccountsQuery } from '../store/expenseApi';
import { getIcon } from '../../../shared/components/IconPicker';

interface AccountFilterProps {
  value: number[];
  onChange: (accountIds: number[]) => void;
}

export function AccountFilter({ value, onChange }: AccountFilterProps) {
  const { data: accounts = [] } = useGetAccountsQuery();

  if (accounts.length <= 1) return null;

  return (
    <FormControl size="small" sx={{ minWidth: 180 }}>
      <InputLabel id="account-filter-label">Accounts</InputLabel>
      <Select
        labelId="account-filter-label"
        multiple
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          onChange(typeof val === 'string' ? val.split(',').map(Number) : val as number[]);
        }}
        input={<OutlinedInput label="Accounts" />}
        renderValue={(selected) => {
          if (selected.length === 0 || selected.length === accounts.length) {
            return <em>All Accounts</em>;
          }
          return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((id) => {
                const acc = accounts.find((a) => a.id === id);
                return acc ? <Chip key={id} label={acc.name} size="small" /> : null;
              })}
            </Box>
          );
        }}
      >
        {accounts.map((acc) => (
          <MenuItem key={acc.id} value={acc.id}>
            <Checkbox checked={value.includes(acc.id)} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getIcon(acc.icon)}
              <ListItemText primary={acc.name} />
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
