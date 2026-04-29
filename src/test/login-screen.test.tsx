import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginScreen } from "@features/auth";

const replace = vi.fn();
const refresh = vi.fn();
const login = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
    refresh,
  }),
}));

vi.mock("@features/auth/services/auth-service", () => ({
  login: (...args: unknown[]) => login(...args),
}));

describe("LoginScreen", () => {
  beforeEach(() => {
    replace.mockReset();
    refresh.mockReset();
    login.mockReset();
  });

  it("shows field validation errors before calling the API", async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("redirects into the app after successful login", async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({ user: { id: "user-1" } });

    render(<LoginScreen />);

    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText(/^Password/), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: "john@example.com",
        password: "password123",
        remember: false,
      });
      expect(replace).toHaveBeenCalledWith("/timesheets");
      expect(refresh).toHaveBeenCalled();
    });
  });
});
