import { beforeEach, describe, expect, it, vi } from "vitest";

import { sessionCookieName } from "@lib/auth/session";
import { resetMockStore } from "@lib/mock-store";
import { POST as loginPost } from "@app/api/auth/login/route";
import { GET as getTimesheetDetail } from "@app/api/timesheets/[id]/route";
import { DELETE as deleteEntry } from "@app/api/timesheets/[id]/entries/[entryId]/route";
import { PATCH as updateEntry } from "@app/api/timesheets/[id]/entries/[entryId]/route";
import { POST as createEntry } from "@app/api/timesheets/[id]/entries/route";
import { GET as getTimesheets } from "@app/api/timesheets/route";

const { requireApiSession, cookieStore } = vi.hoisted(() => ({
  requireApiSession: vi.fn(),
  cookieStore: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
}));

vi.mock("@lib/auth/guards", async () => {
  const actual = await vi.importActual("@lib/auth/guards");
  return {
    ...actual,
    requireApiSession: () => requireApiSession(),
  };
});

describe("API routes", () => {
  beforeEach(() => {
    requireApiSession.mockReset();
    cookieStore.get.mockReset();
    cookieStore.set.mockReset();
    cookieStore.delete.mockReset();
    requireApiSession.mockResolvedValue({
      user: { id: "user-1", name: "John Doe", email: "john@example.com" },
    });
    resetMockStore();
  });

  it("logs in with valid demo credentials and sets the session cookie", async () => {
    const response = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "john@example.com", password: "password123", remember: true }),
      }),
    );

    expect(response.status).toBe(200);
    expect(cookieStore.set).toHaveBeenCalledOnce();
    expect(cookieStore.set.mock.calls[0][0]).toBe(sessionCookieName);
  });

  it("rejects invalid login payloads", async () => {
    const response = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "bad-email", password: "short" }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.fieldErrors.email).toBe("Enter a valid email address.");
  });

  it("rejects malformed login JSON", async () => {
    const response = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: "{",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Request body must be valid JSON.");
  });

  it("lists timesheets for authenticated requests", async () => {
    const response = await getTimesheets(new Request("http://localhost/api/timesheets?status=all"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.timesheets).toHaveLength(15);
  });

  it("derives missing status for timesheets with no entries", async () => {
    const response = await getTimesheets(new Request("http://localhost/api/timesheets?status=MISSING"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.timesheets.length).toBeGreaterThan(0);
    expect(payload.timesheets.every((timesheet: { entries: unknown[]; status: string }) => timesheet.entries.length === 0 && timesheet.status === "MISSING")).toBe(true);
  });

  it("returns a structured auth error for protected list requests", async () => {
    requireApiSession.mockResolvedValueOnce({
      response: Response.json({ error: "Authentication required." }, { status: 401 }),
    });

    const response = await getTimesheets(new Request("http://localhost/api/timesheets"));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Authentication required.");
  });

  it("fetches timesheet detail", async () => {
    const response = await getTimesheetDetail(new Request("http://localhost/api/timesheets/detail-jan-21"), {
      params: Promise.resolve({ id: "detail-jan-21" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.timesheet.id).toBe("detail-jan-21");
    expect(payload.timesheet.status).toBe("COMPLETED");
  });

  it("creates a timesheet entry", async () => {
    const response = await createEntry(
      new Request("http://localhost/api/timesheets/detail-jan-21/entries", {
        method: "POST",
        body: JSON.stringify({
          day: "Jan 25",
          project: "Project Name",
          type: "Bug fixes",
          description: "Create route test",
          hours: 2,
        }),
      }),
      { params: Promise.resolve({ id: "detail-jan-21" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.timesheet.entries.at(-1).description).toBe("Create route test");
    expect(payload.timesheet.status).toBe("COMPLETED");
  });

  it("derives incomplete status for timesheets with partial entries", async () => {
    const response = await createEntry(
      new Request("http://localhost/api/timesheets/5/entries", {
        method: "POST",
        body: JSON.stringify({
          day: "Jan 30",
          project: "Project Name",
          type: "Bug fixes",
          description: "Partial progress",
          hours: 2,
        }),
      }),
      { params: Promise.resolve({ id: "5" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.timesheet.status).toBe("INCOMPLETE");
  });

  it("rejects invalid create-entry payloads", async () => {
    const response = await createEntry(
      new Request("http://localhost/api/timesheets/detail-jan-21/entries", {
        method: "POST",
        body: JSON.stringify({
          day: "",
          project: "Project Name",
          type: "Bug fixes",
          description: "",
          hours: 0,
        }),
      }),
      { params: Promise.resolve({ id: "detail-jan-21" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.fieldErrors.description).toBe("Task description is required.");
  });

  it("rejects malformed entry JSON", async () => {
    const response = await createEntry(
      new Request("http://localhost/api/timesheets/detail-jan-21/entries", {
        method: "POST",
        body: "{",
      }),
      { params: Promise.resolve({ id: "detail-jan-21" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Request body must be valid JSON.");
  });

  it("updates an existing entry", async () => {
    const response = await updateEntry(
      new Request("http://localhost/api/timesheets/detail-jan-21/entries/jan21-1", {
        method: "PATCH",
        body: JSON.stringify({
          day: "Jan 21",
          project: "Project Name",
          type: "Feature work",
          description: "Updated description",
          hours: 6,
        }),
      }),
      { params: Promise.resolve({ id: "detail-jan-21", entryId: "jan21-1" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.timesheet.entries.find((entry: { id: string }) => entry.id === "jan21-1").description).toBe(
      "Updated description",
    );
    expect(payload.timesheet.status).toBe("COMPLETED");
  });

  it("deletes an existing entry", async () => {
    const response = await deleteEntry(new Request("http://localhost/api/timesheets/detail-jan-21/entries/jan21-1", {
      method: "DELETE",
    }), {
      params: Promise.resolve({ id: "detail-jan-21", entryId: "jan21-1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.timesheet.entries.some((entry: { id: string }) => entry.id === "jan21-1")).toBe(false);
  });
});
