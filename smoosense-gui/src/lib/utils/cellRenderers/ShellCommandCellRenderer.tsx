'use client'

import { useState, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { executeShellCommand } from '@/lib/api/shell'
import { useAppSelector } from '@/lib/hooks'

interface ShellCommandCellRendererProps {
  value: unknown
  columnName?: string
}

const ShellCommandCellRenderer = memo(function ShellCommandCellRenderer({
  value,
  columnName
}: ShellCommandCellRendererProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const tablePath = useAppSelector((state) => state.ui.tablePath)

  if (value === null || value === undefined) {
    return null
  }

  const command = String(value)
  // Remove the 'shell$' prefix to get the actual command
  const actualCommand = command.startsWith('shell$') ? command.slice(6) : command
  const buttonLabel = columnName || 'Run'

  const handleClick = async () => {
    if (isRunning) return

    setIsRunning(true)
    try {
      const result = await executeShellCommand(actualCommand, tablePath || undefined)
      const toastContent = (
        <div className="flex flex-col gap-2">
          {result.returncode !== undefined && (
            <div>Exit code: {result.returncode}</div>
          )}
          {result.stdout && (
            <div className="text-muted-foreground">stdout: {result.stdout.trim()}</div>
          )}
          {result.stderr && (
            <div className="text-destructive">stderr: {result.stderr.trim()}</div>
          )}
        </div>
      )

      if (result.success) {
        toast.success(toastContent)
      } else {
        toast.error(result.error || toastContent)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to execute command')
    } finally {
      setIsRunning(false)
      setHasRun(true)
    }
  }

  return (
    <div className="flex items-center justify-center h-full p-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isRunning}
        className={`h-7 text-xs cursor-pointer ${hasRun ? 'text-muted-foreground' : ''}`}
      >
        {isRunning ? (
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        ) : (
            buttonLabel
        )}
      </Button>
    </div>
  )
})

export default ShellCommandCellRenderer
