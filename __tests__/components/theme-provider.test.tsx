import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme-provider';

// Captures the props next-themes' provider receives so we can assert that our
// wrapper passes them straight through. The variable is `mock`-prefixed so jest's
// hoisting allows the factory to reference it, and it's only read at render time
// (not module init), so there's no temporal-dead-zone issue.
let mockReceivedProps: Record<string, any> = {};

jest.mock('next-themes', () => ({
  ThemeProvider: ({ children, ...props }: any) => {
    mockReceivedProps = props;
    return <div data-testid="next-themes">{children}</div>;
  },
}));

describe('ThemeProvider', () => {
  beforeEach(() => {
    mockReceivedProps = {};
  });

  it('renders its children', () => {
    render(
      <ThemeProvider>
        <span data-testid="child">Child Content</span>
      </ThemeProvider>
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Child Content');
  });

  it('renders multiple children', () => {
    render(
      <ThemeProvider>
        <div data-testid="child-1">One</div>
        <div data-testid="child-2">Two</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('passes configuration props through to next-themes', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <span>content</span>
      </ThemeProvider>
    );

    expect(mockReceivedProps).toMatchObject({
      attribute: 'class',
      defaultTheme: 'system',
      enableSystem: true,
      disableTransitionOnChange: true,
    });
  });

  it('does not inject props it was not given (pure pass-through)', () => {
    render(
      <ThemeProvider>
        <span>content</span>
      </ThemeProvider>
    );

    expect(mockReceivedProps).toEqual({});
  });
});
