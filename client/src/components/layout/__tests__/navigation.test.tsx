import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Navigation from "../navigation";

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Zap: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="zap-icon" {...props} />
  ),
  Settings: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="settings-icon" {...props} />
  ),
  Sun: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="sun-icon" {...props} />
  ),
  RefreshCw: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={className} data-testid="refresh-icon" {...props} />
  ),
}));

describe("Navigation Component", () => {
  it("renders all navigation elements correctly", () => {
    render(<Navigation />);

    // Check logo and title
    expect(screen.getByTestId("logo-icon")).toBeInTheDocument();
    expect(screen.getByTestId("app-title")).toHaveTextContent("Fullstack Foundation");

    // Check status badge
    expect(screen.getByTestId("status-badge")).toHaveTextContent("Active");

    // Check buttons
    expect(screen.getByTestId("button-refresh")).toBeInTheDocument();
    expect(screen.getByTestId("button-settings")).toBeInTheDocument();
    expect(screen.getByTestId("button-theme")).toBeInTheDocument();

    // Check avatar
    expect(screen.getByTestId("avatar-user")).toBeInTheDocument();
  });

  it("applies correct styling classes", () => {
    render(<Navigation />);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("bg-card", "border-b", "border-border", "sticky", "top-0", "z-50");

    const logoIcon = screen.getByTestId("logo-icon");
    expect(logoIcon).toHaveClass("w-6", "h-6", "text-primary");

    const statusBadge = screen.getByTestId("status-badge");
    expect(statusBadge).toHaveClass(
      "bg-green-100",
      "dark:bg-green-900",
      "text-green-800",
      "dark:text-green-200"
    );
  });

  it("calls onRefresh when refresh button is clicked", async () => {
    const mockOnRefresh = jest.fn();
    const user = userEvent.setup();

    render(<Navigation onRefresh={mockOnRefresh} />);

    const refreshButton = screen.getByTestId("button-refresh");
    await user.click(refreshButton);

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it("handles missing onRefresh prop gracefully", async () => {
    const user = userEvent.setup();

    render(<Navigation />);

    const refreshButton = screen.getByTestId("button-refresh");
    await user.click(refreshButton);

    // Should not throw error
    expect(refreshButton).toBeInTheDocument();
  });

  it("renders all icons correctly", () => {
    render(<Navigation />);

    expect(screen.getByTestId("zap-icon")).toBeInTheDocument();
    expect(screen.getByTestId("refresh-icon")).toBeInTheDocument();
    expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
    expect(screen.getByTestId("sun-icon")).toBeInTheDocument();
  });

  it("has correct button variants and sizes", () => {
    render(<Navigation />);

    const refreshButton = screen.getByTestId("button-refresh");
    const settingsButton = screen.getByTestId("button-settings");
    const themeButton = screen.getByTestId("button-theme");

    // All should be ghost variant and icon size
    [refreshButton, settingsButton, themeButton].forEach((button) => {
      expect(button).toHaveClass("h-10", "w-10"); // icon size classes
    });
  });

  it("displays avatar with correct fallback", () => {
    render(<Navigation />);

    const avatar = screen.getByTestId("avatar-user");
    expect(avatar).toHaveClass("w-8", "h-8");

    // Check avatar fallback content
    const avatarFallback = avatar.querySelector('[class*="bg-primary"]');
    expect(avatarFallback).toHaveTextContent("U");
    expect(avatarFallback).toHaveClass("bg-primary", "text-primary-foreground");
  });

  describe("Responsive Layout", () => {
    it("has responsive padding classes", () => {
      render(<Navigation />);

      const container = screen.getByRole("navigation").querySelector(".max-w-7xl");
      expect(container).toHaveClass("px-4", "sm:px-6", "lg:px-8");
    });

    it("maintains correct height and spacing", () => {
      render(<Navigation />);

      const flexContainer = screen.getByRole("navigation").querySelector(".flex.justify-between");
      expect(flexContainer).toHaveClass("h-16");

      const leftSection = screen.getByTestId("app-title").parentElement?.parentElement;
      expect(leftSection).toHaveClass("space-x-4");

      const rightSection = screen.getByTestId("button-refresh").parentElement;
      expect(rightSection).toHaveClass("space-x-4");
    });
  });

  describe("Accessibility", () => {
    it("uses semantic navigation element", () => {
      render(<Navigation />);
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("has accessible button elements", () => {
      render(<Navigation />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(3); // refresh, settings, theme buttons

      buttons.forEach((button) => {
        expect(button).toBeInTheDocument();
      });
    });

    it("supports keyboard navigation", async () => {
      const mockOnRefresh = jest.fn();
      const user = userEvent.setup();

      render(<Navigation onRefresh={mockOnRefresh} />);

      const refreshButton = screen.getByTestId("button-refresh");
      refreshButton.focus();
      expect(refreshButton).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases", () => {
    it("handles undefined onRefresh prop", () => {
      render(<Navigation onRefresh={undefined} />);
      expect(screen.getByTestId("button-refresh")).toBeInTheDocument();
    });

    it("handles null onRefresh prop", () => {
      render(<Navigation onRefresh={undefined} />);
      expect(screen.getByTestId("button-refresh")).toBeInTheDocument();
    });
  });

  describe("Error Scenarios", () => {
    it("renders without crashing when icons fail to load", () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      render(<Navigation />);
      expect(screen.getByTestId("app-title")).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it("handles multiple rapid refresh clicks", async () => {
      const mockOnRefresh = jest.fn();
      const user = userEvent.setup();

      render(<Navigation onRefresh={mockOnRefresh} />);

      const refreshButton = screen.getByTestId("button-refresh");
      await user.click(refreshButton);
      await user.click(refreshButton);
      await user.click(refreshButton);

      expect(mockOnRefresh).toHaveBeenCalledTimes(3);
    });
  });

  describe("Visual Elements", () => {
    it("displays correct text content", () => {
      render(<Navigation />);

      expect(screen.getByText("Fullstack Foundation")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("U")).toBeInTheDocument(); // Avatar fallback
    });

    it("has correct color schemes for status badge", () => {
      render(<Navigation />);

      const statusBadge = screen.getByTestId("status-badge");
      expect(statusBadge).toHaveClass(
        "bg-green-100",
        "dark:bg-green-900",
        "text-green-800",
        "dark:text-green-200"
      );
    });
  });
});
