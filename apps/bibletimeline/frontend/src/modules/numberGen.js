import { oldTestamentEvents, newTestamentEvents, allData } from "../data/csvjson"

export const numberGen = (oldOrNewTestament, difficultySettings) => {

 
  // const [oldTest, newTest] = [0, 473];
  let list = [];

  // let bool = true;

  let events = [];
  let start_point = 0;
  let end_point = 0;

  if(oldOrNewTestament === 1){
    start_point = 0;
    end_point = oldTestamentEvents.length - 1;
  }
  else if( oldOrNewTestament === 2){
    start_point = 0;
    end_point = newTestamentEvents.length - 1;
  }
  else{
    start_point = 0;
    end_point = allData.length - 1;
  }


  function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  function arrGen(){

    const maxUnique = end_point - start_point + 1
    const targetLength = Math.min(difficultySettings, maxUnique)

    while(list.length < targetLength){

      let randomNum = randomIntFromInterval(start_point, end_point)

      if(!list.includes(randomNum)){list.push(randomNum)}
  
    }
  }



  function eventsAssembler(arr){   


    for(let i = 0; i < arr.length; i++){

      switch(oldOrNewTestament){
        case 1:
          if(oldTestamentEvents[arr[i]]){
            events.push(oldTestamentEvents[arr[i]])
          }
          break;
        
        case 2:
          if(newTestamentEvents[arr[i]]){
            events.push(newTestamentEvents[arr[i]])
          }
          break;
        
        default:
          if(allData[arr[i]]){
            events.push(allData[arr[i]])
          }
          break;
      }

    }
}
 

  function eventsFinder(){

    arrGen()
    eventsAssembler(list)
  }

  eventsFinder()

  return events;
  
}
