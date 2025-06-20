import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useMemo } from 'react'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

export const useAlgorand = () => {
  const algorand = useMemo(() => {
    const algodConfig = getAlgodConfigFromViteEnvironment()
    return AlgorandClient.fromConfig({ algodConfig })
  }, [])

  return algorand
}
