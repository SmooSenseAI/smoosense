import { configureStore } from '@reduxjs/toolkit'
import uiReducer from '../uiSlice'

interface TestStore {
  ui: {
    debugMode: boolean
    activeTab: string
    cropMediaToFitCover: boolean
    galleryVideoMuted: boolean
    autoPlayAllVideos: boolean
    showRowDetailsPanel: boolean
  }
}

describe('uiSlice', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any

  beforeEach(() => {
    store = configureStore({
      reducer: {
        ui: uiReducer
      }
    })
  })

  it('should have correct initial state values', () => {
    const state = (store.getState() as TestStore).ui

    expect(state.debugMode).toBe(false)
    expect(state.activeTab).toBe('Table')
    expect(state.cropMediaToFitCover).toBe(true)
    expect(state.galleryVideoMuted).toBe(true)
    expect(state.autoPlayAllVideos).toBe(true)
    expect(state.showRowDetailsPanel).toBe(true)
  })
})