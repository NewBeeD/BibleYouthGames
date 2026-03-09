import { TimeLineContext } from "../context/BibleContext"
import { useContext } from "react"

export const useTimeLineContext = () => {

  const context = useContext(TimeLineContext)

  if(!context){
    throw Error('useTimeline Context must be used inside of context provider')
  }

  return context
}
