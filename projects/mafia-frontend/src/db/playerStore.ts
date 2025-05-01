import { openDB } from 'idb'
import { IDBPlayer, StorageKey, WalletDB } from './types'

// Database constants
export const DB_NAME = 'inflitratorGameDB'
export const STORE_NAME = 'playerStore'
export const DB_VERSION = 1

/**
 * Initialize the IndexedDB database
 * @returns Promise with the database instance
 */
export const initDB = async () => {
  return openDB<WalletDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    },
  })
}

/**
 * Create a storage key from address and appId
 * @param address Wallet address
 * @param appId Application ID
 * @returns Storage key string
 */
export const createStorageKey = (address: string, appId: bigint): StorageKey => {
  return `${address}-${appId}`
}

/**
 * Save player data to IndexedDB
 * @param playerId Storage key
 * @param playerData Player data to store
 */
export const savePlayerData = async (playerId: StorageKey, playerData: IDBPlayer) => {
  const db = await initDB()
  await db.put(STORE_NAME, playerData, playerId)
}

/**
 * Get player data from IndexedDB
 * @param playerId Storage key
 * @returns Player data or null if not found
 */
export const getPlayerData = async (playerId: StorageKey): Promise<IDBPlayer | null> => {
  const db = await initDB()
  const result = await db.get(STORE_NAME, playerId)
  return result || null
}
