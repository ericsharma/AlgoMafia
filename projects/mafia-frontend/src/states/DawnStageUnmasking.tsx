import { Player } from '../interfaces/player'

interface DawnStageUnmaskingProps {
  playerObject: Player
  refresher: () => void
}

const DawnStageUnmasking: React.FC<DawnStageUnmaskingProps> = ({ playerObject, refresher }) => {

  return <h1>DawnStageUnmasking</h1>
}

export default DawnStageUnmasking
