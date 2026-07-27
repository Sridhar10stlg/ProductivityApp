import { useState } from 'react';
import { Box, IconButton, Typography, TextField, Tooltip } from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ReceiptIcon from '@mui/icons-material/Receipt';
import MovieIcon from '@mui/icons-material/Movie';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import SchoolIcon from '@mui/icons-material/School';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import WorkIcon from '@mui/icons-material/Work';
import LaptopIcon from '@mui/icons-material/Laptop';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ReplayIcon from '@mui/icons-material/Replay';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HomeIcon from '@mui/icons-material/Home';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import PetsIcon from '@mui/icons-material/Pets';
import FlightIcon from '@mui/icons-material/Flight';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SavingsIcon from '@mui/icons-material/Savings';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import React from 'react';

export const iconMap: Record<string, React.ComponentType> = {
  Restaurant: RestaurantIcon,
  DirectionsCar: DirectionsCarIcon,
  ShoppingBag: ShoppingBagIcon,
  Receipt: ReceiptIcon,
  Movie: MovieIcon,
  LocalHospital: LocalHospitalIcon,
  School: SchoolIcon,
  MoreHoriz: MoreHorizIcon,
  Work: WorkIcon,
  Laptop: LaptopIcon,
  TrendingUp: TrendingUpIcon,
  CardGiftcard: CardGiftcardIcon,
  Replay: ReplayIcon,
  AccountBalanceWallet: AccountBalanceWalletIcon,
  Home: HomeIcon,
  FitnessCenter: FitnessCenterIcon,
  Pets: PetsIcon,
  Flight: FlightIcon,
  PhoneAndroid: PhoneAndroidIcon,
  LocalCafe: LocalCafeIcon,
  ShoppingCart: ShoppingCartIcon,
  Savings: SavingsIcon,
  AttachMoney: AttachMoneyIcon,
  AccountBalance: AccountBalanceIcon,
};

const iconEntries = Object.entries(iconMap);

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? iconEntries.filter(([name]) => name.toLowerCase().includes(search.toLowerCase()))
    : iconEntries;

  return (
    <Box>
      <TextField
        size="small"
        placeholder="Search icons..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ mb: 1 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        Select an icon:
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxHeight: 200, overflow: 'auto' }}>
        {filtered.map(([name, Icon]) => (
          <Tooltip key={name} title={name} arrow>
            <IconButton
              size="small"
              onClick={() => onChange(name)}
              sx={{
                border: value === name ? '2px solid' : '1px solid transparent',
                borderColor: value === name ? 'primary.main' : 'transparent',
                bgcolor: value === name ? 'primary.50' : undefined,
                borderRadius: 1,
              }}
            >
              <Icon />
            </IconButton>
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
}

export function getIcon(name: string | null): React.ReactNode {
  if (!name) return null;
  const Icon = iconMap[name];
  if (!Icon) return null;
  return <Icon />;
}
