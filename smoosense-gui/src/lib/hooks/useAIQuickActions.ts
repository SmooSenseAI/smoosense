import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { initializeQuickActions, type AIQuickAction } from '@/lib/features/aiQuickActions/aiQuickActionsSlice'

/**
 * Hook to get AI quick actions based on the current file
 * Automatically initializes quick actions when tablePath changes
 * 
 * @returns Object with quick actions data and state
 */
export function useAIQuickActions() {
  const dispatch = useAppDispatch()
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  
  const aiQuickActionsState = useAppSelector((state) => state.aiQuickActions)
  const { actions, initialized } = aiQuickActionsState
  
  // Initialize quick actions when table path is available
  useEffect(() => {
    if (tablePath && (!initialized || tablePath)) {
      // Reset and reinitialize when tablePath changes
      dispatch(initializeQuickActions({ fileName: tablePath }))
    }
  }, [dispatch, tablePath, initialized])
  
  return {
    quickActions: actions || [],
    initialized: initialized && !!tablePath,
    loading: !tablePath || !initialized,
    hasData: (actions || []).length > 0,
    tablePath
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