"use client";

import { useMemo } from "react";

import {
  ActionDropdown,
  ActionDropdownItem,
  Button,
  Input,
  Modal,
  ProgressBar,
  SelectDropdown,
  Textarea,
} from "@components/shared";
import { projectOptions, taskTypeOptions } from "@lib/mock-data";
import { cn } from "@lib/utils";
import { useTimesheetDetail } from "@features/timesheets/hooks/use-timesheet-detail";
import type { TimesheetDetailResponse } from "@features/timesheets/services/timesheet-service";

interface TimesheetDetailPageProps {
  id: string;
  initialResponse?: TimesheetDetailResponse;
}

export function TimesheetDetailPage({ id, initialResponse }: TimesheetDetailPageProps) {
  const {
    timesheet,
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
    setFormField,
    saveEntry,
  } = useTimesheetDetail(id, initialResponse);

  const groupedEntries = useMemo(() => {
    if (!timesheet) {
      return [];
    }

    const days = ["Jan 21", "Jan 22", "Jan 23", "Jan 24", "Jan 25"];
    return days.map((day) => ({
      day,
      entries: timesheet.entries.filter((entry) => entry.day === day),
    }));
  }, [timesheet]);

  return (
    <>
      <div className="mx-auto w-full max-w-[1380px] px-4 py-5 md:px-8">
        <section className="app-card rounded-[10px] border-[2px] border-[var(--app-blue)] px-4 py-4 md:px-4">
          <div className="flex flex-col gap-6 border-b border-[var(--app-border)] px-3 pb-4 pt-1 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-[22px] font-bold tracking-[-0.04em] text-slate-800">This week&apos;s timesheet</h1>
              <p className="mt-5 text-[14px] text-slate-400">{timesheet?.dateLabel ?? "21 - 26 January, 2024"}</p>
            </div>
            <div className="flex items-start gap-3 self-start">
              <div className="space-y-1 text-right">
                <div className="inline-flex rounded-[6px] border border-[var(--app-border)] bg-white px-3 py-1 text-[14px] text-slate-700">
                  {timesheet?.totalHours ?? 0}/40 hrs
                </div>
                <div className="flex items-center gap-2">
                  <ProgressBar value={Math.min(100, ((timesheet?.totalHours ?? 0) / 40) * 100)} />
                  <span className="text-[11px] text-slate-400">{Math.round(Math.min(100, ((timesheet?.totalHours ?? 0) / 40) * 100))}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-3 pb-5 pt-3">
            {isLoading ? (
              <div className="py-10 text-sm text-slate-500">Loading timesheet...</div>
            ) : error ? (
              <div className="py-10 text-sm text-red-500">{error}</div>
            ) : !timesheet ? (
              <div className="py-10 text-sm text-slate-500">This timesheet is unavailable.</div>
            ) : (
              <div className="space-y-4">
                {actionError ? <div className="text-sm text-red-500">{actionError}</div> : null}
                {groupedEntries.map(({ day, entries }) => (
                  <section key={day} className="grid grid-cols-[70px_1fr] gap-[14px]">
                    <div className="pt-2 text-[16px] font-semibold text-slate-800">{day}</div>
                    <div className="space-y-2">
                      {entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex min-h-[30px] items-center rounded-[8px] border border-[var(--app-border)] bg-white pl-3 pr-2"
                        >
                          <div className="flex-1 text-[15px] text-slate-800">{entry.taskName}</div>
                          <div className="mr-3 text-[12px] text-slate-400">{entry.hours} hrs</div>
                          <span className="rounded-[6px] bg-[var(--app-blue-soft)] px-2 py-[2px] text-[10px] text-[var(--app-blue)]">
                            {entry.project}
                          </span>
                          <ActionDropdown
                            open={openMenuEntryId === entry.id}
                            onToggle={() => setOpenMenuEntryId(openMenuEntryId === entry.id ? "" : entry.id)}
                          >
                            <ActionDropdownItem
                              label="Edit"
                              onClick={() => {
                                setOpenMenuEntryId("");
                                openForEdit(entry);
                              }}
                            />
                            <ActionDropdownItem
                              label="Delete"
                              tone="danger"
                              onClick={() => {
                                void deleteEntryById(entry.id);
                              }}
                            />
                          </ActionDropdown>
                        </div>
                      ))}
                      {entries.length === 0 ? (
                        <div className="rounded-[8px] border border-dashed border-[var(--app-border)] bg-white px-3 py-3 text-[13px] text-slate-400">
                          No tasks logged for {day}.
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          openForAdd(day);
                        }}
                        className={cn(
                          "flex h-[32px] w-full items-center justify-center rounded-[8px] border border-dashed text-[14px]",
                          day === "Jan 21"
                            ? "border-[var(--app-blue)] bg-[#f6f9ff] text-[var(--app-blue)]"
                            : "border-[var(--app-border)] bg-white text-slate-400",
                        )}
                      >
                        + Add new task
                      </button>
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </section>

        <footer className="app-card mt-[10px] rounded-[10px] px-6 py-[30px] text-center text-[14px] text-slate-400">
          © 2024 tentwenty. All rights reserved.
        </footer>
      </div>

      <Modal
        open={isModalOpen}
        title={modalMode === "edit" ? "Edit Entry" : "Add New Entry"}
        description={modalMode === "edit" ? "Update the selected timesheet task." : `Create a task for ${form.day}.`}
        onClose={closeModal}
      >
        <div className="space-y-4 px-[14px] py-[12px]">
          <div>
            <label className="mb-2 block text-[12px] font-medium text-slate-700">Select Project * <span className="text-slate-400">ⓘ</span></label>
            <SelectDropdown
              id="project"
              value={form.project}
              options={projectOptions.map((project) => ({ label: project, value: project }))}
              onChange={(value) => setFormField("project", value)}
              error={fieldErrors.project}
            />
          </div>

          <div>
            <label className="mb-2 block text-[12px] font-medium text-slate-700">Type of Work * <span className="text-slate-400">ⓘ</span></label>
            <SelectDropdown
              id="type"
              value={form.type}
              options={taskTypeOptions.map((type) => ({ label: type, value: type }))}
              onChange={(value) => setFormField("type", value)}
              error={fieldErrors.type}
            />
          </div>

          <Textarea
            id="description"
            label="Task description"
            required
            note="A note for extra info"
            value={form.description}
            placeholder="Write text here ..."
            error={fieldErrors.description}
            onChange={(event) => setFormField("description", event.target.value)}
          />

          <div>
            <label className="mb-2 block text-[12px] font-medium text-slate-700">Hours *</label>
            <div className="inline-flex items-center overflow-hidden rounded-[6px] border border-[var(--app-border)]">
              <button
                type="button"
                className="h-[26px] w-[24px] border-r border-[var(--app-border)] bg-slate-50 text-[15px]"
                onClick={() => setFormField("hours", Math.max(1, form.hours - 1))}
              >
                −
              </button>
              <Input
                id="hours"
                value={String(form.hours)}
                onChange={(event) => setFormField("hours", Number(event.target.value) || 0)}
                className="h-[26px] w-[44px] rounded-none border-0 px-0 text-center text-[11px]"
              />
              <button
                type="button"
                className="h-[26px] w-[24px] border-l border-[var(--app-border)] bg-slate-50 text-[15px]"
                onClick={() => setFormField("hours", form.hours + 1)}
              >
                +
              </button>
            </div>
            {fieldErrors.hours ? <p className="mt-1 text-[12px] text-red-500">{fieldErrors.hours}</p> : null}
          </div>
          {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-[var(--app-border)] px-[14px] py-[10px]">
          <Button className="h-[30px] rounded-[6px] text-[11px]" onClick={() => void saveEntry()}>
            {modalMode === "edit" ? "Save changes" : "Add entry"}
          </Button>
          <Button variant="secondary" className="h-[30px] rounded-[6px] text-[11px]" onClick={closeModal}>
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  );
}
