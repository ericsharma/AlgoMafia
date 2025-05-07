import React, { useState } from 'react'
import { IDBPlayer } from '../db/types'

interface PlayerSelectionModalProps {
  players: IDBPlayer[]
  onSelectPlayer: (player: IDBPlayer) => void
  onCreateNewPlayer: () => void
  onClose: () => void
}
const IDBPlayerSelectionModal: React.FC<PlayerSelectionModalProps> = ({ players, onSelectPlayer, onCreateNewPlayer, onClose }) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const MAX_PLAYERS = 6
  const hasMaxPlayers = players.length >= MAX_PLAYERS

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(event.target.value)
    setSelectedIndex(index)
  }

  const handleSelectCurrentPlayer = () => {
    onSelectPlayer(players[selectedIndex])
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 dark:text-white">Select Player</h2>

        {players.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {selectedIndex + 1}
              </div>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold">Player {selectedIndex + 1}</h3>
              {/* You can display additional player info here */}
            </div>

            <div className="slider-container mb-6">
              <input
                type="range"
                min="0"
                max={players.length - 1}
                value={selectedIndex}
                onChange={handleSliderChange}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs mt-1">
                {players.map((_, index) => (
                  <span key={index}>{index + 1}</span>
                ))}
              </div>
            </div>

            <button onClick={handleSelectCurrentPlayer} className="w-full py-2 mb-4 bg-blue-500 text-white rounded hover:bg-blue-600">
              Select Player {selectedIndex + 1}
            </button>
          </div>
        )}

        <div className="flex justify-between">
          {!hasMaxPlayers && (
            <button onClick={onCreateNewPlayer} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              Create New Player
            </button>
          )}
          <button
            onClick={onClose}
            className={`px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 dark:hover:bg-gray-500 dark:text-white ${hasMaxPlayers ? 'ml-auto' : ''}`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default IDBPlayerSelectionModal
