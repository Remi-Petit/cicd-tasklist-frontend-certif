import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskForm } from '../components/TaskForm';

describe('TaskForm', () => {
	it('renders create mode by default', () => {
		render(<TaskForm onSubmit={vi.fn()} />);
		expect(screen.getByText('Nouvelle tâche')).toBeInTheDocument();
		expect(screen.getByText('Ajouter')).toBeInTheDocument();
	});

	it('renders edit mode with initial values', () => {
		render(
			<TaskForm
				onSubmit={vi.fn()}
				mode="edit"
				initialValues={{ title: 'Titre', description: 'Desc' }}
			/>
		);
		expect(screen.getByText('Modifier la tâche')).toBeInTheDocument();
		expect(screen.getByLabelText('Titre')).toHaveValue('Titre');
		expect(screen.getByLabelText('Description')).toHaveValue('Desc');
	});

	it('shows validation error when title is empty', () => {
		const onSubmit = vi.fn();
		render(<TaskForm onSubmit={onSubmit} />);
		fireEvent.submit(screen.getByTestId('task-form'));
		expect(screen.getByText('Le titre est requis')).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('clears validation error while typing', () => {
		render(<TaskForm onSubmit={vi.fn()} />);
		fireEvent.submit(screen.getByTestId('task-form'));
		expect(screen.getByText('Le titre est requis')).toBeInTheDocument();
		fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'A' } });
		expect(screen.queryByText('Le titre est requis')).not.toBeInTheDocument();
	});

	it('submits and resets in create mode', () => {
		const onSubmit = vi.fn();
		render(<TaskForm onSubmit={onSubmit} />);
		fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Nouvelle' } });
		fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'desc' } });
		fireEvent.submit(screen.getByTestId('task-form'));

		expect(onSubmit).toHaveBeenCalledWith({ title: 'Nouvelle', description: 'desc' });
		expect(screen.getByLabelText('Titre')).toHaveValue('');
		expect(screen.getByLabelText('Description')).toHaveValue('');
	});

	it('submits with undefined description when empty', () => {
		const onSubmit = vi.fn();
		render(<TaskForm onSubmit={onSubmit} />);
		fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Titre' } });
		fireEvent.submit(screen.getByTestId('task-form'));
		expect(onSubmit).toHaveBeenCalledWith({ title: 'Titre', description: undefined });
	});

	it('does not reset in edit mode', () => {
		const onSubmit = vi.fn();
		render(
			<TaskForm onSubmit={onSubmit} mode="edit" initialValues={{ title: 'Titre' }} />
		);
		fireEvent.submit(screen.getByTestId('task-form'));
		expect(onSubmit).toHaveBeenCalledWith({ title: 'Titre', description: undefined });
		expect(screen.getByLabelText('Titre')).toHaveValue('Titre');
	});

	it('renders and triggers cancel button', () => {
		const onCancel = vi.fn();
		render(<TaskForm onSubmit={vi.fn()} onCancel={onCancel} />);
		fireEvent.click(screen.getByText('Annuler'));
		expect(onCancel).toHaveBeenCalled();
	});
});
