import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import React, { useState } from 'react'
import { TownHallFactory } from '../contracts/TownHall'
import { GameState } from '../interfaces/gameState'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface IntroProps {
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
  setAppId: React.Dispatch<React.SetStateAction<bigint>>
}

const Intro: React.FC<IntroProps> = ({ setGameState, setAppId }) => {
  const [inputAppId, setInputAppId] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const { transactionSigner, activeAddress } = useWallet()

  const { enqueueSnackbar } = useSnackbar()

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({
    algodConfig,
    indexerConfig,
  })

  algorand.setDefaultSigner(transactionSigner)

  const handleProceed = () => {
    if (inputAppId.trim()) {
      setAppId(BigInt(inputAppId))
      setGameState(GameState.JoinGameLobby)
    } else {
      alert('Please provide a valid App ID.')
    }
  }

  const handleCreateNewGame = async () => {
    console.log('Creating a new game...')
    setLoading(true)

    const factory = new TownHallFactory({
      defaultSender: activeAddress ?? undefined,
      algorand,
    })
    const deployResult = await factory.send.create.createApplication().catch((e: Error) => {
      enqueueSnackbar(`Error deploying the contract: ${e.message}`, { variant: 'error' })
      setLoading(false)
      return undefined
    })

    if (!deployResult) {
      return
    }

    const { appClient } = deployResult

    setAppId(appClient.appId)
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
      <p className="py-2">Enter an App ID to join an existing game or create a new one.</p>
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
        <button className="btn m-2" onClick={handleCreateNewGame}>
          Create a New Game
        </button>
      </div>
    </div>
  )
}

export default Intro
