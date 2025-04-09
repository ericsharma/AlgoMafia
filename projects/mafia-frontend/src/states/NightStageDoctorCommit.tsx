import { useEffect, useRef, useState } from 'react'
import { Player } from '../interfaces/player'
import { createHash, randomBytes } from 'crypto'
import algosdk from 'algosdk'
import { ellipseAddress } from '../utils/ellipseAddress'
import { ZERO_ADDRESS } from '../utils/constants'

interface NightStageDoctorCommitProps {
  playerObject: Player
  refresher: () => void
}

const NightStageDoctorCommit: React.FC<NightStageDoctorCommitProps> = ({ playerObject, refresher }) => {
  const [iAmDoctor, setIAmDoctor] = useState<boolean>(false)
  const [potentialPatients, setpotentialPatients] = useState<{ label: string; address: string; number: number }[]>([])
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

      setIAmDoctor(playerObject.night_algo_address.addr.toString() === (await playerObject.night_client.state.global.doctor())!.toString())

      // Filter out the active player and zero addresses
      const validPlayers = fetchedPlayers.filter((player) => player.address !== ZERO_ADDRESS)
      setpotentialPatients(validPlayers)
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

  const handleDoctorCommit = async (playerAddress: string) => {
    const DoctorCommitBlinder = randomBytes(32)

    // Hash the concatenated data using sha256
    const DoctorCommitHash = createHash('sha256')
      .update(Buffer.concat([algosdk.decodeAddress(playerAddress).publicKey, DoctorCommitBlinder]))
      .digest()

    playerObject.commitment = DoctorCommitHash
    playerObject.blinder = DoctorCommitBlinder
    playerObject.target = playerAddress

    await playerObject.night_client.send.nightStageDoctorCommit({
      args: {
        commitment: DoctorCommitHash,
      },
    })
  }

  return (
    <div>
      <h1>NightStageDoctorCommit</h1>
      {iAmDoctor ? (
        potentialPatients.length > 0 ? (
          <ul className="list-disc list-inside">
            {potentialPatients.map((player) => (
              <li key={player.number} className="py-2">
                <button
                  className="btn btn-primary"
                  onClick={() => handleDoctorCommit(player.address)} // Pass the correct player number
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
        <p>You are not the Double Agent. Wait for the Double Agent to commit.</p>
      )}
    </div>
  )
}

export default NightStageDoctorCommit
