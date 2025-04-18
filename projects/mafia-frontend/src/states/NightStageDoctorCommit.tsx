import algosdk from 'algosdk'
import { createHash, randomBytes } from 'crypto'
import usePlayersState from '../hooks/usePlayerState'
import { Player } from '../interfaces/player'
import { ellipseAddress } from '../utils/ellipseAddress'

interface NightStageDoctorCommitProps {
  playerObject: Player
}

const NightStageDoctorCommit: React.FC<NightStageDoctorCommitProps> = ({ playerObject }) => {
  const { iAmDoctor, players: potentialPatients } = usePlayersState(playerObject)

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
            {potentialPatients.map((player, i) => (
              <li key={i + 1} className="py-2">
                <button
                  className="btn btn-primary"
                  onClick={() => handleDoctorCommit(player)} // Pass the correct player number
                >
                  {`Player: ${i + 1}`}: {ellipseAddress(player)}
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
