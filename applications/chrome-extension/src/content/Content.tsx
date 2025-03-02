import { Counter } from '../app/features/counter'

const Content = () => {
  return (
    <div className="fixed bottom-2 right-2 z-[999] border bg-white opacity-10 shadow-xl">
      <div className="mt-2 flex justify-center text-base">カウンター</div>
      <Counter />
    </div>
  )
}

export default Content
