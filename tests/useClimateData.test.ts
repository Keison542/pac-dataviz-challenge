import { expect, test } from 'vitest'
import * as hookModule from '../src/hooks/useClimateData'

test('useClimateData exports expected keys', () => {
  expect(typeof hookModule.useClimateData).toBe('function')
})
