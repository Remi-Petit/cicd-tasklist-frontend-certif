import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import * as taskApi from '../api/taskApi';
import type { Task } from '../types/task';

vi.mock('../api/taskApi');

const mockedApi = vi.mocked(taskApi);

const task: Task = {
	id: 1,
	title: 'Tâche App',
	description: 'desc',
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

beforeEach(() => {
	vi.resetAllMocks();
});

describe('App', () => {
	it('renders header and form', async () => {
		mockedApi.getTasks.mockResolvedValue([]);
		render(<App />);
		expect(screen.getByText('Mes Tâches')).toBeInTheDocument();
		await waitFor(() => expect(screen.getByTestId('empty')).toBeInTheDocument());
	});

	it('shows stats when tasks exist', async () => {
		mockedApi.getTasks.mockResolvedValue([task, { ...task, id: 2, title: 'Autre', completed: true }]);
		render(<App />);

		await waitFor(() => expect(screen.getByText('Tâche App')).toBeInTheDocument());
		expect(screen.getByText('Total')).toBeInTheDocument();
		expect(screen.getByText('Terminées')).toBeInTheDocument();
		expect(screen.getByText('En cours')).toBeInTheDocument();
	});

	it('adds a task through the form', async () => {
		mockedApi.getTasks.mockResolvedValue([]);
		const created: Task = { ...task, id: 5, title: 'Créée' };
		mockedApi.createTask.mockResolvedValue(created);

		render(<App />);
		await waitFor(() => expect(screen.getByTestId('empty')).toBeInTheDocument());

		fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Créée' } });
		fireEvent.submit(screen.getByTestId('task-form'));

		await waitFor(() => expect(screen.getByText('Créée')).toBeInTheDocument());
	});

	it('handles add task error gracefully', async () => {
		mockedApi.getTasks.mockResolvedValue([]);
		mockedApi.createTask.mockRejectedValue(new Error('fail'));

		render(<App />);
		await waitFor(() => expect(screen.getByTestId('empty')).toBeInTheDocument());

		fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'X' } });
		fireEvent.submit(screen.getByTestId('task-form'));

		await waitFor(() => expect(mockedApi.createTask).toHaveBeenCalled());
		expect(screen.getByTestId('empty')).toBeInTheDocument();
	});
});
