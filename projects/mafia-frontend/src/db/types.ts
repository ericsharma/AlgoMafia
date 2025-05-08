import { Address } from 'algosdk'
import { DBSchema } from 'idb'

// Define the database schema types
export interface Acct {
  addr: Address
  keyData: ArrayBuffer
}

export interface IDBPlayer {
  day_algo_address: Acct
  night_algo_address: Acct
  commitment: Uint8Array | undefined
  blinder: Uint8Array | undefined
  bls_private_key: Uint8Array
  salt: Uint8Array
  iv: Uint8Array
  bls_public_key: Uint8Array
  target: string | undefined
}

// Create a type for the storage key structure
export type StorageKey = string

// Define the schema with improved type safety
export interface WalletDB extends DBSchema {
  playerStore: {
    key: StorageKey
    value: IDBPlayer[]
  }
}
