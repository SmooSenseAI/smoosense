'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppDispatch } from '@/lib/hooks'
import { setRootFolder } from '@/lib/features/ui/uiSlice'

function FolderUrlParamsProviderInner({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlRootFolder = searchParams.get('rootFolder')
    dispatch(setRootFolder(urlRootFolder))
  }, [searchParams, dispatch])

  return <>{children}</>
}

export default function FolderUrlParamsProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FolderUrlParamsProviderInner>{children}</FolderUrlParamsProviderInner>
    </Suspense>
  )
}