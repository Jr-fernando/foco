import { describe, it, expect } from 'vitest'
import { registerActivity, newMilestonesReached, type StreakState } from './streak'

const empty: StreakState = { currentStreak: 0, longestStreak: 0, lastActiveDate: null }

describe('registerActivity', () => {
  it('inicia streak em 1 no primeiro registro', () => {
    const result = registerActivity(empty, '2026-08-01')
    expect(result.currentStreak).toBe(1)
    expect(result.longestStreak).toBe(1)
  })

  it('incrementa quando o dia é consecutivo', () => {
    const day1 = registerActivity(empty, '2026-08-01')
    const day2 = registerActivity(day1, '2026-08-02')
    expect(day2.currentStreak).toBe(2)
  })

  it('é idempotente: registrar duas vezes no mesmo dia não duplica', () => {
    const day1 = registerActivity(empty, '2026-08-01')
    const day1Again = registerActivity(day1, '2026-08-01')
    expect(day1Again.currentStreak).toBe(1)
  })

  it('reseta para 1 (não para 0) quando pula um ou mais dias', () => {
    const day1 = registerActivity(empty, '2026-08-01')
    const day5 = registerActivity(day1, '2026-08-05')
    expect(day5.currentStreak).toBe(1)
  })

  it('preserva o recorde (longestStreak) mesmo após reset', () => {
    let state = empty
    for (const day of ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04']) {
      state = registerActivity(state, day)
    }
    expect(state.currentStreak).toBe(4)
    const afterGap = registerActivity(state, '2026-08-10')
    expect(afterGap.currentStreak).toBe(1)
    expect(afterGap.longestStreak).toBe(4)
  })
})

describe('newMilestonesReached', () => {
  it('detecta um marco cruzado entre dois valores', () => {
    expect(newMilestonesReached(2, 3)).toEqual([3])
  })

  it('não repete marco já alcançado antes', () => {
    expect(newMilestonesReached(3, 3)).toEqual([])
  })

  it('detecta múltiplos marcos se o streak pular (ex: import de dados antigos)', () => {
    expect(newMilestonesReached(1, 10)).toEqual([3, 7])
  })

  it('não detecta nada se ainda não chegou no primeiro marco', () => {
    expect(newMilestonesReached(1, 2)).toEqual([])
  })
})
