"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ApiError } from "@lib/api";
import { validateTimesheetEntryInput } from "@lib/validation";
import {
  createTimesheetEntry,
  deleteTimesheetEntry,
  getTimesheetDetail,
  type TimesheetDetailResponse,
  updateTimesheetEntry,
} from "@features/timesheets/services/timesheet-service";
import { getCachedTimesheet, upsertCachedTimesheet } from "@features/timesheets/services/timesheet-storage";
import type {
  EntryModalMode,
  FieldErrors,
  ProjectName,
  TaskType,
  Timesheet,
  TimesheetEntry,
  TimesheetEntryField,
  User,
} from "@/types";

interface EntryFormState {
  project: ProjectName;
  type: TaskType;
  description: string;
  hours: number;
  day: string;
}

const initialFormState: EntryFormState = {
  project: "Project Name",
  type: "Bug fixes",
  description: "",
  hours: 12,
  day: "Jan 22",
};

export function useTimesheetDetail(id: string, initialResponse?: TimesheetDetailResponse) {
  const router = useRouter();
  const [timesheet, setTimesheet] = useState<Timesheet | null>(initialResponse?.timesheet ?? null);
  const [user, setUser] = useState<User | null>(initialResponse?.user ?? null);
  const [openMenuEntryId, setOpenMenuEntryId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialResponse);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<TimesheetEntryField>>({});
  const [modalMode, setModalMode] = useState<EntryModalMode>("create");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [form, setForm] = useState<EntryFormState>(initialFormState);
  const shouldUseInitialResponse = useRef(Boolean(initialResponse));

  useEffect(() => {
    const cachedTimesheet = getCachedTimesheet(id);

    if (cachedTimesheet) {
      queueMicrotask(() => {
        setTimesheet(cachedTimesheet);
      });
    }
  }, [id]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (shouldUseInitialResponse.current) {
        shouldUseInitialResponse.current = false;
        return;
      }

      shouldUseInitialResponse.current = false;
      setIsLoading(true);
      setError(null);

      try {
        const response = await getTimesheetDetail(id);

        if (!active) {
          return;
        }

        setTimesheet(response.timesheet);
        setUser(response.user);
        upsertCachedTimesheet(response.timesheet, response.user);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setTimesheet(null);
        setUser(null);
        setError(loadError instanceof ApiError ? loadError.message : "Unable to load this timesheet.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [id]);

  function closeModal() {
    setIsModalOpen(false);
    setModalMode("create");
    setEditingEntryId(null);
    setFieldErrors({});
    setSubmitError(null);
    setForm(initialFormState);
  }

  function openForAdd(day: string) {
    setModalMode("create");
    setEditingEntryId(null);
    setFieldErrors({});
    setSubmitError(null);
    setForm({
      ...initialFormState,
      day,
    });
    setIsModalOpen(true);
  }

  function openForEdit(entry: TimesheetEntry) {
    setModalMode("edit");
    setEditingEntryId(entry.id);
    setFieldErrors({});
    setSubmitError(null);
    setForm({
      day: entry.day,
      project: entry.project,
      type: entry.type,
      description: entry.description,
      hours: entry.hours,
    });
    setIsModalOpen(true);
  }

  async function saveEntry() {
    const validation = validateTimesheetEntryInput(form);
    setFieldErrors(validation.fieldErrors);
    setSubmitError(null);

    if (!validation.isValid) {
      return;
    }

    try {
      const response =
        modalMode === "edit" && editingEntryId
          ? await updateTimesheetEntry(id, { ...validation.data, entryId: editingEntryId })
          : await createTimesheetEntry(id, validation.data);

      setTimesheet(response.timesheet);
      upsertCachedTimesheet(response.timesheet, response.user);
      router.refresh();
      closeModal();
    } catch (submissionError) {
      if (submissionError instanceof ApiError) {
        setFieldErrors((submissionError.fieldErrors ?? {}) as FieldErrors<TimesheetEntryField>);
        setSubmitError(submissionError.message);
      } else {
        setSubmitError("Unable to save this entry.");
      }
    }
  }

  async function deleteEntryById(entryId: TimesheetEntry["id"]) {
    setActionError(null);

    if (!window.confirm("Delete this task?")) {
      setOpenMenuEntryId("");
      return;
    }

    try {
      const response = await deleteTimesheetEntry(id, entryId);
      setTimesheet(response.timesheet);
      upsertCachedTimesheet(response.timesheet, response.user);
      router.refresh();
      setOpenMenuEntryId("");
    } catch (submissionError) {
      setActionError(submissionError instanceof ApiError ? submissionError.message : "Unable to delete this entry.");
      setOpenMenuEntryId("");
    }
  }

  return {
    timesheet,
    user,
    isLoading,
    error,
    actionError,
    openMenuEntryId,
    setOpenMenuEntryId,
    isModalOpen,
    modalMode,
    fieldErrors,
    submitError,
    closeModal,
    openForAdd,
    openForEdit,
    deleteEntryById,
    form,
    setFormField<K extends keyof EntryFormState>(key: K, value: EntryFormState[K]) {
      setFieldErrors((current) => ({ ...current, [key]: undefined }));
      setForm((current) => ({ ...current, [key]: value }));
    },
    saveEntry,
  };
}
