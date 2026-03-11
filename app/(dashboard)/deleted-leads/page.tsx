"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Trash2,
  Search,
  RefreshCw,
  Undo2,
  Loader2,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react"
import { useDeletedLeads, useDeletedLeadsStats, useDeletedLeadMutations } from "@/lib/hooks/use-deleted-leads"
import { useUser } from "@/lib/hooks/use-user"
import { DeletedLeadsTable } from "@/components/leads/deleted-leads-table"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function DeletedLeadsPage() {
  const router = useRouter()
  const { profile, loading: userLoading } = useUser()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [showBulkRestoreConfirm, setShowBulkRestoreConfirm] = useState(false)

  const { deletedLeads, loading, error, refetch } = useDeletedLeads({
    searchQuery,
    limit: 100,
  })

  const { stats } = useDeletedLeadsStats()
  const { bulkRestoreLeads, loading: mutationLoading } = useDeletedLeadMutations()

  // Redirect non-admin users
  useEffect(() => {
    if (!userLoading && profile && profile.role !== "admin") {
      router.push("/leads")
    }
  }, [profile, userLoading, router])

  const handleSelectLead = (id: string) => {
    setSelectedLeads(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedLeads.length === deletedLeads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(deletedLeads.map(l => l.id))
    }
  }

  const handleBulkRestore = async () => {
    const result = await bulkRestoreLeads(selectedLeads)
    if (!result.error) {
      setSelectedLeads([])
      setShowBulkRestoreConfirm(false)
      refetch()
    }
  }

  const handleRestoreSuccess = () => {
    refetch()
  }

  // Show loading while checking user role
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  // Show access denied for non-admins
  if (profile && profile.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <ShieldAlert className="w-16 h-16 text-[var(--error)]" />
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Access Denied</h1>
        <p className="text-[var(--text-secondary)]">Only administrators can access deleted leads.</p>
        <Button onClick={() => router.push("/leads")}>Go to Leads</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Header
        user={profile}
        title="Deleted Leads"
        subtitle="View and restore leads deleted by agents"
      />

      <div className="px-3 py-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</p>
                <p className="text-sm text-[var(--text-secondary)]">Total Deleted</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Undo2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.restoredCount}</p>
                <p className="text-sm text-[var(--text-secondary)]">Restored</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.thisMonth}</p>
                <p className="text-sm text-[var(--text-secondary)]">Deleted This Month</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <Input
              placeholder="Search deleted leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            {selectedLeads.length > 0 && (
              <Button
                variant="default"
                onClick={() => setShowBulkRestoreConfirm(true)}
                disabled={mutationLoading}
                className="bg-[var(--success)] hover:bg-[var(--success)]/90"
              >
                <Undo2 className="w-4 h-4 mr-2" />
                Restore Selected ({selectedLeads.length})
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Selected Count Banner */}
        <AnimatePresence>
          {selectedLeads.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[var(--primary-muted)] border border-[var(--primary)]/20 rounded-lg p-3 flex items-center justify-between"
            >
              <span className="text-sm font-medium text-[var(--primary)]">
                {selectedLeads.length} lead{selectedLeads.length !== 1 ? "s" : ""} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLeads([])}
                className="text-[var(--primary)] hover:bg-[var(--primary)]/10"
              >
                Clear Selection
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        {error && (
          <Card className="p-4 bg-red-500/10 border-red-500/20">
            <p className="text-red-600">Error loading deleted leads: {error}</p>
          </Card>
        )}

        {/* Deleted Leads Table */}
        <DeletedLeadsTable
          deletedLeads={deletedLeads}
          loading={loading}
          selectedLeads={selectedLeads}
          onSelectLead={handleSelectLead}
          onSelectAll={handleSelectAll}
          onRestoreSuccess={handleRestoreSuccess}
        />
      </div>

      {/* Bulk Restore Confirmation Dialog */}
      <AlertDialog open={showBulkRestoreConfirm} onOpenChange={setShowBulkRestoreConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Undo2 className="w-5 h-5 text-[var(--success)]" />
              Restore {selectedLeads.length} Lead{selectedLeads.length !== 1 ? "s" : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the selected leads back to the main leads list.
              They will be assigned to their original agent if available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutationLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkRestore}
              disabled={mutationLoading}
              className="bg-[var(--success)] hover:bg-[var(--success)]/90"
            >
              {mutationLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                "Restore Leads"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
