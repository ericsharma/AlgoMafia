import { useEffect, useState, useRef } from 'react'
import { Player } from '../interfaces/player'

interface DawnStageUnmaskingProps {
  playerObject: Player
  refresher: () => void
}

const DawnStageUnmasking: React.FC<DawnStageUnmaskingProps> = ({ playerObject, refresher }) => {
  const [iAmEliminated, setIAmEliminated] = useState<boolean>(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)


  const fetchElimiantedPlayers = async () => {
    const justElimiantedPlayer = await playerObject.day_client.state.global.justEliminatedPlayer()

    if (playerObject.day_algo_address.addr.toString() === justElimiantedPlayer) {
      setIAmEliminated(true)
    }

  }

  // Fetch the eliminated players from the contract
  useEffect(() => {
    fetchElimiantedPlayers()
  }, [])


  const handleDawnStageUnmasking = async () => {
    await playerObject.day_client
      .newGroup()
      .dawnStageUnmasking({ args: { blsSk: playerObject.bls_private_key } })
      .dummyOpUp({
        args: { i: 1 },
      })
      .dummyOpUp({
        args: { i: 2 },
      })
      .dummyOpUp({
        args: { i: 3 },
      })
      .dummyOpUp({
        args: { i: 4 },
      })
      .dummyOpUp({
        args: { i: 5 },
      })
      .dummyOpUp({
        args: { i: 6 },
      })
      .dummyOpUp({
        args: { i: 7 },
      })
      .dummyOpUp({
        args: { i: 8 },
      })
      .dummyOpUp({
        args: { i: 9 },
      })
      .dummyOpUp({
        args: { i: 10 },
      })
      .dummyOpUp({
        args: { i: 11 },
      })
      .dummyOpUp({
        args: { i: 12 },
      })
      .send();
  }

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


  return (
    <div>
      <h1>DawnStageUnmasking</h1>

      {iAmEliminated ? (
        <>
          <h2>You've been eliminated!</h2>
          <p>Press the button to unmask yourself...</p>
          <button className="btn m-2" onClick={handleDawnStageUnmasking}>
            Unmask
          </button>
        </>
      ) : (
        <p>Waiting for eliminated player to unmask themselves...</p>
      )}

    </div>
  )

}

export default DawnStageUnmasking
