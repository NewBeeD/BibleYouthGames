

export const solution = (order, events) => {
  const eventSolution = [...events]
    .filter((eventItem) => eventItem && typeof eventItem.id !== 'undefined')
    .sort((first, second) => first.id - second.id)

  return eventSolution
}

