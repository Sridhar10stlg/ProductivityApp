import { useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  IconButton,
  Chip,
  Fab,
  alpha,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import dayjs from 'dayjs';
import { PageHeader } from '../../../shared/components/PageHeader';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { BudgetFormDialog } from '../components/BudgetFormDialog';
import { AccountFilter } from '../components/AccountFilter';
import { getIcon } from '../../../shared/components/IconPicker';
import {
  useGetBudgetSummaryQuery,
  useGetBudgetsQuery,
  useDeleteBudgetMutation,
} from '../store/expenseApi';
import type { Budget, BudgetSummaryItem } from '../types/expense.types';

const PERIOD_LABELS: Record<string, string> = {
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
};

const PERIOD_COLORS: Record<string, string> = {
  WEEKLY: '#ed6c02',
  MONTHLY: '#1976d2',
  YEARLY: '#7b1fa2',
};

type PeriodFilter = 'ALL' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
type StatusFilter = 'ALL' | 'ON_TRACK' | 'NEAR_LIMIT' | 'OVER';
type SortKey = 'PERCENT_DESC' | 'PERCENT_ASC' | 'AMOUNT_DESC' | 'REMAINING_ASC' | 'NAME';

const STATUS_LABELS: Record<StatusFilter, string> = {
  ALL: 'All',
  ON_TRACK: 'On track (under 80%)',
  NEAR_LIMIT: 'Near limit (80-99%)',
  OVER: 'Over budget (100%+)',
};

const SORT_LABELS: Record<SortKey, string> = {
  PERCENT_DESC: '% used (high to low)',
  PERCENT_ASC: '% used (low to high)',
  AMOUNT_DESC: 'Budget amount (high to low)',
  REMAINING_ASC: 'Remaining (least first)',
  NAME: 'Category (A-Z)',
};

function matchesStatus(percentage: number, status: StatusFilter): boolean {
  switch (status) {
    case 'ON_TRACK': return percentage < 80;
    case 'NEAR_LIMIT': return percentage >= 80 && percentage < 100;
    case 'OVER': return percentage >= 100;
    default: return true;
  }
}

function getProgressColor(percentage: number): string {
  if (percentage >= 100) return '#d32f2f';
  if (percentage >= 80) return '#ed6c02';
  return '#2e7d32';
}

function formatPeriodRange(item: BudgetSummaryItem): string {
  const start = dayjs(item.periodStart);
  const end = dayjs(item.periodEnd);
  if (item.period === 'WEEKLY') {
    return `${start.format('MMM D')} - ${end.format('MMM D')}`;
  }
  if (item.period === 'MONTHLY') {
    return start.format('MMMM YYYY');
  }
  return start.format('YYYY');
}

export function BudgetPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BudgetSummaryItem | null>(null);

  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>('ALL');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('PERCENT_DESC');

  const accountIds = selectedAccounts.length > 0 ? selectedAccounts.join(',') : undefined;
  const { data: allSummary = [], isLoading: summaryLoading } = useGetBudgetSummaryQuery({ accountIds });
  const { data: budgets = [] } = useGetBudgetsQuery();
  const [deleteBudget] = useDeleteBudgetMutation();

  const handleEdit = (item: BudgetSummaryItem) => {
    const budget = budgets.find((b) => b.id === item.id);
    if (budget) {
      setEditingBudget(budget);
      setFormOpen(true);
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteBudget(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditingBudget(null);
  };

  const categoryOptions = useMemo(() => {
    const seen = new Map<number, string>();
    allSummary.forEach((b) => seen.set(b.categoryId, b.categoryName));
    return Array.from(seen, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [allSummary]);

  const periodCounts = useMemo(() => {
    const counts: Record<string, number> = { WEEKLY: 0, MONTHLY: 0, YEARLY: 0 };
    allSummary.forEach((b) => { counts[b.period] = (counts[b.period] || 0) + 1; });
    return counts;
  }, [allSummary]);

  const budgetSummary = useMemo(() => {
    const filtered = allSummary.filter(
      (b) =>
        (period === 'ALL' || b.period === period) &&
        (categoryId === '' || b.categoryId === categoryId) &&
        matchesStatus(b.percentage, status)
    );
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'PERCENT_ASC': return a.percentage - b.percentage;
        case 'AMOUNT_DESC': return b.budgetAmount - a.budgetAmount;
        case 'REMAINING_ASC': return a.remaining - b.remaining;
        case 'NAME': return a.categoryName.localeCompare(b.categoryName);
        default: return b.percentage - a.percentage;
      }
    });
  }, [allSummary, period, categoryId, status, sortKey]);

  const filtersActive =
    selectedAccounts.length > 0 || period !== 'ALL' || categoryId !== '' || status !== 'ALL';

  const clearFilters = () => {
    setSelectedAccounts([]);
    setPeriod('ALL');
    setCategoryId('');
    setStatus('ALL');
  };

  const totalBudget = budgetSummary.reduce((sum, b) => sum + b.budgetAmount, 0);
  const totalSpent = budgetSummary.reduce((sum, b) => sum + b.spent, 0);
  const overBudgetCount = budgetSummary.filter((b) => b.percentage >= 100).length;

  if (summaryLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <PageHeader title="Budgets" subtitle="Track spending against your category budgets" />

      {allSummary.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 3 }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={period}
            onChange={(_, v: PeriodFilter | null) => v && setPeriod(v)}
          >
            <ToggleButton value="ALL">All ({allSummary.length})</ToggleButton>
            {(['WEEKLY', 'MONTHLY', 'YEARLY'] as const).map((p) => (
              <ToggleButton key={p} value={p} disabled={periodCounts[p] === 0}>
                {PERIOD_LABELS[p]} ({periodCounts[p]})
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="budget-category-label">Category</InputLabel>
            <Select
              labelId="budget-category-label"
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value as number | '')}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categoryOptions.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="budget-status-label">Status</InputLabel>
            <Select
              labelId="budget-status-label"
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((k) => (
                <MenuItem key={k} value={k}>{STATUS_LABELS[k]}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <AccountFilter value={selectedAccounts} onChange={setSelectedAccounts} />

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="budget-sort-label">Sort by</InputLabel>
            <Select
              labelId="budget-sort-label"
              label="Sort by"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <MenuItem key={k} value={k}>{SORT_LABELS[k]}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {filtersActive && (
            <Button size="small" startIcon={<FilterAltOffIcon />} onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </Box>
      )}

      {budgetSummary.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">Total Budgeted</Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  ₹{totalBudget.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">Total Spent</Typography>
                <Typography variant="h5" fontWeight={700} color="error.main">
                  ₹{totalSpent.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">Over Budget</Typography>
                <Typography variant="h5" fontWeight={700} color={overBudgetCount > 0 ? 'error.main' : 'success.main'}>
                  {overBudgetCount} / {budgetSummary.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {allSummary.length === 0 ? (
        <EmptyState
          message="No budgets set yet"
          actionLabel="Add your first budget"
          onAction={() => setFormOpen(true)}
        />
      ) : budgetSummary.length === 0 ? (
        <EmptyState
          message="No budgets match these filters"
          actionLabel="Clear filters"
          onAction={clearFilters}
        />
      ) : (
        <Grid container spacing={2}>
          {budgetSummary.map((item) => {
            const progressColor = getProgressColor(item.percentage);
            const isOver = item.percentage >= 100;

            return (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card
                  sx={{
                    height: '100%',
                    borderLeft: `4px solid ${item.categoryColor}`,
                    ...(isOver && {
                      bgcolor: alpha('#d32f2f', 0.03),
                    }),
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ color: item.categoryColor }}>
                          {getIcon(item.categoryIcon)}
                        </Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {item.categoryName}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => handleEdit(item)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setDeleteTarget(item)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Chip
                      label={PERIOD_LABELS[item.period]}
                      size="small"
                      sx={{
                        bgcolor: alpha(PERIOD_COLORS[item.period] || '#607d8b', 0.1),
                        color: PERIOD_COLORS[item.period],
                        fontWeight: 600,
                        mb: 1.5,
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      {formatPeriodRange(item)}
                    </Typography>

                    <Box sx={{ mt: 1, mb: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight={600}>
                        ₹{item.spent.toFixed(2)} <Typography component="span" variant="body2" color="text.secondary">/ ₹{item.budgetAmount.toFixed(2)}</Typography>
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color={progressColor}
                      >
                        {item.percentage}%
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={Math.min(item.percentage, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(progressColor, 0.15),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: progressColor,
                          borderRadius: 4,
                        },
                      }}
                    />

                    <Typography
                      variant="caption"
                      color={isOver ? 'error.main' : 'success.main'}
                      fontWeight={600}
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      {isOver
                        ? `Over by ₹${Math.abs(item.remaining).toFixed(2)}`
                        : `₹${item.remaining.toFixed(2)} remaining`}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => {
          setEditingBudget(null);
          setFormOpen(true);
        }}
      >
        <AddIcon />
      </Fab>

      <BudgetFormDialog
        open={formOpen}
        onClose={handleClose}
        budget={editingBudget}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Budget"
        message={`Remove the ₹${deleteTarget?.budgetAmount.toFixed(2)} ${PERIOD_LABELS[deleteTarget?.period || '']} budget for ${deleteTarget?.categoryName}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
