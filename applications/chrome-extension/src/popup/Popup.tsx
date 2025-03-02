import { Counter } from '../app/features/counter'

const Popup = () => {
  document.body.className = 'w-[30rem] h-[15rem]'

  return (
    <>
      <div className="mt-2 flex justify-center text-base">Popup Counter</div>
      <Counter />
    </>
  )
}

export default Popup
