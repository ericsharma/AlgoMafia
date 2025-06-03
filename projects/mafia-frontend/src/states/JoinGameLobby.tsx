import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import * as algoring from 'algoring-ts'
import React from 'react'
import PlayerPickPanel from '../components/PlayerPickPanel'
import usePlayersState from '../hooks/usePlayerState'
import { Player } from '../interfaces/player'
import { BLS12381G1_LENGTH, LSIG_FUND_AMOUNT, RING_SIG_NONCE_LENGTH, SLASH_DEPOSIT_AMOUNT } from '../utils/constants'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import algosdk from 'algosdk'

interface JoinGameLobbyProps {
  playerObject: Player
}

const JoinGameLobby: React.FC<JoinGameLobbyProps> = ({ playerObject }) => {
  const { activeAddress, transactionSigner } = useWallet()

  const { players } = usePlayersState(playerObject)

  console.log(`players in joinGameLobby:${players}`)

  const handleJoinGame = async () => {
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const indexerConfig = getIndexerConfigFromViteEnvironment()
    const algorand = AlgorandClient.fromConfig({
      algodConfig,
      indexerConfig,
    })

    algorand.setDefaultSigner(transactionSigner)

    console.log('The players are currently:', players)

    if (players.includes(playerObject.day_algo_address.addr.toString())) {
      console.log('Already joined the game')
      return
    }

    // Fund the day_algo_player address with 2 Algo
    const fundDayPlayerAlgoResults = await algorand.send.payment({
      sender: activeAddress!,
      signer: transactionSigner,
      receiver: playerObject.day_algo_address.addr,
      amount: (2).algos(),
    })

    console.log('Funding Day Player Results:', fundDayPlayerAlgoResults)

    // Fund the application as part of the joinGameLobby call.
    const depositPayment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: playerObject.day_algo_address.addr,
      receiver: playerObject.day_client.appAddress,
      amount: LSIG_FUND_AMOUNT + SLASH_DEPOSIT_AMOUNT,
      suggestedParams: await AlgorandClient.defaultLocalNet().getSuggestedParams(),
    })

    const proof = algoring.NIZK_DLOG_generate_proof(playerObject.bls_private_key)

    const NIZK_DLOG = new Uint8Array(3 * BLS12381G1_LENGTH + RING_SIG_NONCE_LENGTH)
    NIZK_DLOG.set(proof[0])
    NIZK_DLOG.set(proof[1], BLS12381G1_LENGTH)
    NIZK_DLOG.set(proof[2], 2 * BLS12381G1_LENGTH)
    NIZK_DLOG.set(proof[3], 3 * BLS12381G1_LENGTH)

    const joinGameResult = await playerObject.day_client
      .newGroup()
      .joinGameLobby({
        args: {
          nizkDlog: NIZK_DLOG,
          depositTxn: depositPayment,
        },
        extraFee: (1000).microAlgos(),
      })
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
      .send()

    console.log('Join Game Result:', joinGameResult)

    // Fetch players immediately after joining the game
  }

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold">Game Lobby</h1>
      <p className="py-4">Waiting for players to join...</p>

      {players.length > 0 ? (
        <PlayerPickPanel players={players} currentPlayerAddress={playerObject.day_algo_address.addr.toString()} />
      ) : (
        <p>No players in the lobby yet.</p>
      )}

      {players.includes(playerObject.day_algo_address.addr.toString()) ? (
        <p className="py-4 text-green-500">You have successfully joined the game!</p>
      ) : (
        <button className="btn mt-4" onClick={handleJoinGame}>
          Join Game
        </button>
      )}
    </div>
  )
}

export default JoinGameLobby
