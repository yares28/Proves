import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme-provider';

// Mock next-themes
const mockThemeProvider = {
  ThemeProvider: ({ children, ...props }: any) => (
    <div data-testid="theme-provider" {...props}>
      {children}
    </div>
  ),
};

jest.mock('next-themes', () => mockThemeProvider);

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderThemeProvider = (props = {}) => {
    return render(
      <ThemeProvider {...props}>
        <div data-testid="child-content">Child Content</div>
      </ThemeProvider>
    );
  };

  describe('Rendering', () => {
    it('should render the theme provider with children', () => {
      renderThemeProvider();

      expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should pass default props to next-themes ThemeProvider', () => {
      renderThemeProvider();

      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toHaveAttribute('attribute', 'class');
      expect(themeProvider).toHaveAttribute('defaultTheme', 'system');
      expect(themeProvider).toHaveAttribute('enableSystem');
      expect(themeProvider).toHaveAttribute('disableTransitionOnChange');
    });

    it('should allow custom props to be passed through', () => {
      renderThemeProvider({
        attribute: 'data-theme',
        defaultTheme: 'dark',
        enableSystem: false,
        disableTransitionOnChange: false,
      });

      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toHaveAttribute('attribute', 'data-theme');
      expect(themeProvider).toHaveAttribute('defaultTheme', 'dark');
      expect(themeProvider).not.toHaveAttribute('enableSystem');
      expect(themeProvider).not.toHaveAttribute('disableTransitionOnChange');
    });
  });

  describe('Default Configuration', () => {
    it('should use class as default attribute', () => {
      renderThemeProvider();

      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toHaveAttribute('attribute', 'class');
    });

    it('should use system as default theme', () => {
      renderThemeProvider();

      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toHaveAttribute('defaultTheme', 'system');
    });

    it('should enable system theme by default', () => {
      renderThemeProvider();

      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toHaveAttribute('enableSystem');
    });

    it('should disable transition on change by default', () => {
      renderThemeProvider();

      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toHaveAttribute('disableTransitionOnChange');
    });
  });

  describe('Custom Configuration', () => {
    it('should accept custom attribute', () => {
      renderThemeProvider({ attribute: 'data-theme' });

      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toHaveAttribute('attribute', 'data-theme');
    });

    it('should accept custom default theme', () => {
      renderThemeProvider({ defaultTheme: 'light' });

      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toHaveAttribute('defaultTheme', 'light');
    });

    it('should accept custom enableSystem value', () => {
      renderThemeProvider({ enableSystem: false });

      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).not.toHaveAttribute('enableSystem');
    });

    it('should accept custom disableTransitionOnChange value', () => {
      renderThemeProvider({ disableTransitionOnChange: false });

      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).not.toHaveAttribute('disableTransitionOnChange');
    });

    it('should accept multiple custom props', () => {
      renderThemeProvider({
        attribute: 'data-theme',
        defaultTheme: 'dark',
        enableSystem: false,
        disableTransitionOnChange: false,
      });

      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toHaveAttribute('attribute', 'data-theme');
      expect(themeProvider).toHaveAttribute('defaultTheme', 'dark');
      expect(themeProvider).not.toHaveAttribute('enableSystem');
      expect(themeProvider).not.toHaveAttribute('disableTransitionOnChange');
    });
  });

  describe('Children Rendering', () => {
    it('should render single child', () => {
      renderThemeProvider();

      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <ThemeProvider>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </ThemeProvider>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });

    it('should render complex nested children', () => {
      render(
        <ThemeProvider>
          <div data-testid="parent">
            <h1>Title</h1>
            <div data-testid="nested">
              <p>Paragraph</p>
              <button>Button</button>
            </div>
          </div>
        </ThemeProvider>
      );

      expect(screen.getByTestId('parent')).toBeInTheDocument();
      expect(screen.getByTestId('nested')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByText('Button')).toBeInTheDocument();
    });

    it('should render functional children', () => {
      const ChildComponent = () => <div data-testid="functional-child">Functional Child</div>;

      render(
        <ThemeProvider>
          <ChildComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('functional-child')).toBeInTheDocument();
      expect(screen.getByText('Functional Child')).toBeInTheDocument();
    });
  });

  describe('Props Spreading', () => {
    it('should spread additional props to next-themes ThemeProvider', () => {
      renderThemeProvider({
        customProp: 'custom-value',
        'data-testid': 'custom-theme-provider',
      });

      const themeProvider = screen.getByTestId('custom-theme-provider');
      expect(themeProvider).toHaveAttribute('customProp', 'custom-value');
    });

    it('should handle boolean props correctly', () => {
      renderThemeProvider({
        enableSystem: false,
        disableTransitionOnChange: false,
        customBoolean: true,
      });

      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).not.toHaveAttribute('enableSystem');
      expect(themeProvider).not.toHaveAttribute('disableTransitionOnChange');
      expect(themeProvider).toHaveAttribute('customBoolean');
    });

    it('should handle undefined props gracefully', () => {
      renderThemeProvider({
        undefinedProp: undefined,
        nullProp: null,
      });

      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).not.toHaveAttribute('undefinedProp');
      expect(themeProvider).not.toHaveAttribute('nullProp');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<ThemeProvider />);

      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toBeInTheDocument();
      expect(themeProvider.children).toHaveLength(0);
    });

    it('should handle null children', () => {
      render(<ThemeProvider>{null}</ThemeProvider>);

      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      render(<ThemeProvider>{undefined}</ThemeProvider>);

      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toBeInTheDocument();
    });

    it('should handle false children', () => {
      render(<ThemeProvider>{false}</ThemeProvider>);

      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toBeInTheDocument();
    });

    it('should handle zero children', () => {
      render(<ThemeProvider>{0}</ThemeProvider>);

      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle empty string children', () => {
      render(<ThemeProvider>{''}</ThemeProvider>);

      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should work with other components', () => {
      const TestComponent = () => (
        <div data-testid="test-component">
          <h1>Test Component</h1>
          <p>This is a test component</p>
        </div>
      );

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByText('Test Component')).toBeInTheDocument();
      expect(screen.getByText('This is a test component')).toBeInTheDocument();
    });

    it('should maintain component hierarchy', () => {
      render(
        <ThemeProvider>
          <div data-testid="outer">
            <div data-testid="inner">
              <span>Content</span>
            </div>
          </div>
        </ThemeProvider>
      );

      const outer = screen.getByTestId('outer');
      const inner = screen.getByTestId('inner');
      const content = screen.getByText('Content');

      expect(outer).toContainElement(inner);
      expect(inner).toContainElement(content);
    });
  });
}); 