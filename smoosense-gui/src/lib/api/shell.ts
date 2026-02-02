import { API_PREFIX } from '@/lib/utils/urlUtils'

export interface ShellCommandResult {
  success: boolean
  message?: string
  error?: string
  stdout?: string
  stderr?: string
  returncode?: number
}

export async function executeShellCommand(command: string, tablePath?: string): Promise<ShellCommandResult> {
  if (!command.trim()) {
    return { success: false, error: 'Command cannot be empty' }
  }

  try {
    const response = await fetch(`${API_PREFIX}/shell`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command, tablePath }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error || `HTTP error: ${response.status}`,
      }
    }

    const data = await response.json()
    return {
      success: data.success,
      message: data.message,
      error: data.error,
      stdout: data.stdout,
      stderr: data.stderr,
      returncode: data.returncode,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}
