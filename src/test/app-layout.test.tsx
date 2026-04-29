import { describe, expect, it, vi } from "vitest";

import AppLayout from "@app/(app)/layout";

const { requirePageSession } = vi.hoisted(() => ({
  requirePageSession: vi.fn(),
}));

vi.mock("@lib/auth/guards", () => ({
  requirePageSession: () => requirePageSession(),
}));

vi.mock("next/navigation", () => ({
  redirect: (destination: string) => {
    throw new Error(`redirect:${destination}`);
  },
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("AppLayout protection", () => {
  it("renders protected content for authenticated users", async () => {
    requirePageSession.mockResolvedValueOnce({
      id: "user-1",
      name: "John Doe",
      email: "john@example.com",
    });

    const result = await AppLayout({ children: <div>Protected</div> });

    expect(result).toBeTruthy();
  });

  it("redirects unauthenticated users to /login", async () => {
    requirePageSession.mockImplementationOnce(() => {
      throw new Error("redirect:/login");
    });

    await expect(AppLayout({ children: <div>Protected</div> })).rejects.toThrow("redirect:/login");
  });
});
