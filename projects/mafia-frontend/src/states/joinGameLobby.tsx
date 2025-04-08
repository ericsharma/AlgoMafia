import React, { useEffect, useState } from 'react'

interface JoinGameLobbyProps {
  onJoin: () => void // Callback to handle joining the game
}

const JoinGameLobby: React.FC<JoinGameLobbyProps> = ({ onJoin }) => {
  const [players, setPlayers] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Simulate fetching players from an API
  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true)
      try {
        // Replace this with your actual API call
        const response = await fetch('/api/players') // Example API endpoint
        const data = await response.json()
        setPlayers([
          '25AIC4S4FCDADQQFRJAR3ARJTJV7SRXCPBBY6FGSLM6MFE45TPP3ELDLY4',
          'YR34TSNTVAAAB2O6O4NOF5I5NIRCGS6SSNP2EPEAFYKYAQCSXTXXGTEX2A',
          'Y4KAYPG4GHI2GM7V2XXV7UVDMLCSMMLRUZXOVRVLPPKVWWYHYWVHPDW25Y',
          '2NSIQIDTCLOABIQPJKQJNTW5WWZZ5MDYK3L25LC76I7ALZWQOC7EK6B2AE',
          'NDE5REFZQYDLCZC5P6GHVUHQWAKGM7TWWJWLX4L5OFO6XQOU3HAON7RYDU',
        ]) //data.players)
      } catch (error) {
        console.error('Failed to fetch players:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlayers()
  }, [])

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold">Game Lobby</h1>
      <p className="py-4">Waiting for players to join...</p>

      {loading ? (
        <p>Loading players...</p>
      ) : players.length > 0 ? (
        <ul className="list-disc list-inside">
          {players.map((player, index) => (
            <li key={index} className="py-1">
              {player}
            </li>
          ))}
        </ul>
      ) : (
        <p>No players in the lobby yet.</p>
      )}

      <button className="btn mt-4" onClick={onJoin}>
        Join Game
      </button>
    </div>
  )
}

export default JoinGameLobby
