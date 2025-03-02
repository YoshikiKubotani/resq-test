import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { fetchCount } from './counterAPI'

export interface CounterState {
  value: number
  status: 'idle' | 'loading' | 'failed'
}

// 永続化されたカウンター状態のアトム
export const counterAtom = atomWithStorage<CounterState>('counter', {
  value: 0,
  status: 'idle',
})

// 値を取得するための派生アトム
export const countValueAtom = atom((get) => get(counterAtom).value)

// アクション用の派生アトム
export const incrementAtom = atom(null, (get, set) => {
  const counter = get(counterAtom)
  set(counterAtom, { ...counter, value: counter.value + 1 })
})

export const decrementAtom = atom(null, (get, set) => {
  const counter = get(counterAtom)
  set(counterAtom, { ...counter, value: counter.value - 1 })
})

export const incrementByAmountAtom = atom(null, (get, set, amount: number) => {
  const counter = get(counterAtom)
  set(counterAtom, { ...counter, value: counter.value + amount })
})

// 非同期アクション
export const incrementAsyncAtom = atom(
  null,
  async (get, set, amount: number) => {
    const counter = get(counterAtom)
    set(counterAtom, { ...counter, status: 'loading' })

    try {
      const response = await fetchCount(amount)
      set(counterAtom, {
        value: counter.value + response.data,
        status: 'idle',
      })
    } catch (_error) {
      set(counterAtom, { ...counter, status: 'failed' })
    }
  }
)

// 条件付きアクション
export const incrementIfOddAtom = atom(null, (get, set, amount: number) => {
  const counter = get(counterAtom)
  if (counter.value % 2 === 1) {
    set(counterAtom, { ...counter, value: counter.value + amount })
  }
})
