import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../button";

describe("Button Component", () => {
  it("renders correctly with default props", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("inline-flex", "items-center", "justify-center");
  });

  it("applies correct variant classes", () => {
    const { rerender } = render(<Button variant="default">Default</Button>);
    let button = screen.getByRole("button");
    expect(button).toHaveClass("bg-primary", "text-primary-foreground");

    rerender(<Button variant="destructive">Destructive</Button>);
    button = screen.getByRole("button");
    expect(button).toHaveClass("bg-destructive", "text-destructive-foreground");

    rerender(<Button variant="outline">Outline</Button>);
    button = screen.getByRole("button");
    expect(button).toHaveClass("border", "border-input", "bg-background");

    rerender(<Button variant="secondary">Secondary</Button>);
    button = screen.getByRole("button");
    expect(button).toHaveClass("bg-secondary", "text-secondary-foreground");

    rerender(<Button variant="ghost">Ghost</Button>);
    button = screen.getByRole("button");
    expect(button).toHaveClass("hover:bg-accent", "hover:text-accent-foreground");

    rerender(<Button variant="link">Link</Button>);
    button = screen.getByRole("button");
    expect(button).toHaveClass("text-primary", "underline-offset-4");
  });

  it("applies correct size classes", () => {
    const { rerender } = render(<Button size="default">Default</Button>);
    let button = screen.getByRole("button");
    expect(button).toHaveClass("h-10", "px-4", "py-2");

    rerender(<Button size="sm">Small</Button>);
    button = screen.getByRole("button");
    expect(button).toHaveClass("h-9", "px-3");

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole("button");
    expect(button).toHaveClass("h-11", "px-8");

    rerender(<Button size="icon">Icon</Button>);
    button = screen.getByRole("button");
    expect(button).toHaveClass("h-10", "w-10");
  });

  it("handles click events", async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole("button");

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    const handleClick = jest.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:pointer-events-none", "disabled:opacity-50");

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("forwards ref correctly", () => {
    const ref = jest.fn();
    render(<Button ref={ref}>Button</Button>);
    expect(ref).toHaveBeenCalled();
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Button</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  it("spreads additional props", () => {
    render(
      <Button data-testid="custom-button" aria-label="Custom label">
        Button
      </Button>
    );
    const button = screen.getByTestId("custom-button");
    expect(button).toHaveAttribute("aria-label", "Custom label");
  });

  it("renders as child component when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );

    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
    expect(link).toHaveClass("inline-flex", "items-center", "justify-center");
  });

  describe("Edge Cases", () => {
    it("handles empty children", () => {
      render(<Button />);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBe("");
    });

    it("handles multiple children", () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("IconText");
    });

    it("handles complex nested content", () => {
      render(
        <Button>
          <div>
            <span>Nested</span>
            <em>Content</em>
          </div>
        </Button>
      );
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("NestedContent");
    });
  });

  describe("Error Scenarios", () => {
    it("handles invalid variant gracefully", () => {
      render(<Button variant={undefined as never}>Invalid</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("handles invalid size gracefully", () => {
      render(<Button size={undefined as never}>Invalid</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("handles null className", () => {
      render(<Button className={null as never}>Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("supports keyboard navigation", async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Accessible</Button>);
      const button = screen.getByRole("button");

      button.focus();
      expect(button).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(handleClick).toHaveBeenCalledTimes(1);

      await user.keyboard(" ");
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it("has correct focus styles", () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("focus-visible:outline-none", "focus-visible:ring-2");
    });

    it("supports aria attributes", () => {
      render(
        <Button aria-describedby="help-text" aria-pressed="false">
          Toggle
        </Button>
      );
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-describedby", "help-text");
      expect(button).toHaveAttribute("aria-pressed", "false");
    });
  });
});
