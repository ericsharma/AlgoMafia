import { Player } from '../interfaces/player'

interface DawnStageDoctorRevealProps {
  playerObject: Player
  refresher: () => void
}

const DawnStageDoctorReveal: React.FC<DawnStageDoctorRevealProps> = ({ playerObject, refresher }) => {
  return <h1>DawnStageDoctorReveal</h1>
}

export default DawnStageDoctorReveal
