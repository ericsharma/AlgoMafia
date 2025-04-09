import { Player } from '../interfaces/player'

interface GameOverProps {
  playerObject: Player
  refresher: () => void
}

const GameOver: React.FC<GameOverProps> = ({ playerObject, refresher }) => {
  return <h1>The game is over!</h1>
}

export default GameOver
