import { useWallet } from '@txnlab/use-wallet-react'
import algosdk from 'algosdk'
import { createHash, randomBytes } from 'crypto'
import PlayerPickPanel from '../components/PlayerPickPanel'
import { createStorageKey, savePlayerData } from '../db/playerStore'
import usePlayersState from '../hooks/usePlayerState'
import { Player } from '../interfaces/player'

interface NightStageMafiaCommitProps {
  playerObject: Player
}

const NightStageMafiaCommit: React.FC<NightStageMafiaCommitProps> = ({ playerObject }) => {
  const { iAmMafia, players: potentialVictims, playerIsDead } = usePlayersState(playerObject)

  const { activeAddress } = useWallet()

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
    // after succesfully commiting to nightClient we update the playerObject in IDB to save the latest blinder, target, and commitment
    const storageKey = createStorageKey(activeAddress!, playerObject.night_client.appId)
    const idbPlayer = await playerObject.toIDB()
    await savePlayerData(storageKey, idbPlayer)
  }

  return (
    <div>
      <h1>NightStageMafiaCommit</h1>
      {iAmMafia ? (
        potentialVictims.length > 0 ? (
          <PlayerPickPanel
            players={potentialVictims}
            currentPlayerAddress={playerObject.day_algo_address.addr.toString()}
            onSelect={(player: string) => {
              handleMafiaCommit(player)
            }}
          />
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
