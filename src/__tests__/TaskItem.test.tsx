import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskItem } from '../components/TaskItem';
import type { Task } from '../types/task';

const baseTask: Task = {
	id: 1,
	title: 'Ma tâche',
	description: 'Ma description',
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

describe('TaskItem', () => {
	it('renders title, description and date', () => {
		render(<TaskItem task={baseTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
		expect(screen.getByText('Ma tâche')).toBeInTheDocument();
		expect(screen.getByText('Ma description')).toBeInTheDocument();
		expect(screen.getByTestId('task-item')).toBeInTheDocument();
	});

	it('does not render description when absent', () => {
		render(
			<TaskItem task={{ ...baseTask, description: null }} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />
		);
		expect(screen.queryByText('Ma description')).not.toBeInTheDocument();
	});

	it('applies completed class when task is completed', () => {
		render(
			<TaskItem task={{ ...baseTask, completed: true }} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />
		);
		expect(screen.getByTestId('task-item')).toHaveClass('task-completed');
	});

	it('calls onToggle when checkbox clicked', () => {
		const onToggle = vi.fn();
		render(<TaskItem task={baseTask} onToggle={onToggle} onDelete={vi.fn()} onEdit={vi.fn()} />);
		fireEvent.click(screen.getByRole('checkbox'));
		expect(onToggle).toHaveBeenCalledWith(1);
	});

	it('enters edit mode and saves changes', () => {
		const onEdit = vi.fn();
		render(<TaskItem task={baseTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />);
		fireEvent.click(screen.getByLabelText('Modifier'));

		const titleInput = screen.getByLabelText('Modifier le titre');
		const descInput = screen.getByLabelText('Modifier la description');
		fireEvent.change(titleInput, { target: { value: 'Nouveau titre' } });
		fireEvent.change(descInput, { target: { value: 'Nouvelle desc' } });
		fireEvent.click(screen.getByText('Enregistrer'));

		expect(onEdit).toHaveBeenCalledWith(1, { title: 'Nouveau titre', description: 'Nouvelle desc' });
		expect(screen.queryByText('Enregistrer')).not.toBeInTheDocument();
	});

	it('saves with undefined description when emptied', () => {
		const onEdit = vi.fn();
		render(<TaskItem task={baseTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />);
		fireEvent.click(screen.getByLabelText('Modifier'));
		fireEvent.change(screen.getByLabelText('Modifier la description'), { target: { value: '   ' } });
		fireEvent.click(screen.getByText('Enregistrer'));
		expect(onEdit).toHaveBeenCalledWith(1, { title: 'Ma tâche', description: undefined });
	});

	it('does not save when title is empty', () => {
		const onEdit = vi.fn();
		render(<TaskItem task={baseTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />);
		fireEvent.click(screen.getByLabelText('Modifier'));
		fireEvent.change(screen.getByLabelText('Modifier le titre'), { target: { value: '  ' } });
		fireEvent.click(screen.getByText('Enregistrer'));
		expect(onEdit).not.toHaveBeenCalled();
		expect(screen.getByText('Enregistrer')).toBeInTheDocument();
	});

	it('cancels edit and restores values', () => {
		render(
			<TaskItem task={{ ...baseTask, description: null }} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />
		);
		fireEvent.click(screen.getByLabelText('Modifier'));
		fireEvent.change(screen.getByLabelText('Modifier le titre'), { target: { value: 'Changé' } });
		fireEvent.click(screen.getByText('Annuler'));
		expect(screen.queryByText('Annuler')).not.toBeInTheDocument();
		expect(screen.getByText('Ma tâche')).toBeInTheDocument();
	});

	describe('delete flow', () => {
		beforeEach(() => vi.useFakeTimers());
		afterEach(() => vi.useRealTimers());

		it('requires confirmation before delete', () => {
			const onDelete = vi.fn();
			render(<TaskItem task={baseTask} onToggle={vi.fn()} onDelete={onDelete} onEdit={vi.fn()} />);
			const deleteBtn = screen.getByLabelText('Supprimer');

			fireEvent.click(deleteBtn);
			expect(onDelete).not.toHaveBeenCalled();
			expect(deleteBtn).toHaveTextContent('⚠️');

			fireEvent.click(deleteBtn);
			expect(onDelete).toHaveBeenCalledWith(1);
		});

		it('resets confirmation after timeout', () => {
			const onDelete = vi.fn();
			render(<TaskItem task={baseTask} onToggle={vi.fn()} onDelete={onDelete} onEdit={vi.fn()} />);
			const deleteBtn = screen.getByLabelText('Supprimer');

			fireEvent.click(deleteBtn);
			expect(deleteBtn).toHaveTextContent('⚠️');

			act(() => {
				vi.advanceTimersByTime(3000);
			});
			expect(deleteBtn).toHaveTextContent('🗑️');
		});
	});
});
