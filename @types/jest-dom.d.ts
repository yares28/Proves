import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(...classNames: string[]): R;
      toHaveAttribute(attr: string, value?: string | RegExp): R;
      toBeDisabled(): R;
      toHaveFocus(): R;
      toBeVisible(): R;
      toBeChecked(): R;
      toHaveValue(value: string | number | string[]): R;
      toHaveDisplayValue(value: string | string[]): R;
      toBeRequired(): R;
      toBeValid(): R;
      toBeInvalid(): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeEmptyDOMElement(): R;
      toContainElement(element: HTMLElement | null): R;
      toContainHTML(htmlText: string): R;
      toHaveAccessibleDescription(text?: string | RegExp): R;
      toHaveAccessibleName(text?: string | RegExp): R;
      toHaveDescription(text?: string | RegExp): R;
      toHaveName(text?: string | RegExp): R;
      toHaveErrorMessage(text?: string | RegExp): R;
      toHaveRole(role: string): R;
      toHaveStyle(css: string | Record<string, any>): R;
      toBePartiallyChecked(): R;
    }
  }
} 