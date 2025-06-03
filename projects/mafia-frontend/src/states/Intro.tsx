import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import React, { useState } from 'react'
import { TownHallClient, TownHallFactory } from '../contracts/TownHall'
import { GameState } from '../interfaces/gameState'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { getFunderLSig } from '../utils/Utils'

interface IntroProps {
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
  setAppId: React.Dispatch<React.SetStateAction<bigint>>
}

const Intro: React.FC<IntroProps> = ({ setGameState, setAppId }) => {
  const [inputAppId, setInputAppId] = useState<string>('')

  const { transactionSigner, activeAddress } = useWallet()

  const { enqueueSnackbar } = useSnackbar()

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({
    algodConfig,
    indexerConfig,
  })

  algorand.setDefaultSigner(transactionSigner)

  const handleProceed = async () => {
    if (inputAppId.trim()) {
      try {
        const gameInstance = await algorand.client.getTypedAppClientById(TownHallClient, {
          appId: BigInt(inputAppId),
        })

        // If app doesn't exist, this will throw an error:
        gameInstance.state.global.player1AlgoAddr()

        // Double-check that the funderLSig is correct
        const computedFunderLSigAddress = (await getFunderLSig(gameInstance)).address().toString()
        const theSetFunderLSigAddress = await gameInstance.state.global.lsigFunderAddress()

        if (computedFunderLSigAddress !== theSetFunderLSigAddress) {
          throw new Error('Funder LSig address mismatch! Possibly malicious game.')
        }

        setAppId(BigInt(inputAppId))
        setGameState(GameState.JoinGameLobby)
      } catch (error) {
        console.error('Error proceeding to game:', error)
        alert('Failed to proceed. Please ensure the App ID is a valid game and try again.')
      }
    } else {
      alert('Please provide a valid App ID.')
    }
  }

  const handleCreateNewGame = async () => {
    console.log('Creating a new game...')

    const factory = new TownHallFactory({
      defaultSender: activeAddress ?? undefined,
      algorand,
    })

    const deployResult = await factory.send.create.createApplication().catch((e: Error) => {
      enqueueSnackbar(`Error deploying the contract: ${e.message}`, { variant: 'error' })
      return undefined
    })

    if (!deployResult) {
      return
    }

    const { appClient } = deployResult

    // Set LSIG Funder Address
    // In this regard, the Intro.tsx component is both creation and GameState SetLSIGFunderAddress
    const funderLSigAddress = (await getFunderLSig(appClient)).address().toString()

    console.log('funderLSigAddress:', funderLSigAddress)

    const setResults = await appClient.send.setLsigFunderAddress({
      args: { funderLSigAddress },
    })

    console.log('set results:', setResults)

    if (!setResults) {
      enqueueSnackbar('Failed to set LSIG Funder Address. Please try again.', { variant: 'error' })
      return
    }

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
