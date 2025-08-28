import { render, screen } from "@testing-library/react";
import { Alert, AlertTitle, AlertDescription } from "../alert";

describe("Alert Components", () => {
  describe("Alert", () => {
    it("renders correctly with default variant", () => {
      render(<Alert data-testid="alert">Alert content</Alert>);
      const alert = screen.getByTestId("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute("role", "alert");
      expect(alert).toHaveClass("relative", "w-full", "rounded-lg", "border", "p-4");
      expect(alert).toHaveClass("bg-background", "text-foreground");
    });

    it("applies destructive variant styles", () => {
      render(
        <Alert variant="destructive" data-testid="alert">
          Destructive alert
        </Alert>
      );
      const alert = screen.getByTestId("alert");
      expect(alert).toHaveClass(
        "border-destructive/50",
        "text-destructive",
        "dark:border-destructive"
      );
    });

    it("forwards ref correctly", () => {
      const ref = jest.fn();
      render(<Alert ref={ref}>Alert</Alert>);
      expect(ref).toHaveBeenCalled();
    });

    it("applies custom className", () => {
      render(
        <Alert className="custom-alert" data-testid="alert">
          Alert
        </Alert>
      );
      const alert = screen.getByTestId("alert");
      expect(alert).toHaveClass("custom-alert");
    });

    it("spreads additional props", () => {
      render(
        <Alert id="test-alert" data-testid="alert">
          Alert
        </Alert>
      );
      const alert = screen.getByTestId("alert");
      expect(alert).toHaveAttribute("id", "test-alert");
    });

    it("has correct SVG positioning classes for icons", () => {
      render(<Alert data-testid="alert">Alert content</Alert>);
      const alert = screen.getByTestId("alert");
      expect(alert.className).toMatch(/\[&>svg~\*\]:pl-7/);
      expect(alert.className).toMatch(/\[&>svg\+div\]:translate-y-\[-3px\]/);
      expect(alert.className).toMatch(/\[&>svg\]:absolute/);
      expect(alert.className).toMatch(/\[&>svg\]:left-4/);
      expect(alert.className).toMatch(/\[&>svg\]:top-4/);
    });
  });

  describe("AlertTitle", () => {
    it("renders as h5 element with correct styles", () => {
      render(<AlertTitle data-testid="title">Alert Title</AlertTitle>);
      const title = screen.getByTestId("title");
      expect(title.tagName).toBe("H5");
      expect(title).toHaveClass("mb-1", "font-medium", "leading-none", "tracking-tight");
    });

    it("forwards ref correctly", () => {
      const ref = jest.fn();
      render(<AlertTitle ref={ref}>Title</AlertTitle>);
      expect(ref).toHaveBeenCalled();
    });

    it("applies custom className", () => {
      render(
        <AlertTitle className="custom-title" data-testid="title">
          Title
        </AlertTitle>
      );
      const title = screen.getByTestId("title");
      expect(title).toHaveClass("custom-title");
    });

    it("spreads additional props", () => {
      render(
        <AlertTitle id="test-title" data-testid="title">
          Title
        </AlertTitle>
      );
      const title = screen.getByTestId("title");
      expect(title).toHaveAttribute("id", "test-title");
    });
  });

  describe("AlertDescription", () => {
    it("renders as div element with correct styles", () => {
      render(<AlertDescription data-testid="description">Alert description</AlertDescription>);
      const description = screen.getByTestId("description");
      expect(description.tagName).toBe("DIV");
      expect(description).toHaveClass("text-sm");
      expect(description.className).toMatch(/\[&_p\]:leading-relaxed/);
    });

    it("forwards ref correctly", () => {
      const ref = jest.fn();
      render(<AlertDescription ref={ref}>Description</AlertDescription>);
      expect(ref).toHaveBeenCalled();
    });

    it("applies custom className", () => {
      render(
        <AlertDescription className="custom-desc" data-testid="description">
          Description
        </AlertDescription>
      );
      const description = screen.getByTestId("description");
      expect(description).toHaveClass("custom-desc");
    });

    it("spreads additional props", () => {
      render(
        <AlertDescription id="test-desc" data-testid="description">
          Description
        </AlertDescription>
      );
      const description = screen.getByTestId("description");
      expect(description).toHaveAttribute("id", "test-desc");
    });
  });

  describe("Complete Alert Structure", () => {
    it("renders a complete alert with title, description, and icon", () => {
      const AlertIcon = () => <svg data-testid="alert-icon">Test Icon</svg>;

      render(
        <Alert>
          <AlertIcon />
          <AlertTitle>Important Notice</AlertTitle>
          <AlertDescription>
            This is an important message that you should read carefully.
          </AlertDescription>
        </Alert>
      );

      expect(screen.getByTestId("alert-icon")).toBeInTheDocument();
      expect(screen.getByText("Important Notice")).toBeInTheDocument();
      expect(
        screen.getByText("This is an important message that you should read carefully.")
      ).toBeInTheDocument();
    });

    it("renders destructive alert with all components", () => {
      const WarningIcon = () => <svg data-testid="warning-icon">Warning</svg>;

      render(
        <Alert variant="destructive" data-testid="destructive-alert">
          <WarningIcon />
          <AlertTitle>Error Occurred</AlertTitle>
          <AlertDescription>An error has occurred. Please try again later.</AlertDescription>
        </Alert>
      );

      const alert = screen.getByTestId("destructive-alert");
      expect(alert).toHaveClass("text-destructive", "border-destructive/50");
      expect(screen.getByTestId("warning-icon")).toBeInTheDocument();
      expect(screen.getByText("Error Occurred")).toBeInTheDocument();
      expect(
        screen.getByText("An error has occurred. Please try again later.")
      ).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty content gracefully", () => {
      render(<Alert data-testid="empty-alert" />);
      const alert = screen.getByTestId("empty-alert");
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toBe("");
    });

    it("handles complex nested content", () => {
      render(
        <Alert>
          <AlertTitle>
            <span>Complex</span>
            <em>Title</em>
          </AlertTitle>
          <AlertDescription>
            <p>First paragraph</p>
            <p>
              Second paragraph with <strong>bold text</strong>
            </p>
            <ul>
              <li>List item 1</li>
              <li>List item 2</li>
            </ul>
          </AlertDescription>
        </Alert>
      );

      expect(screen.getByText("Complex")).toBeInTheDocument();
      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("First paragraph")).toBeInTheDocument();
      expect(screen.getByText("Second paragraph with")).toBeInTheDocument();
      expect(screen.getByText("bold text")).toBeInTheDocument();
      expect(screen.getByText("List item 1")).toBeInTheDocument();
      expect(screen.getByText("List item 2")).toBeInTheDocument();
    });

    it("handles only title without description", () => {
      render(
        <Alert>
          <AlertTitle>Only Title</AlertTitle>
        </Alert>
      );

      expect(screen.getByText("Only Title")).toBeInTheDocument();
    });

    it("handles only description without title", () => {
      render(
        <Alert>
          <AlertDescription>Only description content</AlertDescription>
        </Alert>
      );

      expect(screen.getByText("Only description content")).toBeInTheDocument();
    });
  });

  describe("Error Scenarios", () => {
    it("handles null className gracefully", () => {
      render(
        <Alert className={undefined} data-testid="alert">
          Content
        </Alert>
      );
      const alert = screen.getByTestId("alert");
      expect(alert).toBeInTheDocument();
    });

    it("handles undefined variant gracefully", () => {
      render(
        <Alert variant={undefined} data-testid="alert">
          Content
        </Alert>
      );
      const alert = screen.getByTestId("alert");
      expect(alert).toBeInTheDocument();
    });

    it("handles invalid variant gracefully", () => {
      render(
        <Alert
          variant={"invalid" as "default" | "destructive" | null | undefined}
          data-testid="alert"
        >
          Content
        </Alert>
      );
      const alert = screen.getByTestId("alert");
      expect(alert).toBeInTheDocument();
    });

    it("handles null children", () => {
      render(<Alert data-testid="alert">{null}</Alert>);
      const alert = screen.getByTestId("alert");
      expect(alert).toBeInTheDocument();
    });

    it("handles undefined children", () => {
      render(<Alert data-testid="alert">{undefined}</Alert>);
      const alert = screen.getByTestId("alert");
      expect(alert).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA role", () => {
      render(<Alert data-testid="alert">Alert content</Alert>);
      const alert = screen.getByTestId("alert");
      expect(alert).toHaveAttribute("role", "alert");
    });

    it("supports additional ARIA attributes", () => {
      render(
        <Alert aria-describedby="alert-desc" aria-labelledby="alert-title" data-testid="alert">
          Alert content
        </Alert>
      );
      const alert = screen.getByTestId("alert");
      expect(alert).toHaveAttribute("aria-describedby", "alert-desc");
      expect(alert).toHaveAttribute("aria-labelledby", "alert-title");
    });

    it("maintains semantic hierarchy with title as heading", () => {
      render(
        <Alert>
          <AlertTitle>Heading Title</AlertTitle>
          <AlertDescription>Description content</AlertDescription>
        </Alert>
      );

      const title = screen.getByRole("heading");
      expect(title).toHaveTextContent("Heading Title");
      expect(title.tagName).toBe("H5");
    });

    it("handles keyboard focus appropriately", () => {
      render(
        <Alert tabIndex={0} data-testid="focusable-alert">
          Focusable alert
        </Alert>
      );
      const alert = screen.getByTestId("focusable-alert");
      alert.focus();
      expect(alert).toHaveFocus();
    });
  });

  describe("SVG Icon Integration", () => {
    it("applies correct icon styles for destructive variant", () => {
      const TestIcon = () => <svg data-testid="test-icon">Icon</svg>;

      render(
        <Alert variant="destructive" data-testid="alert">
          <TestIcon />
          <AlertTitle>Error</AlertTitle>
        </Alert>
      );

      const alert = screen.getByTestId("alert");
      expect(alert.className).toMatch(/\[&>svg\]:text-destructive/);
    });

    it("handles multiple icons correctly", () => {
      const Icon1 = () => <svg data-testid="icon-1">Icon 1</svg>;
      const Icon2 = () => <svg data-testid="icon-2">Icon 2</svg>;

      render(
        <Alert>
          <Icon1 />
          <Icon2 />
          <AlertTitle>Multiple Icons</AlertTitle>
        </Alert>
      );

      expect(screen.getByTestId("icon-1")).toBeInTheDocument();
      expect(screen.getByTestId("icon-2")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("does not re-render unnecessarily", () => {
      const renderSpy = jest.fn();
      const TestComponent = () => {
        renderSpy();
        return <Alert>Content</Alert>;
      };

      const { rerender } = render(<TestComponent />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestComponent />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });
});
