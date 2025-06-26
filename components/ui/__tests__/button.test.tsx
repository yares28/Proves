import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with default variant and size', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground', 'h-10');
    });

    it('renders with custom text', () => {
      render(<Button>Custom Text</Button>);
      expect(screen.getByText('Custom Text')).toBeInTheDocument();
    });

    it('renders as disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });
  });

  describe('Variants', () => {
    it('renders destructive variant correctly', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });

    it('renders outline variant correctly', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('border', 'border-input', 'bg-background');
    });

    it('renders secondary variant correctly', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('renders ghost variant correctly', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
    });

    it('renders link variant correctly', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('text-primary', 'underline-offset-4', 'hover:underline');
    });
  });

  describe('Sizes', () => {
    it('renders small size correctly', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('h-9', 'px-3');
    });

    it('renders large size correctly', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('h-11', 'px-8');
    });

    it('renders icon size correctly', () => {
      render(<Button size="icon">🔥</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('h-10', 'w-10');
    });
  });

  describe('Interactions', () => {
    it('handles click events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not trigger click when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles keyboard navigation (Enter)', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Press Enter</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard navigation (Space)', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Press Space</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      await user.keyboard(' ');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Props', () => {
    it('accepts custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('custom-class');
    });

    it('accepts custom attributes', () => {
      render(<Button data-testid="custom-button" aria-label="Custom label">Test</Button>);
      const button = screen.getByTestId('custom-button');
      
      expect(button).toHaveAttribute('aria-label', 'Custom label');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Button ref={ref}>Ref Test</Button>);
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('AsChild Prop', () => {
    it('renders as child component when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
      expect(link).toHaveClass('bg-primary'); // Should still have button styles
    });
  });

  describe('Accessibility', () => {
    it('has proper focus styles', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    });

    it('is focusable by default', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveFocus();
    });

    it('is not focusable when disabled', () => {
      render(<Button disabled>Not Focusable</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).not.toHaveFocus();
    });
  });
}); 