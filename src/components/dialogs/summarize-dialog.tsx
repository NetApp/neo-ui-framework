import { useEffect, useState, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNeoApi } from "@/hooks/useNeoApi"
import { useSettings } from "@/context/settings-context"
import { Loader2, AlertTriangle, FileText, Send, User, Bot } from "lucide-react"

interface SummarizeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    fileId: string
    shareId: string
    filename: string
}

interface Message {
    role: "user" | "assistant" | "system"
    content: string
}

export function SummarizeDialog({ open, onOpenChange, fileId, shareId, filename }: SummarizeDialogProps) {
    const { handlers } = useNeoApi()
    const { llmHost, llmPort } = useSettings()

    const [loading, setLoading] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [status, setStatus] = useState<string>("Initializing...")
    const [fileContent, setFileContent] = useState<string | null>(null)

    const scrollRef = useRef<HTMLDivElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    useEffect(() => {
        if (open && fileId && shareId) {
            initializeChat()
        } else {
            // Cancel ongoing request if any
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
                abortControllerRef.current = null
            }

            // Clear LLM Cache
            const baseUrl = `http://${llmHost}:${llmPort}`
            fetch(`${baseUrl}/slots/0?action=erase`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            }).catch(err => console.error("Failed to clear LLM cache:", err))

            // Reset state when closed
            setMessages([])
            setInput("")
            setError(null)
            setLoading(false)
            setFileContent(null)
        }
    }, [open, fileId, shareId])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, loading])

    const initializeChat = async () => {
        setLoading(true)
        setError(null)
        setMessages([])

        try {
            // 1. Fetch File Content
            setStatus("Fetching document content...")
            const metadata = await handlers.handleFetchFileMetadata(shareId, fileId)

            if (!metadata || !metadata.content) {
                throw new Error("No text content found for this file.")
            }

            const content = metadata.content.slice(0, 30000)
            setFileContent(content)

            // 2. Initial Summary Request
            setStatus("Generating summary...")
            const initialPrompt = "Please provide a concise summary of this document."

            await sendMessage(initialPrompt, content, [])

        } catch (err: any) {
            console.error(err)
            setError(err.message || "Failed to initialize chat")
            setLoading(false)
        }
    }

    const handleSend = async () => {
        if (!input.trim() || !fileContent) return

        const userMessage = input
        setInput("")
        await sendMessage(userMessage, fileContent, messages)
    }

    const sendMessage = async (newPrompt: string, content: string, currentHistory: Message[]) => {
        setLoading(true)
        setError(null)

        // Cancel previous request if exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        const controller = new AbortController()
        abortControllerRef.current = controller

        const newHistory: Message[] = [
            ...currentHistory,
            { role: "user", content: newPrompt }
        ]

        setMessages(newHistory)

        try {
            const baseUrl = `http://${llmHost}:${llmPort}`

            // Construct the API messages payload
            // Improved system prompt to force usage of context
            const apiMessages = [
                {
                    role: "system",
                    content: `You are a helpful assistant. You must answer questions based ONLY on the following document content. If the answer is not in the document, say so.\n\nDOCUMENT CONTENT:\n${content}\n\nEND OF DOCUMENT CONTENT`
                },
                ...newHistory.map(m => ({ role: m.role, content: m.content }))
            ]

            const response = await fetch(`${baseUrl}/v1/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "granite-3.1-8b-instruct",
                    messages: apiMessages,
                    stream: false
                }),
                signal: controller.signal
            })

            if (!response.ok) {
                throw new Error(`LLM Error: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            const result = data.choices?.[0]?.message?.content

            if (!result) {
                throw new Error("Empty response from LLM")
            }

            setMessages(prev => [
                ...prev,
                { role: "assistant", content: result }
            ])

        } catch (err: any) {
            if (err.name === 'AbortError') return
            console.error(err)
            setError(err.message || "Failed to get response")
        } finally {
            if (abortControllerRef.current === controller) {
                abortControllerRef.current = null
                setLoading(false)
                setStatus("Ready")
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Chat with {filename}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                    {/* Initial Loading State when fetching content */}
                    {loading && messages.length === 0 && !error && (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 text-muted-foreground opacity-70">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p>{status}</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center justify-center p-8 text-destructive space-y-2">
                            <AlertTriangle className="h-8 w-8" />
                            <p className="font-medium">Error Occurred</p>
                            <p className="text-sm text-center">{error}</p>
                            <Button variant="outline" size="sm" onClick={() => initializeChat()} className="mt-4">
                                Retry
                            </Button>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            {msg.role === "assistant" && (
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Bot className="h-5 w-5 text-primary" />
                                </div>
                            )}

                            <div className={`rounded-lg p-3 max-w-[80%] text-sm leading-relaxed ${msg.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50 dark:bg-muted/30 border"
                                }`}>
                                <div className="prose dark:prose-invert max-w-none text-inherit">
                                    {msg.content}
                                </div>
                            </div>

                            {msg.role === "user" && (
                                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                    <User className="h-5 w-5 text-secondary-foreground" />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Chat loading indicator */}
                    {loading && messages.length > 0 && (
                        <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Bot className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex items-center space-x-1 h-10 px-3 bg-muted/50 rounded-lg">
                                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleSend()
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            placeholder="Ask a question about this document..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading || !fileContent}
                            className="flex-1"
                        />
                        <Button type="submit" size="icon" disabled={loading || !input.trim() || !fileContent}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
