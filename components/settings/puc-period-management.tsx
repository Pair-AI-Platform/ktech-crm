"use client";

import { useState } from "react";
import {
  CalendarRange,
  Plus,
  Loader2,
  Archive,
  Trash2,
  Play,
  Pencil,
  X,
  Save,
  Lock,
  AlertCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  usePUCPeriods,
  useCreatePUCPeriod,
  useUpdatePUCPeriod,
  useDeletePUCPeriod,
  useActivatePUCPeriod,
  useDeactivatePUCPeriod,
} from "@/lib/hooks/use-puc-periods";

import type { PucPeriod } from "@/lib/puc-periods/types";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusInfo(period: PucPeriod) {
  if (period.status === "archived") {
    return {
      label: "Archived",
      color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
      icon: Archive,
    };
  }

  if (period.status === "frozen") {
    return {
      label: "Frozen",
      color:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      icon: Lock,
    };
  }

  return {
    label: "Active",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: Play,
  };
}

export function PUCPeriodManagement() {
  const { periods, loading, error } = usePUCPeriods();

  const createPeriod = useCreatePUCPeriod();
  const updatePeriod = useUpdatePUCPeriod();
  const deletePeriod = useDeletePUCPeriod();
  const activatePeriod = useActivatePUCPeriod();
  const deactivatePeriod = useDeactivatePUCPeriod();

  const [showCreate, setShowCreate] = useState(false);

  const [newName, setNewName] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const activePeriod =
    periods.find((period) => period.status === "active") ?? null;
  const dateToStartOfDayISO = (date: string) => `${date}T00:00:00.000Z`;

  const dateToEndOfDayISO = (date: string) => `${date}T23:59:59.999Z`;
  const handleCreate = async () => {
    if (!newName.trim() || !newStart || !newEnd) return;

    try {
      await createPeriod.mutateAsync({
        name: newName.trim(),
        startDate: dateToStartOfDayISO(newStart),
        endDate: dateToEndOfDayISO(newEnd),
      });

      setShowCreate(false);
      setNewName("");
      setNewStart("");
      setNewEnd("");
    } catch {
      // Error is handled through createPeriod.error
    }
  };

  const startEdit = (period: PucPeriod) => {
    setEditingId(period.id);
    setEditName(period.name);
    setEditStart(period.startDate.slice(0, 10));
    setEditEnd(period.endDate.slice(0, 10));
  };

  const handleEdit = async () => {
    if (!editingId || !editName.trim() || !editStart || !editEnd) {
      return;
    }

    try {
      await updatePeriod.mutateAsync({
        id: editingId,
        payload: {
          name: editName.trim(),
          startDate: dateToStartOfDayISO(editStart),
          endDate: dateToEndOfDayISO(editEnd),
        },
      });

      setEditingId(null);
    } catch {
      // Error is handled through updatePeriod.error
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await deactivatePeriod.mutateAsync(id);
      setConfirmArchiveId(null);
    } catch {
      // Error is handled through deactivatePeriod.error
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await activatePeriod.mutateAsync(id);
    } catch {
      // Error is handled through activatePeriod.error
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePeriod.mutateAsync(id);
      setConfirmDeleteId(null);
    } catch {
      // Error is handled through deletePeriod.error
    }
  };

  const isCreating = createPeriod.isPending;
  const isUpdating = updatePeriod.isPending;
  const isDeleting = deletePeriod.isPending;
  const isActivating = activatePeriod.isPending;
  const isDeactivating = deactivatePeriod.isPending;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-[var(--primary)]" />
              PUC Periods
            </CardTitle>

            <CardDescription className="mt-1">
              Define date ranges for PUC reporting cycles. Only one period can
              be active at a time. Reports are frozen after the end date passes.
            </CardDescription>
          </div>

          <Button
            size="sm"
            onClick={() => setShowCreate(!showCreate)}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Period
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Create Form */}
        {showCreate && (
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-sunken)] space-y-3">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Create New PUC Period
            </p>

            {activePeriod && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-3.5 h-3.5" />

                <span>
                  Creating a new period will archive the current one (
                  {activePeriod.name})
                </span>
              </div>
            )}

            <Input
              placeholder="Period name (e.g., PUC 2025-2026)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">
                  Start Date
                </label>

                <Input
                  type="date"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">
                  End Date
                </label>

                <Input
                  type="date"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>

              <Button
                size="sm"
                onClick={handleCreate}
                disabled={
                  !newName.trim() ||
                  !newStart ||
                  !newEnd ||
                  newEnd <= newStart ||
                  isCreating
                }
              >
                {isCreating && (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                )}
                Create & Activate
              </Button>
            </div>

            {createPeriod.isError && (
              <p className="text-xs text-[var(--error)]">
                {createPeriod.error.message}
              </p>
            )}
          </div>
        )}

        {/* List Error */}
        {error && <p className="text-sm text-[var(--error)]">{error}</p>}

        {/* Period List */}
        {loading ? (
          <div className="flex items-center justify-center py-10 text-[var(--text-muted)]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading periods...
          </div>
        ) : periods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-[var(--text-muted)]">
            <CalendarRange className="w-8 h-8 opacity-30" />

            <p className="text-sm">No PUC periods configured</p>

            <p className="text-xs">
              Create a period to scope PUC reports to a specific date range
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] overflow-hidden">
            {periods.map((period) => {
              const statusInfo = getStatusInfo(period);
              const isEditing = editingId === period.id;
              const isConfirmingArchive = confirmArchiveId === period.id;
              const isConfirmingDelete = confirmDeleteId === period.id;

              return (
                <div
                  key={period.id}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 transition-colors",
                    period.status === "archived"
                      ? "opacity-60"
                      : "hover:bg-[var(--bg-sunken)]",
                  )}
                >
                  {isEditing ? (
                    <div className="flex-1 space-y-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 text-sm"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={editStart}
                          onChange={(e) => setEditStart(e.target.value)}
                          className="h-8 text-sm"
                        />

                        <Input
                          type="date"
                          value={editEnd}
                          onChange={(e) => setEditEnd(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="flex gap-1.5 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          onClick={handleEdit}
                          disabled={
                            !editName.trim() ||
                            !editStart ||
                            !editEnd ||
                            editEnd <= editStart ||
                            isUpdating
                          }
                        >
                          {isUpdating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>

                      {updatePeriod.isError && (
                        <p className="text-xs text-[var(--error)]">
                          {updatePeriod.error.message}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {period.name}
                          </p>

                          <Badge
                            className={cn(
                              "text-[10px] font-medium px-1.5 py-0",
                              statusInfo.color,
                            )}
                          >
                            {statusInfo.label}
                          </Badge>
                        </div>

                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {formatDate(period.startDate)} —{" "}
                          {formatDate(period.endDate)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {isConfirmingArchive ? (
                          <>
                            <span className="text-xs text-[var(--text-muted)] mr-1">
                              Deactivate?
                            </span>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[var(--error)]"
                              onClick={() => handleArchive(period.id)}
                              disabled={isDeactivating}
                            >
                              {isDeactivating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                "Yes"
                              )}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => setConfirmArchiveId(null)}
                            >
                              No
                            </Button>
                          </>
                        ) : isConfirmingDelete ? (
                          <>
                            <span className="text-xs text-[var(--text-muted)] mr-1">
                              Delete?
                            </span>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[var(--error)]"
                              onClick={() => handleDelete(period.id)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                "Yes"
                              )}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              No
                            </Button>
                          </>
                        ) : (
                          <>
                            {/* Edit active period */}
                            {period.status === "active" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => startEdit(period)}
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {/* Deactivate active period */}
                            {period.status === "active" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-amber-500"
                                onClick={() => setConfirmArchiveId(period.id)}
                                title="Deactivate"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {/* Activate archived/frozen period */}
                            {(period.status === "archived" ||
                              period.status === "frozen") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-emerald-500"
                                onClick={() => handleActivate(period.id)}
                                disabled={isActivating}
                                title="Activate"
                              >
                                {isActivating ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Play className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            )}

                            {/* Delete archived/frozen period */}
                            {(period.status === "archived" ||
                              period.status === "frozen") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-[var(--error)]"
                                onClick={() => setConfirmDeleteId(period.id)}
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
