import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTasks } from '../hooks/useTasks';
import * as taskApi from '../api/taskApi';
import type { Task } from '../types/task';

vi.mock('../api/taskApi');

const mockedApi = vi.mocked(taskApi);

const taskA: Task = {
	id: 1,
	title: 'A',
	description: null,
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

const taskB: Task = { ...taskA, id: 2, title: 'B' };

beforeEach(() => {
	vi.resetAllMocks();
});

describe('useTasks', () => {
	it('loads tasks on mount', async () => {
		mockedApi.getTasks.mockResolvedValue([taskA, taskB]);
		const { result } = renderHook(() => useTasks());

		expect(result.current.loading).toBe(true);
		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.tasks).toEqual([taskA, taskB]);
		expect(result.current.error).toBeNull();
	});

	it('sets error message when loading fails', async () => {
		mockedApi.getTasks.mockRejectedValue(new Error('Network down'));
		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.error).toBe('Network down');
	});

	it('uses fallback error message for non-Error rejections', async () => {
		mockedApi.getTasks.mockRejectedValue('oops');
		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.error).toBe('Une erreur est survenue');
	});

	it('adds a task to the front of the list', async () => {
		mockedApi.getTasks.mockResolvedValue([taskA]);
		const newTask: Task = { ...taskA, id: 3, title: 'C' };
		mockedApi.createTask.mockResolvedValue(newTask);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.addTask({ title: 'C' });
		});
		expect(result.current.tasks).toEqual([newTask, taskA]);
	});

	it('edits an existing task', async () => {
		mockedApi.getTasks.mockResolvedValue([taskA, taskB]);
		const updated: Task = { ...taskB, title: 'B modifié' };
		mockedApi.updateTask.mockResolvedValue(updated);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.editTask(2, { title: 'B modifié' });
		});
		expect(result.current.tasks).toEqual([taskA, updated]);
	});

	it('removes a task', async () => {
		mockedApi.getTasks.mockResolvedValue([taskA, taskB]);
		mockedApi.deleteTask.mockResolvedValue(undefined);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.removeTask(1);
		});
		expect(result.current.tasks).toEqual([taskB]);
	});

	it('toggles completion of a task', async () => {
		mockedApi.getTasks.mockResolvedValue([taskA, taskB]);
		const toggled: Task = { ...taskA, completed: true };
		mockedApi.updateTask.mockResolvedValue(toggled);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.toggleComplete(1);
		});
		expect(mockedApi.updateTask).toHaveBeenCalledWith(1, { completed: true });
		expect(result.current.tasks[0].completed).toBe(true);
		expect(result.current.tasks[1]).toEqual(taskB);
	});

	it('does nothing when toggling an unknown task', async () => {
		mockedApi.getTasks.mockResolvedValue([taskA]);
		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.toggleComplete(999);
		});
		expect(mockedApi.updateTask).not.toHaveBeenCalled();
	});
});
