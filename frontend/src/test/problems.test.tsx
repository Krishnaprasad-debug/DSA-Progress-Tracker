import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ProblemList } from '../components/problems/ProblemList';
import { ProblemModal } from '../components/problems/ProblemModal';
import problemService from '../services/problemService';
import { Problem } from '../types/problem';

vi.mock('../services/problemService', () => ({
  default: {
    getProblems: vi.fn(),
    createProblem: vi.fn(),
    updateProblem: vi.fn(),
    deleteProblem: vi.fn(),
  },
}));

const mockProblems: Problem[] = [
  {
    _id: 'prob-1',
    user: 'user-1',
    title: 'Two Sum',
    description: 'Find target indices',
    topic: 'Arrays',
    difficulty: 'Easy',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/two-sum/',
    status: 'Solved',
    notes: 'Used Map',
    tags: ['Hash Table'],
    estimatedTimeMinutes: 20,
    lastPracticedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'prob-2',
    user: 'user-1',
    title: 'Course Schedule',
    description: 'Topological sort check',
    topic: 'Graphs',
    difficulty: 'Medium',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/course-schedule/',
    status: 'Attempted',
    notes: 'Cycle detection using Kahn algorithm',
    tags: ['BFS', 'DFS'],
    estimatedTimeMinutes: 45,
    lastPracticedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('Problem Management Component Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(problemService.getProblems).mockResolvedValue({
      count: mockProblems.length,
      problems: mockProblems,
    });
  });

  it('renders problem list header, counter, and problem items', async () => {
    await act(async () => {
      render(<ProblemList />);
    });

    await waitFor(() => {
      expect(screen.getByText(/DSA Problem Library/i)).toBeInTheDocument();
      expect(screen.getByText('Two Sum')).toBeInTheDocument();
      expect(screen.getByText('Course Schedule')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Easy').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Medium').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Arrays').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Graphs').length).toBeGreaterThanOrEqual(1);
  });

  it('allows updating search input and topic filter', async () => {
    await act(async () => {
      render(<ProblemList />);
    });

    const searchInput = screen.getByPlaceholderText(/Search problems, notes, tags.../i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Course' } });
    });
    expect(searchInput).toHaveValue('Course');

    const topicSelect = screen.getByRole('combobox', { name: /Filter by Topic/i });
    await act(async () => {
      fireEvent.change(topicSelect, { target: { value: 'Graphs' } });
    });
    expect(topicSelect).toHaveValue('Graphs');
  });

  it('opens ProblemModal when clicking Add Problem button', async () => {
    await act(async () => {
      render(<ProblemList />);
    });

    const addBtn = screen.getByRole('button', { name: /Add Problem/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Add New Problem' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Problem Title \*/i)).toBeInTheDocument();
  });

  it('validates short title in ProblemModal', async () => {
    const handleSubmit = vi.fn();
    const handleClose = vi.fn();

    render(
      <ProblemModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        initialData={null}
      />
    );

    const titleInput = screen.getByLabelText(/Problem Title \*/i);
    const form = screen.getByRole('dialog').querySelector('form')!;

    fireEvent.change(titleInput, { target: { value: 'A' } });
    fireEvent.submit(form);

    expect(screen.getByText(/Title must be at least 2 characters long/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with valid form data in ProblemModal', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <ProblemModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        initialData={null}
      />
    );

    const titleInput = screen.getByLabelText(/Problem Title \*/i);
    const topicSelect = screen.getByLabelText(/Topic Category \*/i);
    const diffSelect = screen.getByLabelText(/Difficulty Level \*/i);
    const form = screen.getByRole('dialog').querySelector('form')!;

    fireEvent.change(titleInput, { target: { value: 'Valid Problem Title' } });
    fireEvent.change(topicSelect, { target: { value: 'Trees' } });
    fireEvent.change(diffSelect, { target: { value: 'Hard' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Valid Problem Title',
          topic: 'Trees',
          difficulty: 'Hard',
        })
      );
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
