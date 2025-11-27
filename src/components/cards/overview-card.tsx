import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import type { MonitoringOverviewResponse } from "@/services/neo-api"

interface OverviewCardProps {
    overview: MonitoringOverviewResponse | null
    title?: string
    description?: string
}

export function OverviewCard({
    overview,
    title = "Monitoring Overview",
    description = "Real-time monitoring data for NetApp Neo operations. Auto-refreshes every 60 seconds."
}: OverviewCardProps) {
    return (
        <Card className="md:col-span-2 lg:col-span-4">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    {title}
                </CardTitle>
                <CardDescription>
                    {description}
                    {overview?.timestamp && (
                        <span className="block mt-1">
                            Last updated (UTC): {new Date(overview.timestamp).toLocaleString()}
                        </span>
                    )}
                </CardDescription>
            </CardHeader>
        </Card>
    )
}
