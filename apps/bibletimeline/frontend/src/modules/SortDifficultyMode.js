export const sortDifficultyMode = (dataPoints, arrow, gameMode, difficultyMode, gameType = 'classic') => {

  // ascending
  // homes.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

  // descending
  // homes.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));

  let newScores = dataPoints.filter(modeName => modeName.mode === gameMode && modeName.gameType === gameType)

  if(difficultyMode === 'easy'){

    if(arrow.easy){

      newScores.sort((a, b) => parseFloat(a.easy) - parseFloat(b.easy));
    }
    else{

      newScores.sort((a, b) => parseFloat(b.easy) - parseFloat(a.easy));
    }

  }

  else if(difficultyMode === 'medium'){

    if(arrow.medium){

      newScores.sort((a, b) => parseFloat(a.medium) - parseFloat(b.medium));
    }
    else{

      newScores.sort((a, b) => parseFloat(b.medium) - parseFloat(a.medium));
    }

  }

  else if(difficultyMode === 'hard'){

    if(arrow.hard){

      newScores.sort((a, b) => parseFloat(a.hard) - parseFloat(b.hard));
    }
    else{

      newScores.sort((a, b) => parseFloat(b.hard) - parseFloat(a.hard));
    }

  }

  else if(difficultyMode === 'wins'){

    if(arrow.wins){

      newScores.sort((a, b) => parseFloat(a.wins) - parseFloat(b.wins));
    }
    else{

      newScores.sort((a, b) => parseFloat(b.wins) - parseFloat(a.wins));
    }

  }

  else if(difficultyMode === 'totalPoints'){

    if(arrow.totalPoints){

      newScores.sort((a, b) => parseFloat(a.totalPoints) - parseFloat(b.totalPoints));
    }
    else{

      newScores.sort((a, b) => parseFloat(b.totalPoints) - parseFloat(a.totalPoints));
    }

  }

  else if(difficultyMode === 'bestMatch'){

    if(arrow.bestMatch){

      newScores.sort((a, b) => parseFloat(a.bestMatch) - parseFloat(b.bestMatch));
    }
    else{

      newScores.sort((a, b) => parseFloat(b.bestMatch) - parseFloat(a.bestMatch));
    }

  }
  
  return newScores
}
