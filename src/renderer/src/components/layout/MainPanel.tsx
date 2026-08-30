import React from 'react'
import { ProcessTabBar } from '../processes/ProcessTabBar'
import { ProcessPanel } from '../processes/ProcessPanel'

export function MainPanel(): React.ReactElement {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-app-bg overflow-hidden">
      <ProcessTabBar />
      <ProcessPanel />
    </div>
  )
}
