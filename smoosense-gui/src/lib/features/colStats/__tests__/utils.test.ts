import { padItems } from '../utils'

describe('colStats utils', () => {
  describe('padItems', () => {
    it('should pad histogram bins to make them continuous', () => {
      const result = padItems({
        min: 0,
        step: 10,
        round_to: 0,
        cntValues: [
          { binIdx: 0, cnt: 100 },
          { binIdx: 2, cnt: 50 },
          { binIdx: 4, cnt: 25 }
        ]
      })

      expect(result).toEqual([
        { binIdx: 0, value: '[0, 10)', binMin: 0, binMax: 10, cnt: 100 },
        { binIdx: 1, value: '[10, 20)', binMin: 10, binMax: 20, cnt: 0 },
        { binIdx: 2, value: '[20, 30)', binMin: 20, binMax: 30, cnt: 50 },
        { binIdx: 3, value: '[30, 40)', binMin: 30, binMax: 40, cnt: 0 },
        { binIdx: 4, value: '[40, 50)', binMin: 40, binMax: 50, cnt: 25 }
      ])
    })

    it('should handle floating point bins with proper rounding', () => {
      const result = padItems({
        min: 0.5,
        step: 0.1,
        round_to: 1,
        cntValues: [
          { binIdx: 0, cnt: 10 },
          { binIdx: 2, cnt: 20 }
        ]
      })

      expect(result).toEqual([
        { binIdx: 0, value: '[0.5, 0.6)', binMin: 0.5, binMax: 0.6, cnt: 10 },
        { binIdx: 1, value: '[0.6, 0.7)', binMin: 0.6, binMax: 0.7, cnt: 0 },
        { binIdx: 2, value: '[0.7, 0.8)', binMin: 0.7, binMax: 0.8, cnt: 20 }
      ])
    })

    it('should handle negative round_to values for larger step sizes', () => {
      const result = padItems({
        min: 0,
        step: 100,
        round_to: -2,
        cntValues: [
          { binIdx: 0, cnt: 5 },
          { binIdx: 1, cnt: 15 }
        ]
      })

      expect(result).toEqual([
        { binIdx: 0, value: '[0, 100)', binMin: 0, binMax: 100, cnt: 5 },
        { binIdx: 1, value: '[100, 200)', binMin: 100, binMax: 200, cnt: 15 }
      ])
    })

    it('should handle empty cntValues array', () => {
      const result = padItems({
        min: 0,
        step: 10,
        round_to: 0,
        cntValues: []
      })

      expect(result).toEqual([
        { binIdx: 0, value: '[0, 10)', binMin: 0, binMax: 10, cnt: 0 }
      ])
    })

    it('should preserve existing data when padding', () => {
      const result = padItems({
        min: 10,
        step: 5,
        round_to: 0,
        cntValues: [
          { binIdx: 1, cnt: 42, customField: 'test' } as { binIdx: number; cnt?: number; customField?: string }
        ]
      })

      expect(result).toEqual([
        { binIdx: 0, value: '[10, 15)', binMin: 10, binMax: 15, cnt: 0 },
        { binIdx: 1, value: '[15, 20)', binMin: 15, binMax: 20, cnt: 42, customField: 'test' }
      ])
    })

    it('should handle single bin correctly', () => {
      const result = padItems({
        min: 5,
        step: 2.5,
        round_to: 1,
        cntValues: [
          { binIdx: 0, cnt: 100 }
        ]
      })

      expect(result).toEqual([
        { binIdx: 0, value: '[5, 7.5)', binMin: 5, binMax: 7.5, cnt: 100 }
      ])
    })

    it('should handle bins with missing counts', () => {
      const result = padItems({
        min: 0,
        step: 1,
        round_to: 0,
        cntValues: [
          { binIdx: 0 }, // no cnt property
          { binIdx: 2, cnt: 15 }
        ]
      })

      expect(result).toEqual([
        { binIdx: 0, value: '[0, 1)', binMin: 0, binMax: 1, cnt: 0 },
        { binIdx: 1, value: '[1, 2)', binMin: 1, binMax: 2, cnt: 0 },
        { binIdx: 2, value: '[2, 3)', binMin: 2, binMax: 3, cnt: 15 }
      ])
    })
  })
})