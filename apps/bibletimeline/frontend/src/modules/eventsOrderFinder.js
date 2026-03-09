

export const eventsCheck = (arr) => {

  let correctList = [];

  for(let x = 0; x < arr.length; x++){
    if(arr[x] && typeof arr[x].id !== 'undefined'){
      correctList.push(arr[x].id)
    }
  }

  correctList.sort(function(a, b) {
    return a - b;
  })

  return correctList;
}