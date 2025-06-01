import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import * as algoring from 'algoring-ts'
import algosdk from 'algosdk'
import assert from 'assert'
import React, { useEffect, useRef, useState } from 'react'
import { TownHallClient } from '../contracts/TownHall'
import { Player } from '../interfaces/player'
import { BLS12381G1_LENGTH, LSIG_FUND_AMOUNT, RING_SIG_CHALL_LENGTH, RING_SIG_NONCE_LENGTH, ZERO_ADDRESS } from '../utils/constants'
import { getFunderLSig } from '../utils/Utils'

interface AssignRoleProps {
  playerObject: Player
}

async function prepareLSigRingLink(
  i: number,
  playerClient: TownHallClient,
  msg: Uint8Array,
  pk: Uint8Array,
  keyImage: Uint8Array,
  signatureNonce: Uint8Array,
  inputC: Uint8Array,
  expectedCNext: Uint8Array,
) {
  const abiBytes = algosdk.ABIType.from('byte[]')

  // Fetch the LSIG file from public folder
  const response = await fetch(`/LSIGs/RingLinkLSig${i.toString()}.lsig.teal`)
  if (!response.ok) {
    throw new Error(`Failed to fetch LSIG file: RingLinkLSig${i.toString()}.lsig.teal`)
  }
  const lsigRingLinkLSigTeal = await response.text()

  const compileResult = await playerClient.algorand.app.compileTeal(lsigRingLinkLSigTeal)

  const lsigRingLinkLSig = new algosdk.LogicSigAccount(compileResult.compiledBase64ToBytes, [
    abiBytes.encode(msg),
    abiBytes.encode(pk),
    abiBytes.encode(algoring.to_pxpy(keyImage)),
    abiBytes.encode(signatureNonce),
    abiBytes.encode(inputC),
    abiBytes.encode(expectedCNext),
  ])

  const sp = await AlgorandClient.defaultLocalNet().getSuggestedParams()

  const lSigRingSigPayTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    suggestedParams: { ...sp, flatFee: true, fee: 0 },
    sender: lsigRingLinkLSig.address(),
    receiver: lsigRingLinkLSig.address(),
    amount: 0,
  })

  const lSigRingSigSigner = algosdk.makeLogicSigAccountTransactionSigner(lsigRingLinkLSig)
  return { lSigRingSigPayTxn, lSigRingSigSigner }
}

async function prepareFunderLSig(playerClient: TownHallClient, nightAddress: string) {
  const funderLSig = await getFunderLSig(playerClient)

  const sp = await AlgorandClient.defaultLocalNet().getSuggestedParams()

  const funderLSigPayTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    suggestedParams: { ...sp, flatFee: true, fee: 0 },
    sender: funderLSig.address(),
    receiver: nightAddress,
    amount: LSIG_FUND_AMOUNT,
  })

  const funderLSigSigner = algosdk.makeLogicSigAccountTransactionSigner(funderLSig)
  return { funderLSigPayTxn, funderLSigSigner }
}

async function assignRoleCall(playerObject: Player) {
  const ring = await playerObject.night_client.state.box.quickAccessPkBoxes.value(0)
  if (!ring) {
    throw new Error('ring is undefined')
  }

  const ringOfPKs = [
    algoring.from_pxpy(ring.slice(0 * BLS12381G1_LENGTH, 1 * BLS12381G1_LENGTH)),
    algoring.from_pxpy(ring.slice(1 * BLS12381G1_LENGTH, 2 * BLS12381G1_LENGTH)),
    algoring.from_pxpy(ring.slice(2 * BLS12381G1_LENGTH, 3 * BLS12381G1_LENGTH)),
    algoring.from_pxpy(ring.slice(3 * BLS12381G1_LENGTH, 4 * BLS12381G1_LENGTH)),
    algoring.from_pxpy(ring.slice(4 * BLS12381G1_LENGTH, 5 * BLS12381G1_LENGTH)),
    algoring.from_pxpy(ring.slice(5 * BLS12381G1_LENGTH, 6 * BLS12381G1_LENGTH)),
  ]

  const msg = Buffer.concat([
    algosdk.decodeAddress(playerObject.night_algo_address.addr.toString()).publicKey,
    algosdk.decodeAddress(playerObject.night_client.appClient.appAddress.toString()).publicKey,
  ])

  // ALGORING-TS TODO: Remove genKeyImage's PK input, it should be directly generated from SK.
  const keyImage = algoring.genKeyImage(playerObject.bls_private_key, playerObject.bls_public_key)

  // ALGORING-TS TODO: Remove KeyImage return since it is superfluous OR KeyImage input
  const { signature } = algoring.generate_ring_signature(msg, playerObject.bls_private_key, ringOfPKs, keyImage)

  assert(algoring.verify_ring_signature(msg, signature, ringOfPKs, keyImage), 'Produced invalid ring signature.')

  // ALGORING-TS TODO: remove msg return
  const { signatureConcat, intermediateValues } = algoring.construct_avm_ring_signature(msg, signature, ringOfPKs, keyImage)

  // BEGIN LSIG

  const pts = []
  const signers = []

  const length = intermediateValues.length / RING_SIG_CHALL_LENGTH

  for (let i = 0; i < length; i++) {
    const { lSigRingSigPayTxn, lSigRingSigSigner } = await prepareLSigRingLink(
      i,
      playerObject.night_client,
      msg,
      ring.slice(i * BLS12381G1_LENGTH, (i + 1) * BLS12381G1_LENGTH),
      keyImage,
      signatureConcat.slice((i + 1) * RING_SIG_NONCE_LENGTH, (i + 2) * RING_SIG_NONCE_LENGTH),
      intermediateValues.slice(i * RING_SIG_CHALL_LENGTH, (i + 1) * RING_SIG_CHALL_LENGTH),
      i === length - 1
        ? intermediateValues.slice(0 * RING_SIG_CHALL_LENGTH, 1 * RING_SIG_CHALL_LENGTH)
        : intermediateValues.slice((i + 1) * RING_SIG_CHALL_LENGTH, (i + 2) * RING_SIG_CHALL_LENGTH),
    )
    pts.push(lSigRingSigPayTxn)
    signers.push(lSigRingSigSigner)
  }

  const { funderLSigPayTxn, funderLSigSigner } = await prepareFunderLSig(
    playerObject.night_client,
    playerObject.night_algo_address.addr.toString(),
  )

  const assignRoleResult = await playerObject.night_client
    .newGroup()
    .assignRole({
      args: {
        msg,
        pkAll: ring,
        keyImage: algoring.to_pxpy(keyImage),
        sig: signatureConcat,
        challenges: intermediateValues,
        funderLSigTxn: {
          txn: funderLSigPayTxn,
          signer: funderLSigSigner,
        },
        ringLSigTxn0: {
          txn: pts[0],
          signer: signers[0],
        },
        ringLSigTxn1: {
          txn: pts[1],
          signer: signers[1],
        },
        ringLSigTxn2: {
          txn: pts[2],
          signer: signers[2],
        },
        ringLSigTxn3: {
          txn: pts[3],
          signer: signers[3],
        },
        ringLSigTxn4: {
          txn: pts[4],
          signer: signers[4],
        },
        ringLSigTxn5: {
          txn: pts[5],
          signer: signers[5],
        },
      },
      extraFee: (1000 * (length + 1)).microAlgos(),
    })
    .send()

  console.log('Assign Role Result:', assignRoleResult)
}

const AssignRole: React.FC<AssignRoleProps> = ({ playerObject }) => {
  const [playerRole, setPlayerRole] = useState('')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchRoles = async () => {
    try {
      const mafiaAddress = await playerObject.day_client.state.global.mafia()!
      const doctorAddress = await playerObject.day_client.state.global.doctor()!
      const butcherAddress = await playerObject.day_client.state.global.butcher()!
      const farmerAddress = await playerObject.day_client.state.global.farmer()!
      const innkeepAddress = await playerObject.day_client.state.global.innkeep()!
      const grocerAddress = await playerObject.day_client.state.global.grocer()!

      if (
        mafiaAddress &&
        mafiaAddress !== ZERO_ADDRESS &&
        doctorAddress &&
        doctorAddress !== ZERO_ADDRESS &&
        butcherAddress &&
        butcherAddress !== ZERO_ADDRESS &&
        farmerAddress &&
        farmerAddress !== ZERO_ADDRESS &&
        innkeepAddress &&
        innkeepAddress !== ZERO_ADDRESS &&
        grocerAddress &&
        grocerAddress !== ZERO_ADDRESS
      ) {
        console.log('All roles have been assigned.')
      }

      if (mafiaAddress && mafiaAddress === playerObject.night_algo_address.addr.toString()) {
        setPlayerRole('Infiltrator')
      } else if (doctorAddress && doctorAddress === playerObject.night_algo_address.addr.toString()) {
        setPlayerRole('Double Agent')
      } else if (butcherAddress && butcherAddress === playerObject.night_algo_address.addr.toString()) {
        setPlayerRole('Xenobiologist')
      } else if (farmerAddress && farmerAddress === playerObject.night_algo_address.addr.toString()) {
        setPlayerRole('Moisture Farmer')
      } else if (innkeepAddress && innkeepAddress === playerObject.night_algo_address.addr.toString()) {
        setPlayerRole('AI Psychologist')
      } else if (grocerAddress && grocerAddress === playerObject.night_algo_address.addr.toString()) {
        setPlayerRole('Spice Trader')
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    }
  }

  const startPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    intervalRef.current = setInterval(() => {
      fetchRoles()
    }, 2800) // Poll every 2.8 seconds
  }

  useEffect(() => {
    // Run fetchPlayers initially when the component is loaded
    fetchRoles()
    startPolling()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current) // Cleanup interval on component unmount
      }
    }
  }, [playerObject])

  const handleRequestRole = async () => {
    await assignRoleCall(playerObject)
  }

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold">Game Lobby</h1>

      {playerRole === '' ? (
        <button className="btn mt-4" onClick={handleRequestRole}>
          Request Role
        </button>
      ) : (
        <div className="mt-4">
          <p>Welcome, {playerRole}.</p>
          <p>Please wait for the others to be assigned roles.</p>
        </div>
      )}
    </div>
  )
}

export default AssignRole
