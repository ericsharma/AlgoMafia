import React from 'react'
import usePlayersState from '../hooks/usePlayerState'
import { Player } from '../interfaces/player'
import { ellipseAddress } from '../utils/ellipseAddress'

interface DayStageVoteProps {
  playerObject: Player
}

const DayStageVote: React.FC<DayStageVoteProps> = ({ playerObject }) => {
  const { playerHasVoted, players, playerIsDead } = usePlayersState(playerObject)

  const handleVote = async (playerNumber: number) => {
    console.log(`Voted for player ${playerNumber}`)

    const voteResult = await playerObject.day_client.send.dayStageVote({
      args: {
        vote: playerNumber,
      },
    })

    console.log('Vote result:', voteResult)
  }

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold">Day Stage: Vote</h1>
      {playerIsDead && <p className="py-4"> You are out. You cannot vote.</p>}
      {playerHasVoted && (
        <>
          <p className="py-4">You have already voted. Please wait.</p>
        </>
      )}
      {!playerHasVoted && !playerIsDead && (
        <>
          <p className="py-4">Who do you want to vote for?</p>
          {players.length > 0 ? (
            <ul className="list-disc list-inside">
              {players.map((player, i) => (
                <li key={i + 1} className="py-2">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleVote(i + 1)} // Pass the correct player number
                  >
                    {`Player ${i + 1}`}: {ellipseAddress(player)}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Error: No players available to vote for.</p>
          )}
        </>
      )}
    </div>
  )
}

export default DayStageVote
