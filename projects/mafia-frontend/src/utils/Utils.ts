import algosdk from 'algosdk'
import { TownHallClient } from '../contracts/TownHall'

export async function getFunderLSig(appClient: TownHallClient): Promise<algosdk.LogicSigAccount> {
  // Fetch the LSIG file from public folder
  const response = await fetch('/LSIGs/FunderLSig.lsig.teal')
  if (!response.ok) {
    throw new Error('Failed to fetch LSIG file: FunderLSig.lsig.teal')
  }
  let funderLSigTEAL = await response.text()

  funderLSigTEAL = funderLSigTEAL.replace('TMPL_APP_ID', appClient.appId.toString())
  const compileResult = await appClient.algorand.app.compileTeal(funderLSigTEAL)

  return new algosdk.LogicSigAccount(compileResult.compiledBase64ToBytes, [])
}
