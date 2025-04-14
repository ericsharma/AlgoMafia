import { Player } from '../interfaces/player'

interface GameOverProps {
  playerObject: Player
}

const GameOver: React.FC<GameOverProps> = ({ playerObject }) => {
  return <h1>The game is over!</h1>
}

export default GameOver
