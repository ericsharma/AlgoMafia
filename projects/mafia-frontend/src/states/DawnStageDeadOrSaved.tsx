import { Player } from '../interfaces/player'

interface DawnStageDeadOrSaveProps {
  playerObject: Player
  refresher: () => void
}

const DawnStageDeadOrSave: React.FC<DawnStageDeadOrSaveProps> = ({ playerObject, refresher }) => {
  return <h1>DawnStageDeadOrSave</h1>
}

export default DawnStageDeadOrSave
