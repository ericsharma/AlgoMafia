import algosdk from 'algosdk'
import { createHash, randomBytes } from 'crypto'
import usePlayersState from '../hooks/usePlayerState'
import { Player } from '../interfaces/player'
import { ellipseAddress } from '../utils/ellipseAddress'

interface NightStageMafiaCommitProps {
  playerObject: Player
}

const NightStageMafiaCommit: React.FC<NightStageMafiaCommitProps> = ({ playerObject }) => {
  const { iAmMafia, players: potentialVictims, playerIsDead } = usePlayersState(playerObject)

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
            {potentialVictims.map((player, i) => (
              <li key={i + 1} className="py-2">
                <button
                  className="btn btn-primary"
                  onClick={() => handleMafiaCommit(player)} // Pass the correct player number
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
