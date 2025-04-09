import { useWallet } from '@txnlab/use-wallet-react'
import React, { useEffect, useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import { GameState } from './interfaces/gameState'

// Import components for each game state
import { Player } from './interfaces/player'
import Intro from './states/Intro'
import JoinGameLobby from './states/JoinGameLobby'
import AssignRole from './states/AssignRole'
import DayStageVote from './states/DayStageVote'
import DawnStageDeadOrSaved from './states/DawnStageDeadOrSaved'
import DawnStageDoctorReveal from './states/DawnStageDoctorReveal'
import DawnStageMafiaReveal from './states/DawnStageMafiaReveal'
import DawnStageUnmasking from './states/DawnStageUnmasking'
import DayStageEliminate from './states/DayStageEliminate'
import DayStageUnmasking from './states/DayStageUnmasking'
import GameOver from './states/GameOver'
import NightStageDoctorCommit from './states/NightStageDoctorCommit'
import NightStageMafiaCommit from './states/NightStageMafiaCommit'

// Audio
import { FaPlay, FaPause } from 'react-icons/fa' // Import play/pause icons

const Home: React.FC = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [appId, setAppId] = useState<bigint>(BigInt(0))
  const [playerObject, setPlayerObject] = useState<Player | undefined>(undefined)
  const [gameState, setGameState] = useState<GameState>(GameState.JoinGameLobby)
  const [triggerFetch, setTriggerFetch] = useState<boolean>(false)
  const [isPlaying, setIsPlaying] = useState<boolean>(false) // State to track audio playback
  const { activeAddress } = useWallet()

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
      case GameState.DayStageVote:
        return playerObject && <DayStageVote playerObject={playerObject} refresher={triggerGameStateFetch} />
      case GameState.DayStageEliminate:
        return playerObject && <DayStageEliminate playerObject={playerObject} refresher={triggerGameStateFetch} />
      case GameState.DayStageUnmasking:
        return playerObject && <DayStageUnmasking playerObject={playerObject} refresher={triggerGameStateFetch} />
      case GameState.NightStageMafiaCommit:
        return playerObject && <NightStageMafiaCommit playerObject={playerObject} refresher={triggerGameStateFetch} />
      case GameState.NightStageDoctorCommit:
        return playerObject && <NightStageDoctorCommit playerObject={playerObject} refresher={triggerGameStateFetch} />
      case GameState.DawnStageMafiaReveal:
        return playerObject && <DawnStageMafiaReveal playerObject={playerObject} refresher={triggerGameStateFetch} />
      case GameState.DawnStageDoctorReveal:
        return playerObject && <DawnStageDoctorReveal playerObject={playerObject} refresher={triggerGameStateFetch} />
      case GameState.DawnStageDeadOrSaved:
        return playerObject && <DawnStageDeadOrSaved playerObject={playerObject} refresher={triggerGameStateFetch} />
      case GameState.DawnStageUnmasking:
        return playerObject && <DawnStageUnmasking playerObject={playerObject} refresher={triggerGameStateFetch} />
      case GameState.GameOver:
        return playerObject && <GameOver playerObject={playerObject} refresher={triggerGameStateFetch} />
      default:
        return <p>Unknown game state</p>
    }
  }

  const toggleAudio = () => {
    const audio = document.getElementById('background-music') as HTMLAudioElement
    audio.volume = 0.1
    if (audio) {
      if (isPlaying) {
        audio.pause()
      } else {
        audio.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <div className="hero min-h-screen relative">
      {/* "NavBar" */}
      <div className="absolute top-0 left-0 w-full bg-gray-800 bg-opacity-50 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Infiltrated</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{appId === BigInt(0) ? 'Not joined' : `Game ID: ${appId.toString()}`}</span>
          <button className="btn btn-primary" onClick={() => setOpenWalletModal(true)}>
            {activeAddress}
          </button>
          <button className="btn btn-secondary" onClick={toggleAudio}>
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="hero-content text-center rounded-lg p-6 max-w-md bg-white bg-opacity-90 mx-auto relative z-10">
        {renderGameState()}
        <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
      </div>

      {/* Background Music */}
      <audio id="background-music" loop>
        <source src="/song-1.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  )
}

export default Home
