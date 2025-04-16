import { useEffect, useRef, useState } from 'react'
import { Player } from '../interfaces/player'

interface DawnStageMafiaRevealProps {
  playerObject: Player
}

const DawnStageMafiaReveal: React.FC<DawnStageMafiaRevealProps> = ({ playerObject }) => {
  const [iAmMafia, setIAmMafia] = useState<boolean>(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchPlayers = async () => {
    try {
      const fetchedPlayers = [
        { label: 'Player 1', address: (await playerObject.day_client.state.global.player1AlgoAddr())!.toString(), number: 1 },
        { label: 'Player 2', address: (await playerObject.day_client.state.global.player2AlgoAddr())!.toString(), number: 2 },
        { label: 'Player 3', address: (await playerObject.day_client.state.global.player3AlgoAddr())!.toString(), number: 3 },
        { label: 'Player 4', address: (await playerObject.day_client.state.global.player4AlgoAddr())!.toString(), number: 4 },
        { label: 'Player 5', address: (await playerObject.day_client.state.global.player5AlgoAddr())!.toString(), number: 5 },
        { label: 'Player 6', address: (await playerObject.day_client.state.global.player6AlgoAddr())!.toString(), number: 6 },
      ]

      setIAmMafia(playerObject.night_algo_address.addr.toString() === (await playerObject.night_client.state.global.mafia())!.toString())
    } catch (error) {
      console.error('Failed to fetch players:', error)
    }
  }

  const startPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    intervalRef.current = setInterval(() => {}, 2800) // Poll every 2.8 seconds
  }

  useEffect(() => {
    // Run fetchPlayers initially when the component is loaded
    fetchPlayers()
    startPolling()
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current) // Cleanup interval on component unmount
      }
    }
  }, [])

  const handleMafiaReveal = async () => {
    await playerObject.night_client.send.dawnStageMafiaReveal({
      args: {
        victimAim: playerObject.target!,
        blinder: playerObject.blinder!,
      },
    })
  }

  return (
    <div>
      <h1>DawnStageMafiaReveal</h1>
      {iAmMafia ? (
        <button
          className="btn btn-primary"
          onClick={() => handleMafiaReveal()} // Pass the correct player number
        >
          Reveal your victim!
        </button>
      ) : (
        <p>You are not the Infiltrator. Wait for the Infiltrator to reveal.</p>
      )}
    </div>
  )
}

export default DawnStageMafiaReveal
