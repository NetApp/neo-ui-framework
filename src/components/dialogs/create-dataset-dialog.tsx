// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    is_public: z.boolean().default(false),
    acl_override_enabled: z.boolean().default(false),
})

export type CreateDatasetFormValues = z.infer<typeof formSchema>

interface CreateDatasetDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (values: CreateDatasetFormValues) => Promise<void>
    fileCount?: number
}

export function CreateDatasetDialog({
    open,
    onOpenChange,
    onSave,
    fileCount,
}: CreateDatasetDialogProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<CreateDatasetFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            is_public: false,
            acl_override_enabled: false,
        },
    })

    const onSubmit = async (values: CreateDatasetFormValues) => {
        setLoading(true)
        try {
            await onSave(values)
            form.reset()
            onOpenChange(false)
        } catch (error) {
            console.error("Failed to create dataset", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
            <DrawerContent>
                <div className="mx-auto w-full max-w-lg">
                    <DrawerHeader>
                        <DrawerTitle>Create Dataset</DrawerTitle>
                        <DrawerDescription>
                            {fileCount !== undefined
                                ? `Create a new dataset from ${fileCount} file${fileCount !== 1 ? "s" : ""}.`
                                : "Create a new dataset from the current search results."}
                        </DrawerDescription>
                    </DrawerHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="px-4 space-y-5">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., PDF Reports Q1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Optional description for this dataset…"
                                                className="resize-none"
                                                rows={3}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="is_public"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                            <div className="space-y-0.5">
                                                <FormLabel>Public</FormLabel>
                                                <FormDescription className="text-xs">
                                                    Make this dataset visible to all users
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="acl_override_enabled"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                            <div className="space-y-0.5">
                                                <FormLabel>ACL Override</FormLabel>
                                                <FormDescription className="text-xs">
                                                    Bypass file-level ACL checks for this dataset
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <DrawerFooter className="px-0">
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                                    Create Dataset
                                </Button>
                                <DrawerClose asChild>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </DrawerClose>
                            </DrawerFooter>
                        </form>
                    </Form>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
