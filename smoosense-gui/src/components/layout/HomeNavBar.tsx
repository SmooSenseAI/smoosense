'use client'

import NavbarSkeleton from './NavbarSkeleton'

export default function HomeNavBar() {
  // Message component for the center
  const centerMessage = (
    <div className="text-lg text-muted-foreground font-medium">
      Make sense of your data — smooth, deep, multimodal.
    </div>
  )

  return (
    <NavbarSkeleton
      tabList={centerMessage}
      iconButtons={[]}
    />
  )
}