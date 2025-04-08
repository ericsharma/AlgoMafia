import { useWallet } from '@txnlab/use-wallet-react'
import React, { useEffect, useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import { GameState } from './interfaces/gameState'

// Import components for each game state
import { Player } from './interfaces/player'
import Intro from './states/Intro'
import JoinGameLobby from './states/JoinGameLobby'
import AssignRole from './states/AssignRole'

interface HomeProps { }

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [appId, setAppId] = useState<bigint>(BigInt(0))
  const [playerObject, setPlayerObject] = useState<Player | undefined>(undefined)
  const [gameState, setGameState] = useState<GameState>(GameState.JoinGameLobby)
  const [triggerFetch, setTriggerFetch] = useState<boolean>(false)
  const { activeAddress, transactionSigner } = useWallet()

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  // Set Player Object for a specific appId
  useEffect(() => {
    if (activeAddress && appId !== BigInt(0)) {
      const player = new Player(appId)
      setPlayerObject(player)
    }
  }, [appId])

  // Once the Player Object is set we have an app we can query for game state
  useEffect(() => {
    const fetchGameState = async () => {
      if (activeAddress && appId !== BigInt(0) && playerObject) {
        const state = await playerObject.day_client.state.global.gameState()
        if (state !== undefined) {
          setGameState(GameState[GameState[Number(state)] as keyof typeof GameState])
        }
      }
    }
    fetchGameState()
  }, [playerObject, triggerFetch])

  //TODO: reconsider the state management and how we are updating the game state
  const triggerGameStateFetch = () => {
    setTriggerFetch((prev) => !prev) // Toggle the state to trigger useEffect
  }

  const renderGameState = () => {
    if (!activeAddress) {
      return (
        <div className="text-center">
          <p>Please connect your wallet to proceed.</p>
          <button className="btn m-2" onClick={toggleWalletModal}>
            Connect Wallet
          </button>
          <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
        </div>
      )
    }

    if (appId === BigInt(0)) {
      return <Intro setGameState={setGameState} setAppId={setAppId} />
    }

    switch (gameState) {
      case GameState.JoinGameLobby:
        return playerObject && <JoinGameLobby playerObject={playerObject} refresher={triggerGameStateFetch} />
      case GameState.AssignRole:
        return playerObject && <AssignRole playerObject={playerObject} refresher={triggerGameStateFetch} />
      // case GameState.DayStageVote:
      //   return <DayStageVote />
      // case GameState.DayStageEliminate:
      //   return <DayStageEliminate />
      // case GameState.DayStageUnmasking:
      //   return <DayStageUnmasking />
      // case GameState.NightStageMafiaCommit:
      //   return <NightStageMafiaCommit />
      // case GameState.NightStageDoctorCommit:
      //   return <NightStageDoctorCommit />
      // case GameState.DawnStageMafiaReveal:
      //   return <DawnStageMafiaReveal />
      // case GameState.DawnStageDoctorReveal:
      //   return <DawnStageDoctorReveal />
      // case GameState.DawnStageDeadOrSaved:
      //   return <DawnStageDeadOrSaved />
      // case GameState.DawnStageUnmasking:
      //   return <DawnStageUnmasking />
      // case GameState.GameOver:
      //   return <GameOver />
      default:
        return <p>Unknown game state</p>
    }
  }

  return (
    <div className="hero min-h-screen relative">
      {/* Header */}
      <div className="absolute top-0 left-0 w-full bg-gray-800 bg-opacity-50 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Infiltrated</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{appId === BigInt(0) ? 'Not joined' : `Game ID: ${appId.toString()}`}</span>
          <button className="btn btn-primary" onClick={() => setOpenWalletModal(true)}>
            {activeAddress}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="hero-content text-center rounded-lg p-6 max-w-md bg-white bg-opacity-90 mx-auto relative z-10">
        {renderGameState()}
        <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
      </div>
    </div>
  )
}
export default Home
