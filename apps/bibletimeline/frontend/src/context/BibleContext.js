import { createContext, useReducer } from "react";

export const TimeLineContext = createContext()

export const userDataReducer = (state, action) =>{

  switch(action.type){

    case 'SET_DATA':
      return {
        userData: action.payload  
      }
          
    default:
      return state;

  }


}

export const TimeLineContextProvider = ({ children }) => {

  const [state, dispatch] = useReducer(userDataReducer, {
    userData: null
  })

  return (
    <TimeLineContext.Provider value={{...state, dispatch}} >
      { children }
    </TimeLineContext.Provider>
  )
}

