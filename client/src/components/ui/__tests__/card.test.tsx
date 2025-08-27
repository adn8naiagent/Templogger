import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders correctly with default styles', () => {
      render(<Card data-testid="card">Card content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'text-card-foreground', 'shadow-sm');
    });

    it('accepts custom className', () => {
      render(<Card className="custom-card" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-card');
    });

    it('spreads additional props', () => {
      render(<Card id="test-card" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('id', 'test-card');
    });

    it('forwards ref correctly', () => {
      const ref = jest.fn();
      render(<Card ref={ref}>Content</Card>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('CardHeader', () => {
    it('renders with correct default styles', () => {
      render(<CardHeader data-testid="header">Header content</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
    });

    it('accepts custom className', () => {
      render(<CardHeader className="custom-header" data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header');
    });

    it('forwards ref correctly', () => {
      const ref = jest.fn();
      render(<CardHeader ref={ref}>Header</CardHeader>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('CardTitle', () => {
    it('renders with correct default styles', () => {
      render(<CardTitle data-testid="title">Title text</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight');
    });

    it('accepts custom className', () => {
      render(<CardTitle className="custom-title" data-testid="title">Title</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('custom-title');
    });

    it('forwards ref correctly', () => {
      const ref = jest.fn();
      render(<CardTitle ref={ref}>Title</CardTitle>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('CardDescription', () => {
    it('renders with correct default styles', () => {
      render(<CardDescription data-testid="description">Description text</CardDescription>);
      const description = screen.getByTestId('description');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('accepts custom className', () => {
      render(<CardDescription className="custom-desc" data-testid="description">Description</CardDescription>);
      const description = screen.getByTestId('description');
      expect(description).toHaveClass('custom-desc');
    });

    it('forwards ref correctly', () => {
      const ref = jest.fn();
      render(<CardDescription ref={ref}>Description</CardDescription>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('CardContent', () => {
    it('renders with correct default styles', () => {
      render(<CardContent data-testid="content">Content text</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    it('accepts custom className', () => {
      render(<CardContent className="custom-content" data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-content');
    });

    it('forwards ref correctly', () => {
      const ref = jest.fn();
      render(<CardContent ref={ref}>Content</CardContent>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('CardFooter', () => {
    it('renders with correct default styles', () => {
      render(<CardFooter data-testid="footer">Footer content</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });

    it('accepts custom className', () => {
      render(<CardFooter className="custom-footer" data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('custom-footer');
    });

    it('forwards ref correctly', () => {
      const ref = jest.fn();
      render(<CardFooter ref={ref}>Footer</CardFooter>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('Complete Card Structure', () => {
    it('renders a complete card with all components', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>This is a test card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the card content</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      const card = screen.getByTestId('complete-card');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('This is a test card description')).toBeInTheDocument();
      expect(screen.getByText('This is the card content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty content gracefully', () => {
      render(<Card data-testid="empty-card" />);
      const card = screen.getByTestId('empty-card');
      expect(card).toBeInTheDocument();
      expect(card.textContent).toBe('');
    });

    it('handles complex nested content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>
              <span>Complex</span>
              <em>Title</em>
            </CardTitle>
            <CardDescription>
              <div>
                <p>Nested description</p>
                <span>With multiple elements</span>
              </div>
            </CardDescription>
          </CardHeader>
        </Card>
      );

      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Nested description')).toBeInTheDocument();
      expect(screen.getByText('With multiple elements')).toBeInTheDocument();
    });
  });

  describe('Error Scenarios', () => {
    it('handles null className gracefully', () => {
      render(<Card className={undefined} data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
    });

    it('handles undefined children', () => {
      render(<Card data-testid="card">{undefined}</Card>);
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
    });

    it('handles mixed valid and invalid props', () => {
      render(
        <Card 
          className="valid-class" 
          {...({ invalidProp: undefined } as Record<string, unknown>)}
          data-testid="card"
        >
          Content
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('valid-class');
    });
  });

  describe('Accessibility', () => {
    it('maintains semantic HTML structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Accessible Card</CardTitle>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );

      const card = screen.getByText('Accessible Card').closest('div');
      expect(card).toBeInTheDocument();
      
      // Verify the structure maintains div elements
      const titleParent = screen.getByText('Accessible Card').parentElement;
      expect(titleParent?.tagName).toBe('DIV');
    });

    it('supports ARIA attributes', () => {
      render(
        <Card 
          role="article" 
          aria-labelledby="card-title"
          data-testid="accessible-card"
        >
          <CardHeader>
            <CardTitle id="card-title">Accessible Title</CardTitle>
          </CardHeader>
        </Card>
      );

      const card = screen.getByTestId('accessible-card');
      expect(card).toHaveAttribute('role', 'article');
      expect(card).toHaveAttribute('aria-labelledby', 'card-title');
    });
  });
});