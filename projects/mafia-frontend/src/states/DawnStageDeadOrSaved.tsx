import React, { useEffect, useRef } from 'react'
import { Player } from '../interfaces/player'

interface DawnStageDeadOrSaveProps {
  playerObject: Player
}

const DawnStageDeadOrSave: React.FC<DawnStageDeadOrSaveProps> = ({ playerObject }) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const startPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    intervalRef.current = setInterval(() => {}, 2800) // Poll every 2.8 seconds
  }

  useEffect(() => {
    startPolling()
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current) // Cleanup interval on component unmount
      }
    }
  }, [])

  const handleDeadOrSave = async () => {
    const eliminateResults = await playerObject.day_client.send.dawnStageDeadOrSaved()

    console.log(eliminateResults)
  }
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold">Dawn Stage: Dead Or Saved?</h1>

      <p>.</p>

      <button className="btn btn-primary" onClick={() => handleDeadOrSave()}>
        <p>Someone must press the button to proceed.</p>
      </button>
    </div>
  )
}

export default DawnStageDeadOrSave
