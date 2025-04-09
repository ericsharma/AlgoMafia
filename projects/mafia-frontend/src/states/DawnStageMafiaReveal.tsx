import { Player } from '../interfaces/player'

interface DawnStageMafiaRevealProps {
  playerObject: Player
  refresher: () => void
}

const DawnStageMafiaReveal: React.FC<DawnStageMafiaRevealProps> = ({ playerObject, refresher }) => {
  return <h1>DawnStageMafiaReveal</h1>
}

export default DawnStageMafiaReveal
