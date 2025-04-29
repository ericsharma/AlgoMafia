import { AlgorandClient, Config } from '@algorandfoundation/algokit-utils'
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account'
import * as algoring from 'algoring-ts'
import algosdk from 'algosdk'
import { TownHallClient } from '../contracts/TownHall'

const algorand = AlgorandClient.defaultLocalNet() // only using the client to import mnemonic so network is irrelevant
export class Player {
  day_algo_address: TransactionSignerAccount & { account: algosdk.Account }

  night_algo_address: TransactionSignerAccount & { account: algosdk.Account }

  bls_private_key: Uint8Array

  bls_public_key: Uint8Array

  day_client: TownHallClient

  night_client: TownHallClient

  commitment: Uint8Array | undefined

  blinder: Uint8Array | undefined

  target: string | undefined

  constructor(appId: bigint) {
    // Avoid having to pass boxreferences etc every time
    Config.configure({ populateAppCallResources: true })

    this.bls_private_key = algoring.generate_fe()
    this.bls_public_key = algoring.generate_ge(this.bls_private_key)
    //TODO: replace day_algo_address with what Use-Wallet gives you
    this.day_algo_address = AlgorandClient.defaultLocalNet().account.random()
    this.night_algo_address = AlgorandClient.defaultLocalNet().account.random()
    this.day_client = AlgorandClient.defaultLocalNet()
      .setDefaultSigner(this.day_algo_address.signer)
      .client.getTypedAppClientById(TownHallClient, {
        appId,
        defaultSender: this.day_algo_address.addr,
        defaultSigner: this.day_algo_address.signer,
      }) // Client set with their signers, so we can have the player can sign
    this.night_client = AlgorandClient.defaultLocalNet()
      .setDefaultSigner(this.night_algo_address.signer)
      .client.getTypedAppClientById(TownHallClient, {
        appId,
        defaultSender: this.night_algo_address.addr,
        defaultSigner: this.night_algo_address.signer,
      }) // Client set with their signers, so we can have the player can sign
  }
  toJSON() {
    return {
      day_algo_address: algosdk.secretKeyToMnemonic(this.day_algo_address.account.sk),
      night_algo_address: algosdk.secretKeyToMnemonic(this.night_algo_address.account.sk),
      bls_private_key: Array.from(this.bls_private_key),
      bls_public_key: Array.from(this.bls_public_key),
      commitment: this.commitment ? Array.from(this.commitment) : undefined,
      blinder: this.blinder ? Array.from(this.blinder) : undefined,
      target: this.target,
    }
  }

  // Static method to recreate Player from stored JSON
  static fromJSON(
    json: {
      day_algo_address: string //mnemonic
      night_algo_address: string //mnemonic
      bls_private_key: number[]
      bls_public_key: number[]
      commitment?: number[]
      blinder?: number[]
      target?: string
    },
    appId: bigint,
  ): Player {
    const player = new Player(appId)

    // Recreate the day_algo_address
    player.day_algo_address = algorand.account.fromMnemonic(json.day_algo_address)

    // Recreate the night_algo_address
    player.night_algo_address = algorand.account.fromMnemonic(json.night_algo_address)

    // Recreate BLS keys
    player.bls_private_key = new Uint8Array(json.bls_private_key)
    player.bls_public_key = new Uint8Array(json.bls_public_key)

    // Recreate optional fields
    if (json.commitment) {
      player.commitment = new Uint8Array(json.commitment)
    }
    if (json.blinder) {
      player.blinder = new Uint8Array(json.blinder)
    }
    player.target = json.target

    return player
  }
}
