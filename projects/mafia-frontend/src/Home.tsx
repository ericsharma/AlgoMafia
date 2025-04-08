import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import { GameState } from './interfaces/gameState'

// Import components for each game state
import Intro from './states/intro'
import JoinGameLobby from './states/joinGameLobby'

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [appId, setAppId] = useState<bigint>(BigInt(0))
  const [gameState, setGameState] = useState<GameState>(GameState.JoinGameLobby)
  const { activeAddress } = useWallet()

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
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
        return (
          <JoinGameLobby
            onJoin={function (): void {
              throw new Error('Function not implemented.')
            }}
          />
        )
      // case GameState.AssignRole:
      //   return <AssignRole />
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
      <div className="hero-content text-center rounded-lg p-6 max-w-md bg-white bg-opacity-90 mx-auto relative z-10">
        {renderGameState()}
      </div>
    </div>
  )
}
export default Home
