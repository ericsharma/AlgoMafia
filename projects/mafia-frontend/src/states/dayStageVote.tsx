import React, { useEffect, useRef, useState } from 'react'
import { Player } from '../interfaces/player'
import { ZERO_ADDRESS } from '../utils/constants'
import { ellipseAddress } from '../utils/ellipseAddress'

interface DayStageVoteProps {
  playerObject: Player
}

const DayStageVote: React.FC<DayStageVoteProps> = ({ playerObject }) => {
  const [players, setPlayers] = useState<{ label: string; address: string; number: number }[]>([])
  const [playerHasVoted, setPlayerHasVoted] = useState<boolean>(false)
  const [playerIsDead, setPlayerIsDead] = useState<boolean>(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // TODO: break this kind of stuff out so that the stages can reuse the listing of players
  // and choosing between them.
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

      const playerHasVoted = [
        (await playerObject.day_client.state.global.player1HasVoted())!,
        (await playerObject.day_client.state.global.player2HasVoted())!,
        (await playerObject.day_client.state.global.player3HasVoted())!,
        (await playerObject.day_client.state.global.player4HasVoted())!,
        (await playerObject.day_client.state.global.player5HasVoted())!,
        (await playerObject.day_client.state.global.player6HasVoted())!,
      ]

      // Get index of the active player
      const activePlayerIndex = fetchedPlayers.findIndex((player) => player.address === playerObject.day_algo_address.addr.toString())
      if (activePlayerIndex === -1) {
        setPlayerIsDead(true)
      }

      setPlayerHasVoted(Number(playerHasVoted[activePlayerIndex]) !== 0)

      // Filter out the active player and zero addresses
      const validPlayers = fetchedPlayers.filter(
        (player) => player.address !== playerObject.day_algo_address.addr.toString() && player.address !== ZERO_ADDRESS,
      )
      setPlayers(validPlayers)
    } catch (error) {
      console.error('Failed to fetch players:', error)
    }
  }

  useEffect(() => {
    // Run fetchPlayers initially when the component is loaded
    fetchPlayers()
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current) // Cleanup interval on component unmount
      }
    }
  }, [])

  const handleVote = async (playerNumber: number) => {
    console.log(`Voted for player ${playerNumber}`)

    const voteResult = await playerObject.day_client.send.dayStageVote({
      args: {
        vote: playerNumber,
      },
    })

    console.log('Vote result:', voteResult)

    fetchPlayers() // Refresh the players list after voting
  }

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold">Day Stage: Vote</h1>

      {playerHasVoted ? (
        <>
          {playerIsDead ? (
            <p className="py-4"> You are out. You cannot vote.</p>
          ) : (
            <p className="py-4">You have already voted. Please wait.</p>
          )}
        </>
      ) : (
        <>
          <p className="py-4">Who do you want to vote for?</p>
          {players.length > 0 ? (
            <ul className="list-disc list-inside">
              {players.map((player) => (
                <li key={player.number} className="py-2">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleVote(player.number)} // Pass the correct player number
                  >
                    {player.label}: {ellipseAddress(player.address)}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Error: No players available to vote for.</p>
          )}
        </>
      )}
    </div>
  )
}

export default DayStageVote
