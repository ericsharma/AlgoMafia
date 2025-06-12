import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { Address } from 'algosdk'
import { useEffect, useState } from 'react'
import { Player } from '../interfaces/player'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface GameOverProps {
  playerObject: Player
}

const GameOver: React.FC<GameOverProps> = ({ playerObject }) => {
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const [deleteApplication, setDeleteApplication] = useState(false)

  const algorand = AlgorandClient.fromConfig({ algodConfig })

  const getBalance = async (addr: string | Address) => {
    return (await algorand.client.algod.accountInformation(addr).do()).amount
  }
  const endGame = async () => {
    await playerObject.night_client
      .newGroup()
      .gameOver({ args: {} })
      .dummyOpUp({
        args: { i: 1 },
      })
      .send()
  }

  const deleteApp = async () => {
    await playerObject.day_client.send.delete.deleteApplication({ args: {}, extraFee: (1_000).microAlgos() })
  }

  useEffect(() => {
    if (Number(getBalance(playerObject.night_algo_address.account.addr)) > 0) {
      algorand.send.payment({
        sender: playerObject.night_algo_address.addr,
        amount: (0).algo(),
        receiver: playerObject.day_algo_address.addr,
        closeRemainderTo: playerObject.day_algo_address.addr,
        signer: playerObject.night_algo_address.signer,
      })
    }

    if (Number(getBalance(playerObject.night_client.appAddress)) === 0) {
      setDeleteApplication(true)
    }
  }, [])

  return (
    <div>
      <h1>The game is over!</h1>

      <button disabled={deleteApplication!} onClick={() => endGame()}>
        End Game{' '}
      </button>
      <button disabled={deleteApplication} onClick={() => deleteApp()}>
        Delete Application{' '}
      </button>
    </div>
  )
}

export default GameOver
