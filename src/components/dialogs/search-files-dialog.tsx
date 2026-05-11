// Copyright 2025 NetApp, Inc. All Rights Reserved.
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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

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
import { Switch } from "@/components/ui/switch"

interface SearchFilesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSearch: (params: FileSearchParams) => Promise<void>
  allowContentVisibility?: boolean
}

type FieldSetValue = NonNullable<FileSearchParams["field_set"]>

type FormState = {
  filename: string
  file_type: string
  after_modified_time: string
  field_set: "" | FieldSetValue
  page_size: string
  include_content: boolean
  include_counts: boolean
}

const initialState: FormState = {
  filename: "",
  file_type: "",
  after_modified_time: "",
  field_set: "standard",
  page_size: "100",
  include_content: false,
  include_counts: false,
}

export function SearchFilesDialog({ open, onOpenChange, onSearch, allowContentVisibility = true }: SearchFilesDialogProps) {
  const [formValues, setFormValues] = useState<FormState>(initialState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const fieldSetOptions = useMemo(
    () => [
      { value: "minimal", label: "Minimal" },
      { value: "standard", label: "Standard" },
      { value: "metadata", label: "Metadata" },
      { value: "security", label: "Security" },
      { value: "full", label: "Full" },
    ],
    []
  )

  const handleInputChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
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

    const normalizeFileType = (value?: string) => {
      if (!value?.trim()) return undefined

      const normalized = value
        .split(",")
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean)
        .map((part) => (part.startsWith(".") ? part : `.${part}`))
        .join(",")

      return normalized || undefined
    }

    const params: FileSearchParams = {
      ...(formValues.filename.trim() && { filename: formValues.filename.trim() }),
      ...(normalizeFileType(formValues.file_type) && {
        file_type: normalizeFileType(formValues.file_type),
      }),
      ...(parseDateTime(formValues.after_modified_time) && {
        after_modified_time: parseDateTime(formValues.after_modified_time),
      }),
      ...(formValues.field_set && { field_set: formValues.field_set }),
      ...(parseNumber(formValues.page_size) !== undefined && {
        page_size: parseNumber(formValues.page_size),
      }),
      include_content: allowContentVisibility ? formValues.include_content : false,
      include_counts: formValues.include_counts,
    }

    try {
      await onSearch(params)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setIsSubmitting(false)
        }
        onOpenChange(nextOpen)
      }}
      direction="bottom"
    >
      <DrawerContent>
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader>
            <DrawerTitle>Search files</DrawerTitle>
            <DrawerDescription>
              Filter indexed files and run an API-backed search.
            </DrawerDescription>
          </DrawerHeader>

          <form onSubmit={handleSubmit} className="px-4 space-y-5">
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
                <Label htmlFor="file_type">File extension</Label>
                <Input
                  id="file_type"
                  placeholder="e.g. pdf or .pdf"
                  value={formValues.file_type}
                  onChange={(event) => handleInputChange("file_type", event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Dot prefix is optional. Values like "pdf" are normalized to ".pdf".
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="after_modified_time">Before modified time (cursor)</Label>
                <Input
                  id="after_modified_time"
                  type="datetime-local"
                  value={formValues.after_modified_time}
                  onChange={(event) => handleInputChange("after_modified_time", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Field set</Label>
                <Select
                  value={formValues.field_set}
                  onValueChange={(value) => handleInputChange("field_set", value as FieldSetValue)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose set" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldSetOptions.map((option) => (
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

            <div className="rounded-lg border border-dashed p-3">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Advanced options</p>
                  <p className="text-xs text-muted-foreground">
                    Disabled by default to limit payload size and keep searches fast.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced((prev) => !prev)}
                >
                  {showAdvanced ? "Hide" : "Show"}
                </Button>
              </div>

              {showAdvanced ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5 pr-3">
                      <Label htmlFor="include_content">Include content</Label>
                      <p className="text-xs text-muted-foreground">
                        Returns extracted text content for matching files.
                      </p>
                    </div>
                    <Switch
                      id="include_content"
                      checked={allowContentVisibility ? formValues.include_content : false}
                      onCheckedChange={(checked) => handleInputChange("include_content", checked)}
                      disabled={!allowContentVisibility}
                    />
                  </div>
                  {!allowContentVisibility ? (
                    <p className="sm:col-span-2 text-xs text-muted-foreground">
                      Content visibility is disabled in Settings.
                    </p>
                  ) : null}

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5 pr-3">
                      <Label htmlFor="include_counts">Include counts</Label>
                      <p className="text-xs text-muted-foreground">
                        Calculates total counts and aggregate sizes.
                      </p>
                    </div>
                    <Switch
                      id="include_counts"
                      checked={formValues.include_counts}
                      onCheckedChange={(checked) => handleInputChange("include_counts", checked)}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <DrawerFooter className="px-0">
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={handleReset} disabled={isSubmitting}>
                  Reset
                </Button>
                <DrawerClose asChild>
                  <Button type="button" variant="outline" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </DrawerClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Searching…" : "Search"}
                </Button>
              </div>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}