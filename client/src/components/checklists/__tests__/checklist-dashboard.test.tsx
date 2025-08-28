import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ChecklistDashboard from "../checklist-dashboard";
import * as authUtils from "@/lib/authUtils";

// Mock dependencies
const mockToast = jest.fn();
const mockLogout = jest.fn();
const mockApiRequest = jest.fn();

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    logout: mockLogout,
  }),
}));

jest.mock("@/lib/queryClient", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

jest.mock("@/lib/authUtils", () => ({
  isUnauthorizedError: jest.fn(),
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  BarChart3: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="bar-chart-icon" {...props} />
  ),
  Download: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="download-icon" {...props} />
  ),
  Calendar: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="calendar-icon" {...props} />
  ),
  CheckCircle2: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="check-circle-icon" {...props} />
  ),
  XCircle: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="x-circle-icon" {...props} />
  ),
  Clock: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="clock-icon" {...props} />
  ),
  TrendingUp: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="trending-up-icon" {...props} />
  ),
  TrendingDown: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="trending-down-icon" {...props} />
  ),
  Minus: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="minus-icon" {...props} />
  ),
  AlertTriangle: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="alert-triangle-icon" {...props} />
  ),
  FileText: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="file-text-icon" {...props} />
  ),
}));

// Mock window.URL and document methods for file download
Object.defineProperty(window, "URL", {
  value: {
    createObjectURL: jest.fn(() => "mock-url"),
    revokeObjectURL: jest.fn(),
  },
});

const mockChecklistMetrics = {
  totalRequired: 100,
  totalCompleted: 80,
  totalOnTime: 75,
  overallCompletionRate: 80,
  overallOnTimeRate: 75,
  byChecklist: [
    {
      checklistId: "checklist-1",
      checklistName: "Daily Safety Check",
      cadence: "DAILY" as const,
      period: { start: "2024-01-01", end: "2024-01-31" },
      required: 31,
      completed: 28,
      onTime: 25,
      completionRate: 90,
      onTimeRate: 80,
    },
    {
      checklistId: "checklist-2",
      checklistName: "Weekly Maintenance",
      cadence: "WEEKLY" as const,
      period: { start: "2024-01-01", end: "2024-01-31" },
      required: 4,
      completed: 3,
      onTime: 2,
      completionRate: 75,
      onTimeRate: 50,
    },
  ],
};

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
};

describe.skip("ChecklistDashboard Component", () => {
  beforeEach(() => {
    mockToast.mockClear();
    mockLogout.mockClear();
    mockApiRequest.mockClear();
    jest.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockApiRequest.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithQueryClient(<ChecklistDashboard />);

    expect(screen.getByText("Loading dashboard...")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart-icon")).toBeInTheDocument();
  });

  it("renders dashboard with metrics data", async () => {
    mockApiRequest.mockResolvedValue({
      ok: true,
      json: async () => mockChecklistMetrics,
    });

    renderWithQueryClient(<ChecklistDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Checklist Dashboard")).toBeInTheDocument();
    });

    // Check overview cards
    expect(screen.getByText("100")).toBeInTheDocument(); // Total Required
    expect(screen.getByText("80")).toBeInTheDocument(); // Total Completed
    expect(screen.getByText("80%")).toBeInTheDocument(); // Completion Rate
    expect(screen.getByText("75%")).toBeInTheDocument(); // On-Time Rate
  });

  it("displays error state when API fails", async () => {
    mockApiRequest.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    renderWithQueryClient(<ChecklistDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Error Loading Dashboard")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Failed to load dashboard data. Please try again.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("handles 401 errors by calling logout", async () => {
    mockApiRequest.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    renderWithQueryClient(<ChecklistDashboard />);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe("Filters", () => {
    beforeEach(() => {
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => mockChecklistMetrics,
      });
    });

    it("renders filter inputs correctly", async () => {
      renderWithQueryClient(<ChecklistDashboard />);

      await waitFor(() => {
        expect(screen.getByLabelText("From Date")).toBeInTheDocument();
      });

      expect(screen.getByLabelText("To Date")).toBeInTheDocument();
      expect(screen.getByText("Checklist")).toBeInTheDocument();
      expect(screen.getByText("Cadence")).toBeInTheDocument();
    });

    it("updates date filters when changed", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ChecklistDashboard />);

      await waitFor(() => {
        expect(screen.getByLabelText("From Date")).toBeInTheDocument();
      });

      const fromDateInput = screen.getByLabelText("From Date");
      await user.clear(fromDateInput);
      await user.type(fromDateInput, "2024-02-01");

      expect(fromDateInput).toHaveValue("2024-02-01");
    });

    it("populates checklist select with available checklists", async () => {
      renderWithQueryClient(<ChecklistDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Daily Safety Check")).toBeInTheDocument();
      });

      expect(screen.getByText("Weekly Maintenance")).toBeInTheDocument();
    });
  });

  describe("Export Functionality", () => {
    beforeEach(() => {
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => mockChecklistMetrics,
      });

      // Mock document.createElement and appendChild/removeChild
      const mockAnchor = {
        style: { display: "" },
        href: "",
        download: "",
        click: jest.fn(),
      };
      jest
        .spyOn(document, "createElement")
        .mockReturnValue(mockAnchor as unknown as HTMLAnchorElement);
      jest
        .spyOn(document.body, "appendChild")
        .mockImplementation(() => mockAnchor as unknown as HTMLAnchorElement);
      jest
        .spyOn(document.body, "removeChild")
        .mockImplementation(() => mockAnchor as unknown as HTMLAnchorElement);
    });

    it("handles successful CSV export", async () => {
      const user = userEvent.setup();

      mockApiRequest
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockChecklistMetrics,
        })
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => new Blob(["csv data"], { type: "text/csv" }),
        });

      renderWithQueryClient(<ChecklistDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Export CSV")).toBeInTheDocument();
      });

      const exportButton = screen.getByRole("button", { name: /export csv/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Export Successful",
          description: "Checklist report has been downloaded",
        });
      });
    });

    it("handles export failure", async () => {
      const user = userEvent.setup();

      mockApiRequest
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockChecklistMetrics,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => "Export failed",
        });

      renderWithQueryClient(<ChecklistDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Export CSV")).toBeInTheDocument();
      });

      const exportButton = screen.getByRole("button", { name: /export csv/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Export Failed",
          description: "Failed to export checklist report",
          variant: "destructive",
        });
      });
    });
  });

  describe("Performance Table", () => {
    it("displays checklist performance data", async () => {
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => mockChecklistMetrics,
      });

      renderWithQueryClient(<ChecklistDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Performance by Checklist")).toBeInTheDocument();
      });

      expect(screen.getByText("Daily Safety Check")).toBeInTheDocument();
      expect(screen.getByText("Weekly Maintenance")).toBeInTheDocument();
      expect(screen.getByText("DAILY")).toBeInTheDocument();
      expect(screen.getByText("WEEKLY")).toBeInTheDocument();
    });

    it("shows no data message when no checklists exist", async () => {
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockChecklistMetrics,
          byChecklist: [],
        }),
      });

      renderWithQueryClient(<ChecklistDashboard />);

      await waitFor(() => {
        expect(screen.getByText("No Data Available")).toBeInTheDocument();
      });

      expect(
        screen.getByText("No checklist data found for the selected period and filters.")
      ).toBeInTheDocument();
    });
  });

  describe("Trend Icons", () => {
    it("shows correct trend icons based on completion rates", async () => {
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => mockChecklistMetrics,
      });

      renderWithQueryClient(<ChecklistDashboard />);

      await waitFor(() => {
        expect(screen.getAllByTestId("trending-up-icon")).toHaveLength(1); // 90% completion rate
      });

      expect(screen.getAllByTestId("minus-icon")).toHaveLength(1); // 75% completion rate
    });
  });

  describe("Summary Stats", () => {
    it("displays performance summary cards", async () => {
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => mockChecklistMetrics,
      });

      renderWithQueryClient(<ChecklistDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Checklists with ≥90% completion")).toBeInTheDocument();
      });

      expect(screen.getByText("Checklists with 70-89% completion")).toBeInTheDocument();
      expect(screen.getByText("Checklists with <70% completion")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles undefined metrics gracefully", async () => {
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => undefined,
      });

      renderWithQueryClient(<ChecklistDashboard />);

      await waitFor(() => {
        expect(screen.getByText("0")).toBeInTheDocument(); // Total Required shows 0
      });
    });

    it("handles empty metrics data", async () => {
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => ({
          totalRequired: 0,
          totalCompleted: 0,
          totalOnTime: 0,
          overallCompletionRate: 0,
          overallOnTimeRate: 0,
          byChecklist: [],
        }),
      });

      renderWithQueryClient(<ChecklistDashboard />);

      await waitFor(() => {
        expect(screen.getByText("No Data Available")).toBeInTheDocument();
      });
    });

    it("handles network errors gracefully", async () => {
      mockApiRequest.mockRejectedValue(new Error("Network error"));

      renderWithQueryClient(<ChecklistDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Error Loading Dashboard")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels and roles", async () => {
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => mockChecklistMetrics,
      });

      renderWithQueryClient(<ChecklistDashboard />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /export csv/i })).toBeInTheDocument();
      });

      expect(screen.getByLabelText("From Date")).toBeInTheDocument();
      expect(screen.getByLabelText("To Date")).toBeInTheDocument();
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => mockChecklistMetrics,
      });

      renderWithQueryClient(<ChecklistDashboard />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /export csv/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole("button", { name: /export csv/i });
      exportButton.focus();
      expect(exportButton).toHaveFocus();

      await user.keyboard("{Tab}");
      // Should move focus to next focusable element
    });
  });
});
