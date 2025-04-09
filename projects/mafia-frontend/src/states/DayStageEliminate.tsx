import React, { useEffect, useRef } from 'react'
import { Player } from '../interfaces/player'

interface DayStageEliminateProps {
  playerObject: Player
  refresher: () => void
}

const DayStageEliminate: React.FC<DayStageEliminateProps> = ({ playerObject, refresher }) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const startPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    intervalRef.current = setInterval(() => {
      refresher()
    }, 2800) // Poll every 2.8 seconds
  }

  useEffect(() => {
    startPolling()
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current) // Cleanup interval on component unmount
      }
    }
  }, [])


  const handleEliminate = async () => {

    const eliminateResults = await playerObject.day_client.send.dayStageEliminate()

    console.log(eliminateResults)
  }
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold">Day Stage: Call Eliminate</h1>

      <p>You have finished voting.</p>

      <button
        className="btn btn-primary"
        onClick={() => handleEliminate()}
      >
        <p>Someone must press the button to proceed.</p>
      </button>
    </div>
  )
}

export default DayStageEliminate
