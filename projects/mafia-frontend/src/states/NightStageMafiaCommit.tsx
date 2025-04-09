import { useEffect, useRef, useState } from 'react'
import { Player } from '../interfaces/player'

interface NightStageMafiaCommitProps {
  playerObject: Player
  refresher: () => void
}

const NightStageMafiaCommit: React.FC<NightStageMafiaCommitProps> = ({ playerObject, refresher }) => {
  const [iAmMafia, setIAmMafia] = useState<boolean>(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchPlayers = async () => {
    try {
      const fetchedPlayers = [
        (await playerObject.day_client.state.global.player1AlgoAddr())!.toString(),
        (await playerObject.day_client.state.global.player2AlgoAddr())!.toString(),
        (await playerObject.day_client.state.global.player3AlgoAddr())!.toString(),
        (await playerObject.day_client.state.global.player4AlgoAddr())!.toString(),
        (await playerObject.day_client.state.global.player5AlgoAddr())!.toString(),
        (await playerObject.day_client.state.global.player6AlgoAddr())!.toString(),
      ]

      const playerHasVoted = [
        (await playerObject.day_client.state.global.player1HasVoted())!,
        (await playerObject.day_client.state.global.player2HasVoted())!,
        (await playerObject.day_client.state.global.player3HasVoted())!,
        (await playerObject.day_client.state.global.player4HasVoted())!,
        (await playerObject.day_client.state.global.player5HasVoted())!,
        (await playerObject.day_client.state.global.player6HasVoted())!,
      ]

      // get index of the active player
      const activePlayerIndex = fetchedPlayers.findIndex((player) => player === playerObject.day_algo_address.addr.toString())


      // Filter out any players that are equal to the zeroAddress or the activeAddress
      const validPlayers = fetchedPlayers.filter(
        (player) => player !== playerObject.day_algo_address.addr.toString()
      )
    } catch (error) {
      console.error('Failed to fetch players:', error)
    }
  }

  const startPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    intervalRef.current = setInterval(() => {
      refresher()
    }, 2800) // Poll every 2.8 seconds
  }

  const handleVote = async (playerNumber: number) => {
    console.log(`Voted for player ${playerNumber}`)

    const voteResult = await playerObject.day_client.send.dayStageVote({
      args: {
        vote: playerNumber
      }
    })

    console.log('Vote result:', voteResult)

    fetchPlayers() // Refresh the players list after voting
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


  const handleMafiaCommit = async () => { }

  return (

    <div>

      <h1>NightStageMafiaCommit</h1>

      {
        true ? (
          <>
            <h2>Infiltrator!</h2>
            <p>Wakey wakey. Who will you target?</p>
            <button className="btn m-2" onClick={handleMafiaCommit}>
              Unmask
            </button>
          </>
        ) : (
          <p>You are asleep...</p>
        )
      }
    </div>
  )
}

export default NightStageMafiaCommit
