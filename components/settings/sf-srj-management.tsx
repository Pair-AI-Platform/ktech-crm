"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Building2, Plus, Search, Edit2, Trash2, Check, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface SfSrjEntry {
  id: string
  name: string
  code: string
  status: "active" | "inactive"
  created_at: string
}

export function SfSrjManagement() {
  const [entries, setEntries] = useState<SfSrjEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newCode, setNewCode] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editCode, setEditCode] = useState("")

  const supabase = createClient()

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("sf_srj")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data) {
        setEntries(data)
      }
    } catch (err) {
      console.error("Failed to fetch SF SRJ entries:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newName.trim() || !newCode.trim()) return

    const { data, error } = await supabase
      .from("sf_srj")
      .insert({ name: newName.trim(), code: newCode.trim(), status: "active" })
      .select()
      .single()

    if (!error && data) {
      setEntries([data, ...entries])
      setNewName("")
      setNewCode("")
      setIsAdding(false)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim() || !editCode.trim()) return

    const { error } = await supabase
      .from("sf_srj")
      .update({ name: editName.trim(), code: editCode.trim() })
      .eq("id", id)

    if (!error) {
      setEntries(entries.map(e => e.id === id ? { ...e, name: editName.trim(), code: editCode.trim() } : e))
      setEditingId(null)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active"
    const { error } = await supabase
      .from("sf_srj")
      .update({ status: newStatus })
      .eq("id", id)

    if (!error) {
      setEntries(entries.map(e => e.id === id ? { ...e, status: newStatus as "active" | "inactive" } : e))
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("sf_srj")
      .delete()
      .eq("id", id)

    if (!error) {
      setEntries(entries.filter(e => e.id !== id))
    }
  }

  const filteredEntries = entries.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[var(--primary)]" />
                SF SRJ Management
              </CardTitle>
              <CardDescription>
                Manage SF SRJ entries and configurations
              </CardDescription>
            </div>
            <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <Input
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Add New Entry Form */}
          {isAdding && (
            <div className="p-4 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/30 space-y-3">
              <p className="text-sm font-medium text-[var(--text-primary)]">New Entry</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  placeholder="Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <Input
                  placeholder="Code"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleAdd}>
                  <Check className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setIsAdding(false); setNewName(""); setNewCode("") }}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Entries List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-xl bg-[var(--bg-sunken)] animate-pulse" />
              ))}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" />
              <p className="text-[var(--text-muted)]">
                {searchQuery ? "No entries match your search" : "No SF SRJ entries yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors"
                >
                  {editingId === entry.id ? (
                    <div className="flex items-center gap-3 flex-1 mr-3">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-[200px]"
                      />
                      <Input
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
                        className="max-w-[150px]"
                      />
                      <Button size="sm" onClick={() => handleUpdate(entry.id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{entry.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">Code: {entry.code}</p>
                        </div>
                        <Badge variant={entry.status === "active" ? "success" : "secondary"}>
                          {entry.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleStatus(entry.id, entry.status)}
                        >
                          {entry.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(entry.id)
                            setEditName(entry.name)
                            setEditCode(entry.code)
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-500 hover:text-rose-600"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
