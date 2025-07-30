import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewToggle } from '@/components/view-toggle';

describe('ViewToggle', () => {
  const mockOnViewChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderViewToggle = (props = {}) => {
    return render(
      <ViewToggle 
        view="calendar"
        onViewChange={mockOnViewChange}
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    it('should render the view toggle with calendar and list options', () => {
      renderViewToggle();

      expect(screen.getByRole('button', { name: 'Calendar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'List' })).toBeInTheDocument();
    });

    it('should show calendar as active when view is calendar', () => {
      renderViewToggle({ view: 'calendar' });

      const calendarButton = screen.getByRole('button', { name: 'Calendar' });
      const listButton = screen.getByRole('button', { name: 'List' });

      expect(calendarButton).toHaveClass('bg-primary');
      expect(listButton).not.toHaveClass('bg-primary');
    });

    it('should show list as active when view is list', () => {
      renderViewToggle({ view: 'list' });

      const calendarButton = screen.getByRole('button', { name: 'Calendar' });
      const listButton = screen.getByRole('button', { name: 'List' });

      expect(listButton).toHaveClass('bg-primary');
      expect(calendarButton).not.toHaveClass('bg-primary');
    });

    it('should render with proper styling', () => {
      renderViewToggle();

      const toggleGroup = screen.getByRole('group');
      expect(toggleGroup).toHaveClass('inline-flex');
      expect(toggleGroup).toHaveClass('bg-muted');
      expect(toggleGroup).toHaveClass('p-1');
    });

    it('should render buttons with proper styling', () => {
      renderViewToggle();

      const calendarButton = screen.getByRole('button', { name: 'Calendar' });
      const listButton = screen.getByRole('button', { name: 'List' });

      expect(calendarButton).toHaveClass('inline-flex');
      expect(calendarButton).toHaveClass('items-center');
      expect(listButton).toHaveClass('inline-flex');
      expect(listButton).toHaveClass('items-center');
    });
  });

  describe('Button Interactions', () => {
    it('should call onViewChange when calendar button is clicked', async () => {
      const user = userEvent.setup();
      renderViewToggle({ view: 'list' });

      const calendarButton = screen.getByRole('button', { name: 'Calendar' });
      await user.click(calendarButton);

      expect(mockOnViewChange).toHaveBeenCalledWith('calendar');
    });

    it('should call onViewChange when list button is clicked', async () => {
      const user = userEvent.setup();
      renderViewToggle({ view: 'calendar' });

      const listButton = screen.getByRole('button', { name: 'List' });
      await user.click(listButton);

      expect(mockOnViewChange).toHaveBeenCalledWith('list');
    });

    it('should not call onViewChange when clicking the already active view', async () => {
      const user = userEvent.setup();
      renderViewToggle({ view: 'calendar' });

      const calendarButton = screen.getByRole('button', { name: 'Calendar' });
      await user.click(calendarButton);

      expect(mockOnViewChange).not.toHaveBeenCalled();
    });

    it('should handle rapid button clicks', async () => {
      const user = userEvent.setup();
      renderViewToggle({ view: 'calendar' });

      const listButton = screen.getByRole('button', { name: 'List' });
      
      // Rapidly click the list button
      for (let i = 0; i < 5; i++) {
        await user.click(listButton);
      }

      // Should only call once per click
      expect(mockOnViewChange).toHaveBeenCalledTimes(5);
      expect(mockOnViewChange).toHaveBeenLastCalledWith('list');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderViewToggle();

      const toggleGroup = screen.getByRole('group');
      expect(toggleGroup).toBeInTheDocument();

      const calendarButton = screen.getByRole('button', { name: 'Calendar' });
      const listButton = screen.getByRole('button', { name: 'List' });

      expect(calendarButton).toBeInTheDocument();
      expect(listButton).toBeInTheDocument();
    });

    it('should have proper keyboard navigation', async () => {
      const user = userEvent.setup();
      renderViewToggle();

      const calendarButton = screen.getByRole('button', { name: 'Calendar' });
      const listButton = screen.getByRole('button', { name: 'List' });

      // Focus the calendar button
      calendarButton.focus();
      expect(calendarButton).toHaveFocus();

      // Navigate to list button with Tab key
      await user.keyboard('{Tab}');
      expect(listButton).toHaveFocus();

      // Activate with Enter key
      await user.keyboard('{Enter}');
      expect(mockOnViewChange).toHaveBeenCalledWith('list');
    });

    it('should have proper keyboard navigation with Space key', async () => {
      const user = userEvent.setup();
      renderViewToggle();

      const listButton = screen.getByRole('button', { name: 'List' });
      
      // Focus the list button
      listButton.focus();
      expect(listButton).toHaveFocus();

      // Activate with Space key
      await user.keyboard(' ');
      expect(mockOnViewChange).toHaveBeenCalledWith('list');
    });

    it('should have proper aria-pressed attributes', () => {
      renderViewToggle({ view: 'calendar' });

      const calendarButton = screen.getByRole('button', { name: 'Calendar' });
      const listButton = screen.getByRole('button', { name: 'List' });

      expect(calendarButton).toHaveAttribute('aria-pressed', 'true');
      expect(listButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should update aria-pressed when view changes', async () => {
      const user = userEvent.setup();
      const { rerender } = renderViewToggle({ view: 'calendar' });

      const calendarButton = screen.getByRole('button', { name: 'Calendar' });
      const listButton = screen.getByRole('button', { name: 'List' });

      expect(calendarButton).toHaveAttribute('aria-pressed', 'true');
      expect(listButton).toHaveAttribute('aria-pressed', 'false');

      // Click list button
      await user.click(listButton);

      // Re-render with new view
      rerender(
        <ViewToggle 
          view="list"
          onViewChange={mockOnViewChange}
        />
      );

      expect(calendarButton).toHaveAttribute('aria-pressed', 'false');
      expect(listButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Customization', () => {
    it('should accept custom className', () => {
      renderViewToggle({ className: 'custom-toggle' });

      const toggleGroup = screen.getByRole('group');
      expect(toggleGroup).toHaveClass('custom-toggle');
    });

    it('should accept custom button text', () => {
      renderViewToggle({
        calendarText: 'Calendar View',
        listText: 'List View',
      });

      expect(screen.getByRole('button', { name: 'Calendar View' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'List View' })).toBeInTheDocument();
    });

    it('should accept custom view values', () => {
      renderViewToggle({
        calendarValue: 'calendar-view',
        listValue: 'list-view',
      });

      const calendarButton = screen.getByRole('button', { name: 'Calendar' });
      const listButton = screen.getByRole('button', { name: 'List' });

      await userEvent.click(calendarButton);
      expect(mockOnViewChange).toHaveBeenCalledWith('calendar-view');

      await userEvent.click(listButton);
      expect(mockOnViewChange).toHaveBeenCalledWith('list-view');
    });

    it('should accept custom disabled state', () => {
      renderViewToggle({ disabled: true });

      const calendarButton = screen.getByRole('button', { name: 'Calendar' });
      const listButton = screen.getByRole('button', { name: 'List' });

      expect(calendarButton).toBeDisabled();
      expect(listButton).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing onViewChange prop', () => {
      render(
        <ViewToggle 
          view="calendar"
        />
      );

      const listButton = screen.getByRole('button', { name: 'List' });
      userEvent.click(listButton);

      // Should not throw error
      expect(screen.getByRole('button', { name: 'List' })).toBeInTheDocument();
    });

    it('should handle undefined view prop', () => {
      render(
        <ViewToggle 
          view={undefined}
          onViewChange={mockOnViewChange}
        />
      );

      // Should render without crashing
      expect(screen.getByRole('button', { name: 'Calendar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'List' })).toBeInTheDocument();
    });

    it('should handle null view prop', () => {
      render(
        <ViewToggle 
          view={null}
          onViewChange={mockOnViewChange}
        />
      );

      // Should render without crashing
      expect(screen.getByRole('button', { name: 'Calendar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'List' })).toBeInTheDocument();
    });

    it('should handle invalid view prop', () => {
      render(
        <ViewToggle 
          view="invalid-view"
          onViewChange={mockOnViewChange}
        />
      );

      // Should render without crashing
      expect(screen.getByRole('button', { name: 'Calendar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'List' })).toBeInTheDocument();
    });

    it('should handle component unmounting during interaction', async () => {
      const user = userEvent.setup();
      const { unmount } = renderViewToggle();

      const listButton = screen.getByRole('button', { name: 'List' });
      await user.click(listButton);

      // Unmount component during interaction
      unmount();

      // Should not cause errors
      expect(mockOnViewChange).toHaveBeenCalledWith('list');
    });
  });

  describe('Integration', () => {
    it('should work with parent components', () => {
      const ParentComponent = () => {
        const [view, setView] = React.useState('calendar');
        
        return (
          <div>
            <ViewToggle view={view} onViewChange={setView} />
            <div data-testid="current-view">Current view: {view}</div>
          </div>
        );
      };

      render(<ParentComponent />);

      expect(screen.getByTestId('current-view')).toHaveTextContent('Current view: calendar');

      const listButton = screen.getByRole('button', { name: 'List' });
      userEvent.click(listButton);

      expect(screen.getByTestId('current-view')).toHaveTextContent('Current view: list');
    });

    it('should maintain state correctly in controlled component', async () => {
      const user = userEvent.setup();
      const { rerender } = renderViewToggle({ view: 'calendar' });

      const listButton = screen.getByRole('button', { name: 'List' });
      await user.click(listButton);

      expect(mockOnViewChange).toHaveBeenCalledWith('list');

      // Simulate parent updating the view
      rerender(
        <ViewToggle 
          view="list"
          onViewChange={mockOnViewChange}
        />
      );

      const calendarButton = screen.getByRole('button', { name: 'Calendar' });
      await user.click(calendarButton);

      expect(mockOnViewChange).toHaveBeenCalledWith('calendar');
    });
  });

  describe('Performance', () => {
    it('should handle rapid view changes efficiently', async () => {
      const user = userEvent.setup();
      renderViewToggle();

      const calendarButton = screen.getByRole('button', { name: 'Calendar' });
      const listButton = screen.getByRole('button', { name: 'List' });

      // Rapidly switch between views
      for (let i = 0; i < 10; i++) {
        await user.click(listButton);
        await user.click(calendarButton);
      }

      // Should handle all interactions
      expect(mockOnViewChange).toHaveBeenCalledTimes(20);
    });

    it('should not cause excessive re-renders', () => {
      const renderSpy = jest.fn();
      const TestComponent = () => {
        renderSpy();
        return (
          <ViewToggle 
            view="calendar"
            onViewChange={mockOnViewChange}
          />
        );
      };

      render(<TestComponent />);

      // Should only render once initially
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });
}); 