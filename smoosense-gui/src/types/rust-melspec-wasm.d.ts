declare module 'rust-melspec-wasm' {
  export default function init(): Promise<void>

  export function mel_spectrogram_db(
    sample_rate: number,
    audio_samples: Float32Array,
    n_fft: number,
    win_length: number,
    hop_length: number,
    f_min: number,
    f_max: number,
    n_mels: number,
    top_db: number
  ): number[][]
}
