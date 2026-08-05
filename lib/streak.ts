// Lógica de streak espelhada em TS para ser testável em CI sem subir um Postgres.
// A fonte da verdade em produção é a função SQL register_activity() —
// isso aqui existe para termos testes rápidos e documentação executável
// da regra de negócio. Se mudar uma, muda a outra.

export type StreakState = {
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null // YYYY-MM-DD
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z')
  const db = new Date(b + 'T00:00:00Z')
  return Math.round((db.getTime() - da.getTime()) / 86_400_000)
}

export function registerActivity(state: StreakState, today: string): StreakState {
  if (state.lastActiveDate === today) {
    return state // idempotente: já contou hoje
  }

  if (!state.lastActiveDate) {
    return { currentStreak: 1, longestStreak: Math.max(1, state.longestStreak), lastActiveDate: today }
  }

  const gap = daysBetween(state.lastActiveDate, today)
  const currentStreak = gap === 1 ? state.currentStreak + 1 : 1

  return {
    currentStreak,
    longestStreak: Math.max(state.longestStreak, currentStreak),
    lastActiveDate: today,
  }
}

export const MILESTONES = [3, 7, 14, 30, 60, 100] as const

export function newMilestonesReached(previousStreak: number, newStreak: number): number[] {
  return MILESTONES.filter((m) => newStreak >= m && previousStreak < m)
}
