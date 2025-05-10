import { Button } from "./button"
import { AlertCircle } from "lucide-react"

interface ErrorStateProps {
  error: Error
  onRetry?: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
      <AlertCircle className="h-6 w-6 text-destructive" />
      <div className="space-y-2">
        <h3 className="font-medium text-destructive">Error Loading Data</h3>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-2"
        >
          Try Again
        </Button>
      )}
    </div>
  )
} 