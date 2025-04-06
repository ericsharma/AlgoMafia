import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import { GameState } from './interfaces/gameState'

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [gameState, setGameState] = useState<GameState>(GameState.JoinGameLobby)
  const { activeAddress } = useWallet()

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  return (
    <div className="hero min-h-screen relative">
      <div className="hero-content text-center rounded-lg p-6 max-w-md bg-white bg-opacity-90 mx-auto relative z-10">
        <div className="max-w-md">
          <h1 className="text-4xl">
            <div className="font-bold">Infiltrated</div>
          </h1>
          <p className="py-2">
            You are members of the Resistance, a ragtag group of cypherpunk freedom fighters doing your best to stand up to the Orwellian
            surveillance state that wishes to track your every move and police your every thought.
          </p>
          <p className="py-2">
            Excellent operational security, access to a permissionless blockchain and knowledge of cryptography has allowed you to come this
            far. However, comrades are disappearing one by one...
          </p>
          <p className="py-2">You've been infiltrated.</p>
          <p className="py-2">Can you find the spy in your midst before it is too late?</p>
          <div className="grid">
            {activeAddress ? (
              <button data-test-id="transactions-demo" className="btn m-2" onClick={toggleWalletModal}>
                Proceed to game
              </button>
            ) : (
              <button data-test-id="transactions-demo" className="btn m-2" onClick={toggleWalletModal}>
                Connect Wallet
              </button>
            )}
          </div>

          <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
        </div>
      </div>
    </div>
  )
}

export default Home
