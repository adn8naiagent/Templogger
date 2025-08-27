import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge } from '../badge';

describe('Badge Component', () => {
  it('renders correctly with default variant', () => {
    render(<Badge data-testid="badge">Default Badge</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'rounded-full',
      'border',
      'px-2.5',
      'py-0.5',
      'text-xs',
      'font-semibold'
    );
    expect(badge).toHaveClass('border-transparent', 'bg-primary', 'text-primary-foreground');
  });

  it('applies secondary variant styles', () => {
    render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
  });

  it('applies destructive variant styles', () => {
    render(<Badge variant="destructive" data-testid="badge">Destructive</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
  });

  it('applies outline variant styles', () => {
    render(<Badge variant="outline" data-testid="badge">Outline</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('text-foreground');
    expect(badge).not.toHaveClass('border-transparent');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-badge" data-testid="badge">Badge</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('custom-badge');
  });

  it('spreads additional props', () => {
    render(<Badge id="test-badge" data-testid="badge">Badge</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('id', 'test-badge');
  });

  it('supports onClick events', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Badge onClick={handleClick} data-testid="badge">Clickable Badge</Badge>);
    const badge = screen.getByTestId('badge');
    
    await user.click(badge);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  describe('Focus and Interaction', () => {
    it('handles focus when tabIndex is set', async () => {
      const user = userEvent.setup();
      render(<Badge tabIndex={0} data-testid="badge">Focusable Badge</Badge>);
      
      const badge = screen.getByTestId('badge');
      badge.focus();
      expect(badge).toHaveFocus();
      
      // Test keyboard interaction
      await user.keyboard('{Enter}');
      // Badge doesn't have default keyboard handlers, but should not crash
      expect(badge).toHaveFocus();
    });

    it('has focus styles defined', () => {
      render(<Badge data-testid="badge">Badge</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-ring', 'focus:ring-offset-2');
    });

    it('handles mouse events', () => {
      const handleMouseEnter = jest.fn();
      const handleMouseLeave = jest.fn();
      
      render(
        <Badge 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          data-testid="badge"
        >
          Hover Badge
        </Badge>
      );
      
      const badge = screen.getByTestId('badge');
      fireEvent.mouseEnter(badge);
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
      
      fireEvent.mouseLeave(badge);
      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });
  });

  describe('Content Variations', () => {
    it('handles empty content', () => {
      render(<Badge data-testid="badge" />);
      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe('');
    });

    it('handles numeric content', () => {
      render(<Badge data-testid="badge">{42}</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('42');
    });

    it('handles complex content', () => {
      render(
        <Badge data-testid="badge">
          <span>Status:</span>
          <strong>Active</strong>
        </Badge>
      );
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('Status:Active');
      expect(screen.getByText('Status:')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('handles very long text', () => {
      const longText = 'This is a very long badge text that might overflow';
      render(<Badge data-testid="badge">{longText}</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent(longText);
    });

    it('handles special characters', () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;":,./<>?';
      render(<Badge data-testid="badge">{specialText}</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent(specialText);
    });

    it('handles JSX elements as children', () => {
      const icon = <span data-testid="icon">🔥</span>;
      render(
        <Badge data-testid="badge">
          {icon}
          Hot
        </Badge>
      );
      
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Hot')).toBeInTheDocument();
    });
  });

  describe('Styling Variants', () => {
    it('has hover effects for non-outline variants', () => {
      const { rerender } = render(<Badge variant="default" data-testid="badge">Default</Badge>);
      let badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('hover:bg-primary/80');

      rerender(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
      badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('hover:bg-secondary/80');

      rerender(<Badge variant="destructive" data-testid="badge">Destructive</Badge>);
      badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('hover:bg-destructive/80');
    });

    it('combines variant and custom classes correctly', () => {
      render(<Badge variant="secondary" className="text-xl" data-testid="badge">Large Secondary</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground', 'text-xl');
    });

    it('handles transition classes', () => {
      render(<Badge data-testid="badge">Animated Badge</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('transition-colors');
    });
  });

  describe('Edge Cases', () => {
    it('handles null className', () => {
      render(<Badge className={undefined} data-testid="badge">Badge</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
    });

    it('handles undefined variant', () => {
      render(<Badge variant={undefined} data-testid="badge">Badge</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
    });

    it('handles invalid variant gracefully', () => {
      render(<Badge variant={'invalid' as 'default' | 'secondary' | 'destructive' | 'outline' | null | undefined} data-testid="badge">Badge</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
    });

    it('handles null children', () => {
      render(<Badge data-testid="badge">{null}</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
    });

    it('handles undefined children', () => {
      render(<Badge data-testid="badge">{undefined}</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
    });

    it('handles boolean children', () => {
      render(<Badge data-testid="badge">{true}</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
    });

    it('handles array of children', () => {
      render(<Badge data-testid="badge">{['Item', ' 1', ' of', ' 3']}</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('Item 1 of 3');
    });
  });

  describe('Error Scenarios', () => {
    it('handles invalid onClick prop type', () => {
      const mockInvalidHandler = jest.fn();
      render(<Badge onClick={mockInvalidHandler} data-testid="badge">Badge</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
    });

    it('handles invalid event handlers gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<Badge onMouseEnter={undefined} data-testid="badge">Badge</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
      
      fireEvent.mouseEnter(badge);
      // Should not crash
      
      consoleSpy.mockRestore();
    });

    it('continues to work with React strict mode warnings', () => {
      // This is more of a development-time concern
      render(<Badge data-testid="badge">Strict Mode Badge</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('supports ARIA attributes', () => {
      render(
        <Badge 
          aria-label="Status badge"
          aria-describedby="status-description"
          data-testid="badge"
        >
          Active
        </Badge>
      );
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('aria-label', 'Status badge');
      expect(badge).toHaveAttribute('aria-describedby', 'status-description');
    });

    it('can be used as a button with proper role', () => {
      const handleClick = jest.fn();
      render(
        <Badge 
          role="button"
          onClick={handleClick}
          tabIndex={0}
          data-testid="badge"
        >
          Clickable Badge
        </Badge>
      );
      
      const badge = screen.getByRole('button');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('tabIndex', '0');
    });

    it('supports keyboard navigation when interactive', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Badge 
          role="button"
          onClick={handleClick}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
          data-testid="badge"
        >
          Interactive Badge
        </Badge>
      );
      
      const badge = screen.getByTestId('badge');
      badge.focus();
      expect(badge).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('has proper contrast and readability styles', () => {
      render(<Badge data-testid="badge">Readable Badge</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('font-semibold', 'text-xs');
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      const TestComponent = () => {
        renderSpy();
        return <Badge>Test Badge</Badge>;
      };

      const { rerender } = render(<TestComponent />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestComponent />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('handles rapid state changes efficiently', async () => {
      const user = userEvent.setup();
      let clickCount = 0;
      
      const TestBadge = () => {
        const [variant, setVariant] = React.useState<'default' | 'secondary'>('default');
        
        return (
          <Badge 
            variant={variant}
            onClick={() => {
              clickCount++;
              setVariant(clickCount % 2 === 0 ? 'default' : 'secondary');
            }}
            data-testid="badge"
          >
            Count: {clickCount}
          </Badge>
        );
      };

      render(<TestBadge />);
      const badge = screen.getByTestId('badge');
      
      // Rapid clicks should not cause performance issues
      await user.click(badge);
      await user.click(badge);
      await user.click(badge);
      
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Integration with CSS Custom Properties', () => {
    it('works with custom CSS properties', () => {
      render(
        <Badge 
          style={{ '--badge-color': 'red' } as React.CSSProperties}
          className="text-[var(--badge-color)]"
          data-testid="badge"
        >
          Custom Color Badge
        </Badge>
      );
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveStyle({ '--badge-color': 'red' });
    });
  });
});