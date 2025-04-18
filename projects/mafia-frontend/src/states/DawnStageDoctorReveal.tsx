import usePlayersState from '../hooks/usePlayerState'
import { Player } from '../interfaces/player'

interface DawnStageDoctorRevealProps {
  playerObject: Player
}

const DawnStageDoctorReveal: React.FC<DawnStageDoctorRevealProps> = ({ playerObject }) => {
  const { iAmDoctor } = usePlayersState(playerObject)

  const handleDoctorReveal = async () => {
    await playerObject.night_client.send.dawnStageDoctorReveal({
      args: {
        patientAim: playerObject.target!,
        blinder: playerObject.blinder!,
      },
    })
  }

  return (
    <div>
      <h1>DawnStageDoctorReveal</h1>
      {iAmDoctor ? (
        <button
          className="btn btn-primary"
          onClick={() => handleDoctorReveal()} // Pass the correct player number
        >
          Reveal your patient!
        </button>
      ) : (
        <p>You are not the Double Agent. Wait for the Double Agent to reveal.</p>
      )}
    </div>
  )
}

export default DawnStageDoctorReveal
