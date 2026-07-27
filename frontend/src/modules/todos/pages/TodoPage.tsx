import { useSelector, useDispatch } from 'react-redux';
import { Box } from '@mui/material';
import { TodoSidebar } from '../components/TodoSidebar';
import { TaskListView } from '../components/TaskListView';
import { TaskDetail } from '../components/TaskDetail';
import { useGetTasksQuery } from '../store/todoApi';
import { selectTask } from '../store/todoUiSlice';
import type { RootState } from '../../../store';

export function TodoPage() {
  const dispatch = useDispatch();
  const { selectedView, selectedListId, selectedTaskId } = useSelector((state: RootState) => state.todoUi);

  const queryParams = selectedView
    ? { view: selectedView }
    : selectedListId
      ? { listId: selectedListId }
      : { view: 'all' as const };

  const { data: tasks = [] } = useGetTasksQuery(queryParams);
  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null;

  return (
    <Box
      sx={{
        display: 'flex',
        height: 'calc(100vh - 64px)',
        bgcolor: 'background.default',
      }}
    >
      <TodoSidebar />
      <TaskListView />
      {selectedTask && (
        <TaskDetail task={selectedTask} onClose={() => dispatch(selectTask(null))} />
      )}
    </Box>
  );
}
