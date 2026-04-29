"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError } from "@lib/api";
import { validateLoginInput, validationLimits } from "@lib/validation";
import { login } from "@features/auth/services/auth-service";
import type { FieldErrors, LoginField } from "@/types";

interface LoginFormState {
  email: string;
  password: string;
  remember: boolean;
}

const initialState: LoginFormState = {
  email: "",
  password: "",
  remember: false,
};

export function useAuth() {
  const router = useRouter();
  const [form, setForm] = useState<LoginFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<LoginField>>({});

  async function submit() {
    const validation = validateLoginInput(form);
    setFieldErrors(validation.fieldErrors);
    setError(null);

    if (!validation.isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login(form);
      router.replace("/timesheets");
      router.refresh();
    } catch (submissionError) {
      if (submissionError instanceof ApiError) {
        setFieldErrors((submissionError.fieldErrors ?? {}) as FieldErrors<LoginField>);
        setError(submissionError.message);
      } else {
        setError(submissionError instanceof Error ? submissionError.message : "Unable to sign in.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    form,
    isSubmitting,
    error,
    fieldErrors,
    validationLimits,
    setField<K extends keyof LoginFormState>(key: K, value: LoginFormState[K]) {
      if (key === "email" || key === "password") {
        setFieldErrors((current) => ({ ...current, [key]: undefined }));
      }
      setForm((current) => ({ ...current, [key]: value }));
    },
    submit,
  };
}
