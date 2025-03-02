import { useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'

import {
  countValueAtom,
  decrementAtom,
  incrementAsyncAtom,
  incrementAtom,
  incrementByAmountAtom,
  incrementIfOddAtom,
} from './counterSlice'

export function Counter() {
  const count = useAtomValue(countValueAtom)
  const increment = useSetAtom(incrementAtom)
  const decrement = useSetAtom(decrementAtom)
  const incrementByAmount = useSetAtom(incrementByAmountAtom)
  const incrementAsync = useSetAtom(incrementAsyncAtom)
  const incrementIfOdd = useSetAtom(incrementIfOddAtom)

  const [incrementAmount, setIncrementAmount] = useState('2')
  const incrementValue = Number(incrementAmount) || 0

  return (
    <div className="p-2">
      <div className="mb-4 flex items-center justify-center">
        <button
          className="ml-1 mr-2 cursor-pointer rounded-[2px] border-2 border-solid border-transparent bg-purple-800/10 px-3 pb-1 text-2xl text-purple-500 outline-none hover:bg-purple-800/20"
          aria-label="Decrement value"
          onClick={() => decrement()}
        >
          -
        </button>
        <span className="mt-0.5 px-4 font-mono text-7xl">{count}</span>
        <button
          className="ml-1 mr-2 cursor-pointer rounded-[2px] border-2 border-solid border-transparent bg-purple-800/10 px-3 pb-1 text-2xl text-purple-500 outline-none hover:bg-purple-800/20"
          aria-label="Increment value"
          onClick={() => increment()}
        >
          +
        </button>
      </div>
      <div className="mb-4 flex items-center justify-center">
        <input
          className="mr-1 w-16 border p-0.5 text-center text-3xl"
          aria-label="Set increment amount"
          value={incrementAmount}
          onChange={(e) => setIncrementAmount(e.target.value)}
        />
        <button
          className="ml-1 mr-2 rounded-[2px] border-2 border-solid border-transparent bg-purple-800/10 px-3 pb-1 text-2xl text-purple-500 outline-none hover:bg-purple-800/20"
          onClick={() => incrementByAmount(incrementValue)}
        >
          Add Amount
        </button>
        <button
          className="ml-1 mr-2 rounded-[2px] border-2 border-solid border-transparent bg-purple-800/10 px-3 pb-1 text-2xl text-purple-500 outline-none hover:bg-purple-800/20"
          onClick={() => incrementAsync(incrementValue)}
        >
          Add Async
        </button>
        <button
          className="ml-1 mr-2 rounded-[2px] border-2 border-solid border-transparent bg-purple-800/10 px-3 pb-1 text-2xl text-purple-500 outline-none hover:bg-purple-800/20"
          onClick={() => incrementIfOdd(incrementValue)}
        >
          Add If Odd
        </button>
      </div>
    </div>
  )
}
