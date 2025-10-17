import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { initializeQuickActions, type AIQuickAction } from '@/lib/features/aiQuickActions/aiQuickActionsSlice'

/**
 * Hook to get AI quick actions based on the current file
 * Automatically initializes quick actions when filePath changes
 * 
 * @returns Object with quick actions data and state
 */
export function useAIQuickActions() {
  const dispatch = useAppDispatch()
  const filePath = useAppSelector((state) => state.ui.filePath)
  
  const aiQuickActionsState = useAppSelector((state) => state.aiQuickActions)
  const { actions, initialized } = aiQuickActionsState
  
  // Initialize quick actions when file path is available
  useEffect(() => {
    if (filePath && (!initialized || filePath)) {
      // Reset and reinitialize when filePath changes
      dispatch(initializeQuickActions({ fileName: filePath }))
    }
  }, [dispatch, filePath, initialized])
  
  return {
    quickActions: actions || [],
    initialized: initialized && !!filePath,
    loading: !filePath || !initialized,
    hasData: (actions || []).length > 0,
    filePath
  }
}

/**
 * Hook to execute a quick action by dispatching its redux actions
 * 
 * @returns Function to execute a quick action
 */
export function useExecuteQuickAction() {
  const dispatch = useAppDispatch()
  
  return (quickAction: AIQuickAction) => {
    quickAction.actions.forEach(action => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dispatch(action as any)
    })
  }
}