import * as algoring from 'algoring-ts'
import React, { useEffect, useState, useRef } from 'react'
import { Player } from '../interfaces/player'
import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { BLS12381G1_LENGTH, RING_SIG_NONCE_LENGTH } from '../utils/constants'

interface AssignRoleProps {
  playerObject: Player
  refresher: () => void
}

const AssignRole: React.FC<AssignRoleProps> = ({ playerObject, refresher }) => {

  const { activeAddress, transactionSigner } = useWallet()

  const handleRequestRole = async () => {

    const algodConfig = getAlgodConfigFromViteEnvironment()
    const indexerConfig = getIndexerConfigFromViteEnvironment()
    const algorand = AlgorandClient.fromConfig({
      algodConfig,
      indexerConfig,
    })

    algorand.setDefaultSigner(transactionSigner)

    // TODO: MASSIVE TODO HERE
    // We need to make sure that the night player is funded by an LSIG!
    // Currently we leak the day address <-> night address mapping!!!

    // Fund the night_algo_player address with 2 Algo
    const fundNightPlayerAlgoResults = await algorand.send.payment({
      sender: activeAddress!,
      signer: transactionSigner,
      receiver: playerObject.night_algo_address.addr,
      amount: (2).algos(),
    })

    console.log('Funding Night Player Results:', fundNightPlayerAlgoResults)


  }


  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold">Game Lobby</h1>

      <button className="btn mt-4" onClick={handleRequestRole}>
        Request Role
      </button>
    </div>
  )
}

export default AssignRole
