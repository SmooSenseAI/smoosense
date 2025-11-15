declare module 'colormap' {
  export interface ColormapOptions {
    colormap?: string
    nshades?: number
    format?: 'hex' | 'rgb' | 'rgba' | 'rgbaString'
    alpha?: number | number[]
  }

  export default function colormap(options: ColormapOptions): number[][] | string[]
}
