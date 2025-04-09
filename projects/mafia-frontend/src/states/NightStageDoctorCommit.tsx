import { Player } from '../interfaces/player'

interface NightStageDoctorCommitProps {
  playerObject: Player
  refresher: () => void
}

const NightStageDoctorCommit: React.FC<NightStageDoctorCommitProps> = ({ playerObject, refresher }) => {
  return <h1>NightStageDoctorCommit</h1>
}

export default NightStageDoctorCommit
