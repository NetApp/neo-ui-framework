// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { useState } from "react"
import { IconDatabasePlus } from "@tabler/icons-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { Dataset } from "@/services/models"

interface AddToDatasetDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    datasets: Dataset[]
    fileCount: number
    onAdd: (datasetId: string, notes?: string) => Promise<void>
}

export function AddToDatasetDialog({
    open,
    onOpenChange,
    datasets,
    fileCount,
    onAdd,
}: AddToDatasetDialogProps) {
    const [selectedDatasetId, setSelectedDatasetId] = useState<string>("")
    const [notes, setNotes] = useState("")
    const [isAdding, setIsAdding] = useState(false)

    const handleAdd = async () => {
        if (!selectedDatasetId) return

        setIsAdding(true)
        try {
            await onAdd(selectedDatasetId, notes.trim() || undefined)
            onOpenChange(false)
            // Reset state
            setSelectedDatasetId("")
            setNotes("")
        } finally {
            setIsAdding(false)
        }
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setSelectedDatasetId("")
            setNotes("")
        }
        onOpenChange(open)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <IconDatabasePlus className="h-5 w-5" />
                        Add to Dataset
                    </DialogTitle>
                    <DialogDescription>
                        Add {fileCount} file{fileCount !== 1 ? "s" : ""} to an existing dataset.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="dataset-select">Dataset</Label>
                        {datasets.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">
                                No datasets available. Create a dataset first.
                            </p>
                        ) : (
                            <Select value={selectedDatasetId} onValueChange={setSelectedDatasetId}>
                                <SelectTrigger id="dataset-select">
                                    <SelectValue placeholder="Select a dataset…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {datasets.map((d) => (
                                        <SelectItem key={d.id} value={d.id}>
                                            <div className="flex items-center gap-2">
                                                <span>{d.name}</span>
                                                {d.item_count !== undefined && (
                                                    <span className="text-xs text-muted-foreground">
                                                        ({d.item_count} items)
                                                    </span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <Textarea
                            id="notes"
                            placeholder="Add a note about these files…"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="default"
                        onClick={handleAdd}
                        disabled={!selectedDatasetId || isAdding || datasets.length === 0}
                    >
                        {isAdding ? "Adding…" : `Add ${fileCount} file${fileCount !== 1 ? "s" : ""}`}
                    </Button>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isAdding}>
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
