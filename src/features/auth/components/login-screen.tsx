"use client";

import { Button, Checkbox, Input } from "@components/shared";
import { mockCredentials } from "@lib/mock-data";
import { useAuth } from "@features/auth/hooks/use-auth";

export function LoginScreen() {
  const { form, isSubmitting, error, fieldErrors, setField, submit, validationLimits } = useAuth();

  return (
    <main className="relative grid min-h-screen grid-cols-1 bg-white lg:grid-cols-2">
      <section className="flex min-h-[50vh] items-center justify-center bg-white px-6 py-16 lg:min-h-screen lg:justify-start lg:px-[78px]">
        <div className="w-full max-w-[622px]">
          <div className="max-w-[622px]">
            <h1 className="text-[26px] font-bold tracking-[-0.035em] text-slate-900">Welcome back</h1>
            <p className="mt-3 text-sm text-slate-500">
              Demo sign-in: {mockCredentials.email} / {mockCredentials.password}
            </p>
            <form
              className="mt-[24px] space-y-[18px]"
              onSubmit={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              <Input
                id="email"
                name="email"
                label="Email"
                type="email"
                value={form.email}
                placeholder="name@example.com"
                error={fieldErrors.email}
                onChange={(event) => setField("email", event.target.value)}
              />
              <Input
                id="password"
                name="password"
                label="Password"
                type="password"
                value={form.password}
                placeholder="••••••••••"
                hint={`Minimum ${validationLimits.minPasswordLength} characters`}
                error={fieldErrors.password}
                onChange={(event) => setField("password", event.target.value)}
              />
              <Checkbox
                label="Remember me"
                checked={form.remember}
                onChange={(event) => setField("remember", event.target.checked)}
              />
              {error ? <p className="text-sm text-red-500">{error}</p> : null}
              <Button fullWidth type="submit" disabled={isSubmitting} className="h-[46px] rounded-[9px] text-[15px]">
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </div>
        </div>
      </section>

      <section className="flex min-h-[50vh] items-center bg-[var(--app-blue)] px-6 py-16 text-white lg:min-h-screen lg:px-[78px]">
        <div className="max-w-[545px]">
          <h2 className="text-[60px] font-bold tracking-[-0.05em]">ticktock</h2>
          <p className="mt-[18px] max-w-[540px] text-[18px] leading-[1.52] text-white/92">
            Introducing ticktock, our cutting-edge timesheet web application designed to revolutionize how you manage
            employee work hours. With ticktock, you can effortlessly track and monitor employee attendance and
            productivity from anywhere, anytime, using any internet-connected device.
          </p>
        </div>
      </section>

      <div className="absolute inset-x-0 bottom-0 h-[4px] bg-[var(--app-blue)]" />
    </main>
  );
}
