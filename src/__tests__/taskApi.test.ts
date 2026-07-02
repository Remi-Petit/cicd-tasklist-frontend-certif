import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTasks, getTask, createTask, updateTask, deleteTask } from '../api/taskApi';

const mockTask = {
	id: 1,
	title: 'Test',
	description: null,
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('taskApi', () => {
	it('getTasks returns array', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve([mockTask]),
			})
		);

		const tasks = await getTasks();
		expect(tasks).toEqual([mockTask]);
		expect(fetch).toHaveBeenCalledWith('/api/tasks');
	});

	it('getTasks throws on error response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				text: () => Promise.resolve('Internal Server Error'),
			})
		);

		await expect(getTasks()).rejects.toThrow('HTTP 500: Internal Server Error');
	});

	it('getTask returns a single task', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockTask),
			})
		);

		const task = await getTask(1);
		expect(task).toEqual(mockTask);
		expect(fetch).toHaveBeenCalledWith('/api/tasks/1');
	});

	it('getTask throws on error response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
				text: () => Promise.resolve('Not Found'),
			})
		);

		await expect(getTask(99)).rejects.toThrow('HTTP 404: Not Found');
	});

	it('createTask sends POST with body', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockTask),
			})
		);

		const payload = { title: 'Test', description: 'desc' };
		const task = await createTask(payload);
		expect(task).toEqual(mockTask);
		expect(fetch).toHaveBeenCalledWith('/api/tasks', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
	});

	it('createTask throws on error response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 400,
				text: () => Promise.resolve('Bad Request'),
			})
		);

		await expect(createTask({ title: '' })).rejects.toThrow('HTTP 400: Bad Request');
	});

	it('updateTask sends PUT with body', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ ...mockTask, completed: true }),
			})
		);

		const payload = { completed: true };
		const task = await updateTask(1, payload);
		expect(task.completed).toBe(true);
		expect(fetch).toHaveBeenCalledWith('/api/tasks/1', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
	});

	it('updateTask throws on error response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 422,
				text: () => Promise.resolve('Unprocessable'),
			})
		);

		await expect(updateTask(1, { title: 'x' })).rejects.toThrow('HTTP 422: Unprocessable');
	});

	it('deleteTask sends DELETE', async () => {
		const fetchMock = vi.fn().mockResolvedValue({ ok: true });
		vi.stubGlobal('fetch', fetchMock);

		await expect(deleteTask(1)).resolves.toBeUndefined();
		expect(fetchMock).toHaveBeenCalledWith('/api/tasks/1', { method: 'DELETE' });
	});

	it('deleteTask throws on error response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
				text: () => Promise.resolve('Not Found'),
			})
		);

		await expect(deleteTask(99)).rejects.toThrow('HTTP 404: Not Found');
	});
});
