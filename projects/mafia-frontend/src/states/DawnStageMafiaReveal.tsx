import usePlayersState from '../hooks/usePlayerState'
import { Player } from '../interfaces/player'

interface DawnStageMafiaRevealProps {
  playerObject: Player
}

const DawnStageMafiaReveal: React.FC<DawnStageMafiaRevealProps> = ({ playerObject }) => {
  const { iAmMafia } = usePlayersState(playerObject)
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
