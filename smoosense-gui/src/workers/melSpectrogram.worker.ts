// Web Worker for computing mel-spectrogram in background thread

interface ComputeMessage {
  type: 'compute'
  samples: Float32Array
  sampleRate: number
  nFft: number
  winLength: number
  hopLength: number
  fMin: number
  fMax: number
  nMels: number
  topDb: number
}

interface ResultMessage {
  type: 'result'
  data: number[][]
}

interface ErrorMessage {
  type: 'error'
  error: string
}

self.onmessage = async (e: MessageEvent<ComputeMessage>) => {
  try {
    const {
      samples,
      sampleRate,
      nFft,
      winLength,
      hopLength,
      fMin,
      fMax,
      nMels,
      topDb
    } = e.data

    // Import and initialize WASM module
    const wasmModule = await import('rust-melspec-wasm')
    await wasmModule.default()

    // Compute mel-spectrogram
    const sxx = wasmModule.mel_spectrogram_db(
      sampleRate,
      samples,
      nFft,
      winLength,
      hopLength,
      fMin,
      fMax,
      nMels,
      topDb
    )

    // Send result back to main thread
    const result: ResultMessage = {
      type: 'result',
      data: sxx
    }
    self.postMessage(result)
  } catch (error) {
    // Send error back to main thread
    const errorMsg: ErrorMessage = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    self.postMessage(errorMsg)
  }
}

export {}
