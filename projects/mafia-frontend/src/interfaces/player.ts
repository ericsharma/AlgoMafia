import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account'
import algosdk from 'algosdk'
import { TownHallClient } from '../contracts/TownHall'

export class Player {
  day_algo_address: TransactionSignerAccount & { account: algosdk.Account }

  night_algo_address: TransactionSignerAccount & { account: algosdk.Account }

  bls_private_key: Uint8Array

  bls_public_key: Uint8Array

  day_client: TownHallClient

  night_client: TownHallClient

  constructor(appId: bigint) {
    this.bls_private_key = algoring.generate_fe()
    this.bls_public_key = algoring.generate_ge(this.bls_private_key)
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
}
