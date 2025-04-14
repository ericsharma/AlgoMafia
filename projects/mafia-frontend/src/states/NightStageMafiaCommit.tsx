import algosdk from 'algosdk'
import { createHash, randomBytes } from 'crypto'
import { useEffect, useRef, useState } from 'react'
import { Player } from '../interfaces/player'
import { ZERO_ADDRESS } from '../utils/constants'
import { ellipseAddress } from '../utils/ellipseAddress'

interface NightStageMafiaCommitProps {
  playerObject: Player
}

const NightStageMafiaCommit: React.FC<NightStageMafiaCommitProps> = ({ playerObject }) => {
  const [iAmMafia, setIAmMafia] = useState<boolean>(false)
  const [potentialVictims, setPotentialVictims] = useState<{ label: string; address: string; number: number }[]>([])
  const [playerIsDead, setPlayerIsDead] = useState<boolean>(false)
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

      // Get index of the active player
      const activePlayerIndex = fetchedPlayers.findIndex((player) => player.address === playerObject.day_algo_address.addr.toString())
      if (activePlayerIndex === -1) {
        setPlayerIsDead(true)
      }

      // Filter out the active player and zero addresses
      const validPlayers = fetchedPlayers.filter(
        (player) => player.address !== playerObject.day_algo_address.addr.toString() && player.address !== ZERO_ADDRESS,
      )
      setPotentialVictims(validPlayers)
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

  const handleMafiaCommit = async (playerAddress: string) => {
    const mafiaCommitBlinder = randomBytes(32)

    // Hash the concatenated data using sha256
    const mafiaCommitHash = createHash('sha256')
      .update(Buffer.concat([algosdk.decodeAddress(playerAddress).publicKey, mafiaCommitBlinder]))
      .digest()

    playerObject.commitment = mafiaCommitHash
    playerObject.blinder = mafiaCommitBlinder
    playerObject.target = playerAddress

    await playerObject.night_client.send.nightStageMafiaCommit({
      args: {
        commitment: mafiaCommitHash,
      },
    })
  }

  return (
    <div>
      <h1>NightStageMafiaCommit</h1>
      {iAmMafia ? (
        potentialVictims.length > 0 ? (
          <ul className="list-disc list-inside">
            {potentialVictims.map((player) => (
              <li key={player.number} className="py-2">
                <button
                  className="btn btn-primary"
                  onClick={() => handleMafiaCommit(player.address)} // Pass the correct player number
                >
                  {player.label}: {ellipseAddress(player.address)}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Error: No players available to vote for.</p>
        )
      ) : (
        <>
          {playerIsDead ? (
            <p className="py-4">You are out. You cannot vote.</p>
          ) : (
            <p className="py-4">Please wait for the Infiltrator to make their choice..</p>
          )}
        </>
      )}
    </div>
  )
}

export default NightStageMafiaCommit
