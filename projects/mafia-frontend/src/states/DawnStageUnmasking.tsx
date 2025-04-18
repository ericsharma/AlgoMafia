import { Player } from '../interfaces/player'

import usePlayersState from '../hooks/usePlayerState'

interface DawnStageUnmaskingProps {
  playerObject: Player
}

const DawnStageUnmasking: React.FC<DawnStageUnmaskingProps> = ({ playerObject }) => {
  const { iAmEliminated } = usePlayersState(playerObject)

  const handleDawnStageUnmasking = async () => {
    await playerObject.day_client
      .newGroup()
      .dawnStageUnmasking({ args: { blsSk: playerObject.bls_private_key } })
      .dummyOpUp({
        args: { i: 1 },
      })
      .dummyOpUp({
        args: { i: 2 },
      })
      .dummyOpUp({
        args: { i: 3 },
      })
      .dummyOpUp({
        args: { i: 4 },
      })
      .dummyOpUp({
        args: { i: 5 },
      })
      .dummyOpUp({
        args: { i: 6 },
      })
      .dummyOpUp({
        args: { i: 7 },
      })
      .dummyOpUp({
        args: { i: 8 },
      })
      .dummyOpUp({
        args: { i: 9 },
      })
      .dummyOpUp({
        args: { i: 10 },
      })
      .dummyOpUp({
        args: { i: 11 },
      })
      .dummyOpUp({
        args: { i: 12 },
      })
      .send()
  }

  return (
    <div>
      <h1>DawnStageUnmasking</h1>

      {iAmEliminated ? (
        <>
          <h2>You've been eliminated!</h2>
          <p>Press the button to unmask yourself...</p>
          <button className="btn m-2" onClick={handleDawnStageUnmasking}>
            Unmask
          </button>
        </>
      ) : (
        <p>Waiting for eliminated player to unmask themselves...</p>
      )}
    </div>
  )
}

export default DawnStageUnmasking
