
export default function breakPoint(width){

  if(width > 1536){ return 180 }
  if(width > 1200){ return 150 }
  if(width > 900){ return 120 }
  if(width > 600){ return 100 }
  return 80
}