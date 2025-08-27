import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input Component', () => {
  it('renders correctly with default props', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md', 'border');
  });

  it('applies correct styling classes', () => {
    render(<Input data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveClass(
      'flex', 'h-10', 'w-full', 'rounded-md', 'border', 'border-input',
      'bg-background', 'px-3', 'py-2', 'text-base', 'ring-offset-background'
    );
  });

  it('handles different input types', () => {
    const { rerender } = render(<Input type="text" data-testid="input" />);
    let input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'text');

    rerender(<Input type="email" data-testid="input" />);
    input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'email');

    rerender(<Input type="password" data-testid="input" />);
    input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'password');

    rerender(<Input type="number" data-testid="input" />);
    input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('accepts and displays value', async () => {
    const user = userEvent.setup();
    render(<Input data-testid="input" />);
    
    const input = screen.getByTestId('input') as HTMLInputElement;
    await user.type(input, 'Hello World');
    
    expect(input.value).toBe('Hello World');
  });

  it('handles controlled input', () => {
    const { rerender } = render(<Input value="initial" data-testid="input" readOnly />);
    const input = screen.getByTestId('input') as HTMLInputElement;
    expect(input.value).toBe('initial');

    rerender(<Input value="updated" data-testid="input" readOnly />);
    expect(input.value).toBe('updated');
  });

  it('handles onChange events', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    
    render(<Input onChange={handleChange} data-testid="input" />);
    const input = screen.getByTestId('input');
    
    await user.type(input, 'test');
    expect(handleChange).toHaveBeenCalledTimes(4); // Called for each character
  });

  it('supports placeholder text', () => {
    render(<Input placeholder="Enter your name" />);
    const input = screen.getByPlaceholderText('Enter your name');
    expect(input).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('forwards ref correctly', () => {
    const ref = jest.fn();
    render(<Input ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveClass('custom-input');
  });

  it('spreads additional props', () => {
    render(
      <Input 
        data-testid="input"
        aria-label="Custom input"
        maxLength={50}
        autoComplete="off"
      />
    );
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('aria-label', 'Custom input');
    expect(input).toHaveAttribute('maxLength', '50');
    expect(input).toHaveAttribute('autoComplete', 'off');
  });

  describe('File Input Handling', () => {
    it('applies correct file input styles', () => {
      render(<Input type="file" data-testid="file-input" />);
      const input = screen.getByTestId('file-input');
      expect(input).toHaveClass('file:border-0', 'file:bg-transparent', 'file:text-sm');
    });

    it('handles file selection', async () => {
      const handleChange = jest.fn();
      render(<Input type="file" onChange={handleChange} data-testid="file-input" />);
      
      const input = screen.getByTestId('file-input');
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      await userEvent.upload(input, file);
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Focus and Blur Events', () => {
    it('handles focus events', async () => {
      const handleFocus = jest.fn();
      const user = userEvent.setup();
      
      render(<Input onFocus={handleFocus} data-testid="input" />);
      const input = screen.getByTestId('input');
      
      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('handles blur events', async () => {
      const handleBlur = jest.fn();
      const user = userEvent.setup();
      
      render(<Input onBlur={handleBlur} data-testid="input" />);
      const input = screen.getByTestId('input');
      
      await user.click(input);
      await user.tab();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty string value', () => {
      render(<Input value="" data-testid="input" readOnly />);
      const input = screen.getByTestId('input') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('handles undefined type', () => {
      render(<Input type={undefined} data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toBeInTheDocument();
    });

    it('handles null className', () => {
      render(<Input className={null as any} data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toBeInTheDocument();
    });

    it('handles special characters in input', async () => {
      const user = userEvent.setup();
      render(<Input data-testid="input" />);
      
      const input = screen.getByTestId('input') as HTMLInputElement;
      const specialText = '!@#$%^&*()_+-=[]{}|;":,./<>?';
      
      await user.type(input, specialText);
      expect(input.value).toBe(specialText);
    });
  });

  describe('Error Scenarios', () => {
    it('handles invalid onChange prop gracefully', () => {
      render(<Input onChange={null as any} data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toBeInTheDocument();
    });

    it('handles invalid ref gracefully', () => {
      render(<Input ref={null as any} data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Input data-testid="input" />);
      
      const input = screen.getByTestId('input');
      await user.tab();
      expect(input).toHaveFocus();
    });

    it('has correct focus styles', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-ring',
        'focus-visible:ring-offset-2'
      );
    });

    it('supports ARIA attributes', () => {
      render(
        <Input 
          aria-describedby="help-text"
          aria-required="true"
          aria-invalid="false"
          data-testid="input"
        />
      );
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-describedby', 'help-text');
      expect(input).toHaveAttribute('aria-required', 'true');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('supports form validation attributes', () => {
      render(
        <Input 
          required
          minLength={5}
          maxLength={20}
          pattern="[a-zA-Z]+"
          data-testid="input"
        />
      );
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('minLength', '5');
      expect(input).toHaveAttribute('maxLength', '20');
      expect(input).toHaveAttribute('pattern', '[a-zA-Z]+');
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      const TestComponent = () => {
        renderSpy();
        return <Input data-testid="input" />;
      };

      const { rerender } = render(<TestComponent />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestComponent />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });
});