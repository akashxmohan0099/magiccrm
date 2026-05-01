import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

// Smoke test for the vitest jsdom + RTL harness. If this file passes, the
// component-test environment is wired correctly: jsdom is mounting React,
// @testing-library/react can query the DOM, user-event drives interactions,
// and @testing-library/jest-dom matchers are registered. Real component
// tests live alongside the components they cover.
function Counter() {
  const [n, setN] = useState(0);
  return (
    <div>
      <p data-testid="count">Count: {n}</p>
      <button onClick={() => setN((v) => v + 1)}>increment</button>
    </div>
  );
}

describe("jsdom + RTL harness", () => {
  it("renders a React component to the DOM", () => {
    render(<Counter />);
    expect(screen.getByTestId("count")).toHaveTextContent("Count: 0");
  });

  it("dispatches user-event clicks and re-renders state", async () => {
    const user = userEvent.setup();
    render(<Counter />);
    await user.click(screen.getByRole("button", { name: "increment" }));
    await user.click(screen.getByRole("button", { name: "increment" }));
    expect(screen.getByTestId("count")).toHaveTextContent("Count: 2");
  });
});
