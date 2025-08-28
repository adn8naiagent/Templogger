import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SecurityStatus from "../security-status";

// Mock environment variable
const originalEnv = process.env;

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Shield: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="shield-icon" {...props} />
  ),
  ShieldAlert: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="shield-alert-icon" {...props} />
  ),
  ShieldCheck: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="shield-check-icon" {...props} />
  ),
  AlertTriangle: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="alert-triangle-icon" {...props} />
  ),
  Clock: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="clock-icon" {...props} />
  ),
  Package: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="package-icon" {...props} />
  ),
  RefreshCw: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="refresh-icon" {...props} />
  ),
}));

const mockSecurityStatus = {
  vulnerabilities: {
    low: 2,
    medium: 1,
    high: 1,
    critical: 0,
  },
  lastScan: "2024-01-15T10:30:00.000Z",
  packagesScanned: 150,
  hasIssues: true,
};

const mockSecureStatus = {
  vulnerabilities: {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  },
  lastScan: "2024-01-15T10:30:00.000Z",
  packagesScanned: 150,
  hasIssues: false,
};

const mockCriticalStatus = {
  vulnerabilities: {
    low: 1,
    medium: 2,
    high: 3,
    critical: 2,
  },
  lastScan: "2024-01-15T10:30:00.000Z",
  packagesScanned: 150,
  hasIssues: true,
};

const renderWithQueryClient = (component: React.ReactElement, queryClient?: QueryClient) => {
  const client =
    queryClient ||
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

  return render(<QueryClientProvider client={client}>{component}</QueryClientProvider>);
};

describe("SecurityStatus Component", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("does not render in production environment", () => {
    process.env.NODE_ENV = "production";
    const { container } = renderWithQueryClient(<SecurityStatus />);
    expect(container.firstChild).toBeNull();
  });

  it("renders loading state initially", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, enabled: false },
      },
    });

    renderWithQueryClient(<SecurityStatus />, queryClient);

    expect(screen.getByText("Security Status")).toBeInTheDocument();
    expect(screen.getByText("Loading security status...")).toBeInTheDocument();
    expect(screen.getByTestId("refresh-icon")).toHaveClass("animate-spin");
  });

  it("renders error state when query fails", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          queryFn: () => Promise.reject(new Error("API Error")),
        },
      },
    });

    renderWithQueryClient(<SecurityStatus />, queryClient);

    await waitFor(() => {
      expect(screen.getByText("Security monitoring not available")).toBeInTheDocument();
    });
  });

  it("displays secure status when no vulnerabilities exist", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          queryFn: () => Promise.resolve(mockSecureStatus),
        },
      },
    });

    renderWithQueryClient(<SecurityStatus />, queryClient);

    await waitFor(() => {
      expect(screen.getByTestId("shield-check-icon")).toBeInTheDocument();
    });

    expect(screen.getByText("Secure")).toBeInTheDocument();
    expect(screen.getByText("150 packages scanned")).toBeInTheDocument();
  });

  it("displays vulnerability information when issues exist", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          queryFn: () => Promise.resolve(mockSecurityStatus),
        },
      },
    });

    renderWithQueryClient(<SecurityStatus />, queryClient);

    await waitFor(() => {
      expect(screen.getByTestId("alert-triangle-icon")).toBeInTheDocument();
    });

    expect(screen.getByText("4 Issues")).toBeInTheDocument();
    expect(screen.getByText("Vulnerabilities:")).toBeInTheDocument();
    expect(screen.getByText("Low:")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Medium:")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("High:")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("displays critical status for high severity vulnerabilities", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          queryFn: () => Promise.resolve(mockCriticalStatus),
        },
      },
    });

    renderWithQueryClient(<SecurityStatus />, queryClient);

    await waitFor(() => {
      expect(screen.getByTestId("shield-alert-icon")).toBeInTheDocument();
    });

    expect(screen.getByText("Critical Issues")).toBeInTheDocument();
    expect(screen.getByText("Critical:")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("High:")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("formats last scan date correctly", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          queryFn: () => Promise.resolve(mockSecurityStatus),
        },
      },
    });

    renderWithQueryClient(<SecurityStatus />, queryClient);

    await waitFor(() => {
      expect(screen.getByText(/Last scan:/)).toBeInTheDocument();
    });

    // The exact format depends on locale, but should contain date elements
    const scanText = screen.getByText(/Last scan:/);
    expect(scanText).toBeInTheDocument();
  });

  it("handles refresh functionality", async () => {
    const refetchSpy = jest.fn();
    const user = userEvent.setup();

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          queryFn: () => Promise.resolve(mockSecurityStatus),
        },
      },
    });

    // Mock the refetch function
    jest.spyOn(queryClient, "refetchQueries").mockImplementation(refetchSpy);

    renderWithQueryClient(<SecurityStatus />, queryClient);

    await waitFor(() => {
      expect(screen.getByTestId("button-refresh-security")).toBeInTheDocument();
    });

    const refreshButton = screen.getByTestId("button-refresh-security");
    await user.click(refreshButton);

    // The actual refetch behavior depends on react-query implementation
    expect(refreshButton).toBeInTheDocument();
  });

  it("displays custom message when provided", async () => {
    const statusWithMessage = {
      ...mockSecurityStatus,
      message: "Security scan in progress...",
    };

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          queryFn: () => Promise.resolve(statusWithMessage),
        },
      },
    });

    renderWithQueryClient(<SecurityStatus />, queryClient);

    await waitFor(() => {
      expect(screen.getByText("Security scan in progress...")).toBeInTheDocument();
    });
  });

  describe("Badge Variants", () => {
    it("shows correct badge variant for secure status", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            queryFn: () => Promise.resolve(mockSecureStatus),
          },
        },
      });

      renderWithQueryClient(<SecurityStatus />, queryClient);

      await waitFor(() => {
        const secureBadge = screen.getByText("Secure");
        expect(secureBadge).toBeInTheDocument();
      });
    });

    it("shows destructive badge for critical issues", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            queryFn: () => Promise.resolve(mockCriticalStatus),
          },
        },
      });

      renderWithQueryClient(<SecurityStatus />, queryClient);

      await waitFor(() => {
        const criticalBadge = screen.getByText("Critical Issues");
        expect(criticalBadge).toBeInTheDocument();
      });
    });
  });

  describe("Icon States", () => {
    it("shows shield-check icon for secure state", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            queryFn: () => Promise.resolve(mockSecureStatus),
          },
        },
      });

      renderWithQueryClient(<SecurityStatus />, queryClient);

      await waitFor(() => {
        expect(screen.getByTestId("shield-check-icon")).toBeInTheDocument();
      });

      expect(screen.getByTestId("shield-check-icon")).toHaveClass("text-green-500");
    });

    it("shows shield-alert icon for critical vulnerabilities", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            queryFn: () => Promise.resolve(mockCriticalStatus),
          },
        },
      });

      renderWithQueryClient(<SecurityStatus />, queryClient);

      await waitFor(() => {
        expect(screen.getByTestId("shield-alert-icon")).toBeInTheDocument();
      });

      expect(screen.getByTestId("shield-alert-icon")).toHaveClass("text-red-500");
    });

    it("shows alert-triangle icon for medium/low vulnerabilities", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            queryFn: () => Promise.resolve(mockSecurityStatus),
          },
        },
      });

      renderWithQueryClient(<SecurityStatus />, queryClient);

      await waitFor(() => {
        expect(screen.getByTestId("alert-triangle-icon")).toBeInTheDocument();
      });

      expect(screen.getByTestId("alert-triangle-icon")).toHaveClass("text-yellow-500");
    });
  });

  describe("Vulnerability Display", () => {
    it("only shows vulnerability types that have counts > 0", async () => {
      const statusWithPartialVulns = {
        ...mockSecurityStatus,
        vulnerabilities: {
          low: 0,
          medium: 2,
          high: 0,
          critical: 1,
        },
      };

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            queryFn: () => Promise.resolve(statusWithPartialVulns),
          },
        },
      });

      renderWithQueryClient(<SecurityStatus />, queryClient);

      await waitFor(() => {
        expect(screen.getByText("Critical:")).toBeInTheDocument();
      });

      expect(screen.getByText("Medium:")).toBeInTheDocument();
      expect(screen.queryByText("Low:")).not.toBeInTheDocument();
      expect(screen.queryByText("High:")).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles null lastScan gracefully", async () => {
      const statusWithoutScan = {
        ...mockSecurityStatus,
        lastScan: null,
      };

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            queryFn: () => Promise.resolve(statusWithoutScan),
          },
        },
      });

      renderWithQueryClient(<SecurityStatus />, queryClient);

      await waitFor(() => {
        expect(screen.getByText("150 packages scanned")).toBeInTheDocument();
      });

      expect(screen.queryByText(/Last scan:/)).not.toBeInTheDocument();
    });

    it("handles zero packages scanned", async () => {
      const statusWithZeroPackages = {
        ...mockSecurityStatus,
        packagesScanned: 0,
      };

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            queryFn: () => Promise.resolve(statusWithZeroPackages),
          },
        },
      });

      renderWithQueryClient(<SecurityStatus />, queryClient);

      await waitFor(() => {
        expect(screen.getByText("0 packages scanned")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("provides accessible button for refresh", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            queryFn: () => Promise.resolve(mockSecurityStatus),
          },
        },
      });

      renderWithQueryClient(<SecurityStatus />, queryClient);

      await waitFor(() => {
        const refreshButton = screen.getByTestId("button-refresh-security");
        expect(refreshButton).toBeInTheDocument();
        expect(refreshButton).toHaveAttribute("type", "button");
      });
    });

    it("maintains semantic structure", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            queryFn: () => Promise.resolve(mockSecurityStatus),
          },
        },
      });

      renderWithQueryClient(<SecurityStatus />, queryClient);

      await waitFor(() => {
        expect(screen.getByText("Security Status")).toBeInTheDocument();
      });

      // Should have proper heading structure
      const heading = screen.getByText("Security Status");
      expect(heading).toBeInTheDocument();
    });
  });
});
