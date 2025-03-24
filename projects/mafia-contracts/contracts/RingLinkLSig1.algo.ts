import { LogicSig } from '@algorandfoundation/tealscript';
import {
  BLS12381G1_BASEPOINT_BYTES,
  BLS12381G1_LENGTH,
  BLS12381_CURVE_ORDER_HEX,
  BLS12381_FIELD_MODULUS_HEX,
  RING_SIG_CHALL_LENGTH,
  RING_SIG_NONCE_LENGTH,
} from './Constants';

const iter = 1;

export class RingLinkLSig1 extends LogicSig {
  /** logic: challenge
   * Produce the challenge, i.e. an individual link in the ring sig verification.
   * We mod by order of fr https://github.com/Consensys/gnark-crypto/blob/master/ecc/bn254/fr/element.go#L42
   * c_{i+1} = Hs(m || r_{i} * G + c_{i} * K_{i} || r_{i}*Hp(K_{i}) + c_{i} * I) mod |fr|
   * @param msg - The message to be signed
   * @param pkAll - All public keys in the ring, in 1 large byte array, equivalent to the box in the application
   * @param pkIndex - The specific public key in the ring (indexed from the array of public keys)
   * @param keyImage - The key image of the signer, required for linkabiltiy to prevent double spending
   * @param sig - The ring sig nonces, in 1 large byte array. The core of the ring sig itself.
   * @param challenges - The challenges, in 1 large byte array. Intermediate values. We check if what's provided into the contract is the same as what is calculated.
   */
  logic(msg: Address, pkAll: bytes, pkIndex: uint64, keyImage: bytes, sig: bytes, challenges: bytes): void {
    const nonce = extract3(sig, iter * RING_SIG_NONCE_LENGTH, (iter + 1) * RING_SIG_NONCE_LENGTH);
    const cPrev = extract3(challenges, iter * RING_SIG_CHALL_LENGTH, (iter + 1) * RING_SIG_CHALL_LENGTH);
    const pk = extract3(pkAll, pkIndex * BLS12381G1_LENGTH, (pkIndex + 1) * BLS12381G1_LENGTH);

    /* CALCULATE LEFT-HAND SIDE OF EQUATION (AFTER MSG BYTES)
     ** r_{i} * G + c_{i} * K_{i}
     ** G = 0x00...0100...02 (basepoint)
     */
    const left = ecAdd(
      'BLS12_381g1',
      ecScalarMul('BLS12_381g1', hex(BLS12381G1_BASEPOINT_BYTES), nonce),
      ecScalarMul('BLS12_381g1', cPrev, pk)
    );

    // Added because the hashPointToPoint function could not be imported
    // HashPointToPoint section
    const hash = keccak256(pk);
    const fpElement = btobigint(hash) % btobigint(hex(BLS12381_FIELD_MODULUS_HEX));
    // ^This field modulus is so much larger than 2^256 that it will never be required to reduce modulo it
    // This needs to be looked over and converted the ExpandMsgXmd method to properly implement EncodeToG1
    const hp2p = ecMapTo('BLS12_381g1', rawBytes(fpElement));

    /* CALCULATE RIGHT-HAND SIDE OF EQUATION (AFTER MSG BYTES)
     ** r_{i}*Hp(K_{i}) + c_{i} * I
     ** where Hp is a hash function that maps a point to a point on the curve
     */
    const right = ecAdd(
      'BLS12_381g1',
      ecScalarMul('BLS12_381g1', nonce, hp2p),
      ecScalarMul('BLS12_381g1', cPrev, keyImage)
    );

    /* COMBINE MSG BYTES WITH LEFT AND RIGHT BYTES
     ** Take hash of the concatenated bytes and then mod |fr|
     ** Then return the results.
     */
    const h = rawBytes(
      btobigint(keccak256(concat(concat(msg, left), right))) % btobigint(hex(BLS12381_CURVE_ORDER_HEX))
    );

    assert(
      h === extract3(challenges, ((iter + 1) % 7) * RING_SIG_CHALL_LENGTH, ((iter + 2) % 7) * RING_SIG_CHALL_LENGTH)
    );

    verifyAppCallTxn(this.txnGroup[0], {
      applicationArgs: {
        0: rawBytes(msg),
        1: rawBytes(pkAll),
        2: rawBytes(keyImage),
        3: rawBytes(sig),
        4: rawBytes(challenges),
      },
    });
  }
}
