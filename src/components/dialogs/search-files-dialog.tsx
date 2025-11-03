"use client"

import { 
  useMemo, 
  useState 
} from "react"

import type { 
  FileSearchParams 
} from "@/services/neo-api"

import { 
  Button 
} from "@/components/ui/button"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { 
  Input 
} from "@/components/ui/input"

import { 
  Label 
} from "@/components/ui/label"

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"

interface SearchFilesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSearch: (params: FileSearchParams) => Promise<void>
}

type SortByValue = NonNullable<FileSearchParams["sort_by"]>
type SortOrderValue = NonNullable<FileSearchParams["sort_order"]>

type FormState = {
  path: string
  filename: string
  file_type: string
  accessed_at_after: string
  accessed_at_before: string
  modified_time_after: string
  modified_time_before: string
  created_at_after: string
  created_at_before: string
  size_min: string
  size_max: string
  sort_by: "" | SortByValue
  sort_order: "" | SortOrderValue
  page_size: string
}

const initialState: FormState = {
  path: "",
  filename: "",
  file_type: "",
  accessed_at_after: "",
  accessed_at_before: "",
  modified_time_after: "",
  modified_time_before: "",
  created_at_after: "",
  created_at_before: "",
  size_min: "",
  size_max: "",
  sort_by: "modified_time",
  sort_order: "desc",
  page_size: "100",
}

export function SearchFilesDialog({ open, onOpenChange, onSearch }: SearchFilesDialogProps) {
  const [formValues, setFormValues] = useState<FormState>(initialState)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sortByOptions = useMemo(
    () => [
      { value: "modified_time", label: "Modified time" },
      { value: "created_at", label: "Created at" },
      { value: "accessed_at", label: "Accessed at" },
      { value: "filename", label: "Filename" },
      { value: "size", label: "Size" },
      { value: "share_name", label: "Share name" },
    ],
    []
  )

  const sortOrderOptions = useMemo(
    () => [
      { value: "asc", label: "Ascending" },
      { value: "desc", label: "Descending" },
    ],
    []
  )

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleReset = () => {
    setFormValues(initialState)
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)

    const parseNumber = (value?: string) => {
      if (!value?.trim()) return undefined
      const numeric = Number(value)
      return Number.isNaN(numeric) ? undefined : numeric
    }

    const parseDateTime = (value?: string) => {
      if (!value?.trim()) return undefined
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
    }

    const params: FileSearchParams = {
      ...(formValues.path.trim() && { path: formValues.path.trim() }),
      ...(formValues.filename.trim() && { filename: formValues.filename.trim() }),
      ...(formValues.file_type.trim() && { file_type: formValues.file_type.trim() }),
      ...(parseDateTime(formValues.accessed_at_after) && {
        accessed_at_after: parseDateTime(formValues.accessed_at_after),
      }),
      ...(parseDateTime(formValues.accessed_at_before) && {
        accessed_at_before: parseDateTime(formValues.accessed_at_before),
      }),
      ...(parseDateTime(formValues.modified_time_after) && {
        modified_time_after: parseDateTime(formValues.modified_time_after),
      }),
      ...(parseDateTime(formValues.modified_time_before) && {
        modified_time_before: parseDateTime(formValues.modified_time_before),
      }),
      ...(parseDateTime(formValues.created_at_after) && {
        created_at_after: parseDateTime(formValues.created_at_after),
      }),
      ...(parseDateTime(formValues.created_at_before) && {
        created_at_before: parseDateTime(formValues.created_at_before),
      }),
      ...(parseNumber(formValues.size_min) !== undefined && {
        size_min: parseNumber(formValues.size_min),
      }),
      ...(parseNumber(formValues.size_max) !== undefined && {
        size_max: parseNumber(formValues.size_max),
      }),
      ...(formValues.sort_by && { sort_by: formValues.sort_by }),
      ...(formValues.sort_order && { sort_order: formValues.sort_order }),
      ...(parseNumber(formValues.page_size) !== undefined && {
        page_size: parseNumber(formValues.page_size),
      }),
    }

    try {
      await onSearch(params)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setIsSubmitting(false)
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Search files</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="filename">Filename contains</Label>
              <Input
                id="filename"
                placeholder="e.g. invoice"
                value={formValues.filename}
                onChange={(event) => handleInputChange("filename", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file_type">File type</Label>
              <Input
                id="file_type"
                placeholder="e.g. pdf, docx"
                value={formValues.file_type}
                onChange={(event) => handleInputChange("file_type", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="path">Path pattern</Label>
              <Input
                id="path"
                placeholder="e.g. /Finance/%"
                value={formValues.path}
                onChange={(event) => handleInputChange("path", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="size_min">Minimum size (bytes)</Label>
              <Input
                id="size_min"
                type="number"
                min="0"
                placeholder="0"
                value={formValues.size_min}
                onChange={(event) => handleInputChange("size_min", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="size_max">Maximum size (bytes)</Label>
              <Input
                id="size_max"
                type="number"
                min="0"
                placeholder="10485760"
                value={formValues.size_max}
                onChange={(event) => handleInputChange("size_max", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modified_after">Modified after</Label>
              <Input
                id="modified_after"
                type="datetime-local"
                value={formValues.modified_time_after}
                onChange={(event) => handleInputChange("modified_time_after", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modified_before">Modified before</Label>
              <Input
                id="modified_before"
                type="datetime-local"
                value={formValues.modified_time_before}
                onChange={(event) => handleInputChange("modified_time_before", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="created_after">Created after</Label>
              <Input
                id="created_after"
                type="datetime-local"
                value={formValues.created_at_after}
                onChange={(event) => handleInputChange("created_at_after", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="created_before">Created before</Label>
              <Input
                id="created_before"
                type="datetime-local"
                value={formValues.created_at_before}
                onChange={(event) => handleInputChange("created_at_before", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessed_after">Accessed after</Label>
              <Input
                id="accessed_after"
                type="datetime-local"
                value={formValues.accessed_at_after}
                onChange={(event) => handleInputChange("accessed_at_after", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessed_before">Accessed before</Label>
              <Input
                id="accessed_before"
                type="datetime-local"
                value={formValues.accessed_at_before}
                onChange={(event) => handleInputChange("accessed_at_before", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Sort by</Label>
              <Select
                value={formValues.sort_by}
                onValueChange={(value) => handleInputChange("sort_by", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose field" />
                </SelectTrigger>
                <SelectContent>
                  {sortByOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sort order</Label>
              <Select
                value={formValues.sort_order}
                onValueChange={(value) => handleInputChange("sort_order", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose order" />
                </SelectTrigger>
                <SelectContent>
                  {sortOrderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="page_size">Results per page</Label>
              <Input
                id="page_size"
                type="number"
                min="1"
                max="1000"
                value={formValues.page_size}
                onChange={(event) => handleInputChange("page_size", event.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleReset} disabled={isSubmitting}>
              Reset
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Searching…" : "Search"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}