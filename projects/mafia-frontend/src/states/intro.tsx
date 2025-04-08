import React, { useState } from 'react'
import { GameState } from '../interfaces/gameState'

interface IntroProps {
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
  setAppId: React.Dispatch<React.SetStateAction<bigint>>
}

const Intro: React.FC<IntroProps> = ({ setGameState, setAppId }) => {
  const [inputAppId, setInputAppId] = useState<string>('')

  const handleProceed = () => {
    if (inputAppId.trim()) {
      setAppId(BigInt(inputAppId))
      setGameState(GameState.JoinGameLobby)
    } else {
      alert('Please provide a valid App ID.')
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-4xl font-bold">Welcome, Resistance Fighters.</h1>
      <p className="py-2">
        The Resistance is on the brink of collapse. A spy lurks among you, sabotaging your efforts from the shadows. Time is running out.
      </p>
      <p className="py-2">
        Armed with cryptography and blockchain technology, you’ve stayed ahead of your enemies—until now. Can you unmask the traitor before
        it’s too late?
      </p>
      <p className="py-2">Enter an App ID to join an existing game or create a new one (coming soon).</p>
      <div className="grid gap-4">
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="Enter App ID"
          value={inputAppId}
          onChange={(e) => setInputAppId(e.target.value)}
        />
        <button className="btn m-2" onClick={handleProceed}>
          Proceed to game
        </button>
        <button className="btn m-2 btn-disabled" disabled>
          Create a New Game (Coming Soon)
        </button>
      </div>
    </div>
  )
}

export default Intro
