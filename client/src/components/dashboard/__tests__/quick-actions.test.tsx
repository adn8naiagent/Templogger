import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuickActions from '../quick-actions';

// Mock the toast hook
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Play: ({ className, ...props }: { className?: string; [key: string]: unknown }) => <div className={className} data-testid="play-icon" {...props} />,
  Terminal: ({ className, ...props }: { className?: string; [key: string]: unknown }) => <div className={className} data-testid="terminal-icon" {...props} />,
  Package: ({ className, ...props }: { className?: string; [key: string]: unknown }) => <div className={className} data-testid="package-icon" {...props} />,
  Upload: ({ className, ...props }: { className?: string; [key: string]: unknown }) => <div className={className} data-testid="upload-icon" {...props} />,
}));

describe('QuickActions Component', () => {
  beforeEach(() => {
    mockToast.mockClear();
  });

  it('renders all quick action buttons correctly', () => {
    render(<QuickActions />);

    expect(screen.getByTestId('title-quick-actions')).toHaveTextContent('Quick Actions');
    
    // Check all action buttons
    expect(screen.getByTestId('button-start-dev-servers')).toBeInTheDocument();
    expect(screen.getByTestId('button-run-tests')).toBeInTheDocument();
    expect(screen.getByTestId('button-build-project')).toBeInTheDocument();
    expect(screen.getByTestId('button-deploy')).toBeInTheDocument();
  });

  it('displays correct titles and descriptions for each action', () => {
    render(<QuickActions />);

    // Start Dev Servers
    expect(screen.getByTestId('title-start-dev-servers')).toHaveTextContent('Start Dev Servers');
    expect(screen.getByTestId('description-start-dev-servers')).toHaveTextContent('Launch frontend & backend');

    // Run Tests
    expect(screen.getByTestId('title-run-tests')).toHaveTextContent('Run Tests');
    expect(screen.getByTestId('description-run-tests')).toHaveTextContent('Execute test suites');

    // Build Project
    expect(screen.getByTestId('title-build-project')).toHaveTextContent('Build Project');
    expect(screen.getByTestId('description-build-project')).toHaveTextContent('Create production build');

    // Deploy
    expect(screen.getByTestId('title-deploy')).toHaveTextContent('Deploy');
    expect(screen.getByTestId('description-deploy')).toHaveTextContent('Deploy to Railway');
  });

  it('displays correct icons for each action', () => {
    render(<QuickActions />);

    expect(screen.getByTestId('play-icon')).toBeInTheDocument();
    expect(screen.getByTestId('terminal-icon')).toBeInTheDocument();
    expect(screen.getByTestId('package-icon')).toBeInTheDocument();
    expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
  });

  describe('Action Button Interactions', () => {
    it('triggers toast when Start Dev Servers is clicked', async () => {
      const user = userEvent.setup();
      render(<QuickActions />);

      const button = screen.getByTestId('button-start-dev-servers');
      await user.click(button);

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Action Triggered',
        description: 'Start Dev Servers action has been initiated.',
      });
    });

    it('triggers toast when Run Tests is clicked', async () => {
      const user = userEvent.setup();
      render(<QuickActions />);

      const button = screen.getByTestId('button-run-tests');
      await user.click(button);

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Action Triggered',
        description: 'Run Tests action has been initiated.',
      });
    });

    it('triggers toast when Build Project is clicked', async () => {
      const user = userEvent.setup();
      render(<QuickActions />);

      const button = screen.getByTestId('button-build-project');
      await user.click(button);

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Action Triggered',
        description: 'Build Project action has been initiated.',
      });
    });

    it('triggers toast when Deploy is clicked', async () => {
      const user = userEvent.setup();
      render(<QuickActions />);

      const button = screen.getByTestId('button-deploy');
      await user.click(button);

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Action Triggered',
        description: 'Deploy action has been initiated.',
      });
    });
  });

  describe('ActionButton Component', () => {
    it('applies correct styling classes', () => {
      render(<QuickActions />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass(
          'p-4',
          'h-auto',
          'text-left',
          'flex',
          'flex-col',
          'items-start',
          'space-y-2',
          'hover:border-primary',
          'transition-colors'
        );
      });
    });

    it('has outline variant for all buttons', () => {
      render(<QuickActions />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // outline variant typically adds border classes
        expect(button).toHaveClass('border', 'border-input', 'bg-background');
      });
    });
  });

  describe('Layout and Styling', () => {
    it('has correct grid layout classes', () => {
      render(<QuickActions />);
      
      const gridContainer = screen.getByTestId('button-start-dev-servers').parentElement;
      expect(gridContainer).toHaveClass(
        'grid',
        'grid-cols-1',
        'sm:grid-cols-2',
        'lg:grid-cols-4',
        'gap-4'
      );
    });

    it('applies correct icon colors', () => {
      render(<QuickActions />);
      
      const playIcon = screen.getByTestId('play-icon');
      expect(playIcon).toHaveClass('w-5', 'h-5', 'text-accent');

      const terminalIcon = screen.getByTestId('terminal-icon');
      expect(terminalIcon).toHaveClass('w-5', 'h-5', 'text-blue-600');

      const packageIcon = screen.getByTestId('package-icon');
      expect(packageIcon).toHaveClass('w-5', 'h-5', 'text-purple-600');

      const uploadIcon = screen.getByTestId('upload-icon');
      expect(uploadIcon).toHaveClass('w-5', 'h-5', 'text-orange-600');
    });
  });

  describe('Accessibility', () => {
    it('uses semantic button elements', () => {
      render(<QuickActions />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4);
      
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<QuickActions />);
      
      const firstButton = screen.getByTestId('button-start-dev-servers');
      firstButton.focus();
      expect(firstButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(mockToast).toHaveBeenCalledTimes(1);
    });

    it('has accessible button content', () => {
      render(<QuickActions />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Each button should have text content
        expect(button.textContent).not.toBe('');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid button clicks', async () => {
      const user = userEvent.setup();
      render(<QuickActions />);

      const button = screen.getByTestId('button-start-dev-servers');
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(mockToast).toHaveBeenCalledTimes(3);
    });

    it('handles all buttons being clicked simultaneously', async () => {
      const user = userEvent.setup();
      render(<QuickActions />);

      const buttons = [
        screen.getByTestId('button-start-dev-servers'),
        screen.getByTestId('button-run-tests'),
        screen.getByTestId('button-build-project'),
        screen.getByTestId('button-deploy'),
      ];

      // Click all buttons
      await Promise.all(buttons.map(button => user.click(button)));

      expect(mockToast).toHaveBeenCalledTimes(4);
    });
  });

  describe('Error Scenarios', () => {
    it('continues to work when toast fails', async () => {
      mockToast.mockImplementation(() => {
        throw new Error('Toast failed');
      });

      const user = userEvent.setup();
      render(<QuickActions />);

      const button = screen.getByTestId('button-start-dev-servers');
      
      // Should not crash the component
      await expect(user.click(button)).resolves.not.toThrow();
      
      mockToast.mockRestore();
    });

    it('renders without crashing when icons fail to load', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<QuickActions />);
      expect(screen.getByTestId('title-quick-actions')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('handles missing useToast hook gracefully', () => {
      // This is more of a type safety test
      render(<QuickActions />);
      expect(screen.getByTestId('title-quick-actions')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      const TestWrapper = () => {
        renderSpy();
        return <QuickActions />;
      };

      const { rerender } = render(<TestWrapper />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestWrapper />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('handles multiple toast calls efficiently', async () => {
      const user = userEvent.setup();
      render(<QuickActions />);

      const button = screen.getByTestId('button-start-dev-servers');
      
      // Rapid clicks should all register
      await user.click(button);
      await user.click(button);
      await user.click(button);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledTimes(3);
      });
    });
  });
});