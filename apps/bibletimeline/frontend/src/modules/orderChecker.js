

export const orderChecker = (arr1, arr2) => {

  let eventList = []


  for(let x = 0; x < arr2.length; x++){
    eventList.push(arr2[x].id)
  }

  let bool = arr1.toString() === eventList.toString()
  
  return bool
}
