import { Contract } from '@algorandfoundation/tealscript';
import {
  BLS12381_CURVE_ORDER_HEX,
  BLS12381_FIELD_MODULUS_HEX,
  BLS12381G1_LENGTH,
  RING_SIG_CHALL_LENGTH,
  RING_SIG_NONCE_LENGTH,
} from './Constants';
import { RingLinkLSig0 } from './RingLinkLSig0.algo';
import { RingLinkLSig1 } from './RingLinkLSig1.algo';
import { RingLinkLSig2 } from './RingLinkLSig2.algo';
import { RingLinkLSig3 } from './RingLinkLSig3.algo';
import { RingLinkLSig4 } from './RingLinkLSig4.algo';
import { RingLinkLSig5 } from './RingLinkLSig5.algo';
import { RingLinkLSig6 } from './RingLinkLSig6.algo';

export class TownHall extends Contract {
  // Players:

  player1AlgoAddr = GlobalStateKey<Address>();

  player2AlgoAddr = GlobalStateKey<Address>();

  player3AlgoAddr = GlobalStateKey<Address>();

  player4AlgoAddr = GlobalStateKey<Address>();

  player5AlgoAddr = GlobalStateKey<Address>();

  player6AlgoAddr = GlobalStateKey<Address>();

  // Roles:
  maffia = GlobalStateKey<Address>();

  doctor = GlobalStateKey<Address>();

  farmer = GlobalStateKey<Address>();

  butcher = GlobalStateKey<Address>();

  innkeep = GlobalStateKey<Address>();

  grocer = GlobalStateKey<Address>();

  // Ring Signature State:

  // PK BOXES
  // We want to store the ephemeral PKs in a way that allows for easy access for when they are included in a ring signature.
  quickAccessPKBoxes = BoxMap<uint64, bytes>(); // Boxes containing PK bytes, accessible by [boxId][offsetIndex].

  // HashFilter BOXES
  // We want a simple way to ensure that an ephemeral PK or a key image (KI) are not submitted twice.
  hashFilter = BoxMap<bytes, bytes>(); // HashFilter with box titles = Hash(public key) or Hash/(key image)

  // Day States

  // playerVote = GlobalStateMap<bytes, uint64>({
  //   maxKeys: 6,
  // });

  justKilledPlayer = GlobalStateKey<Address>();

  justKilledTimeOfDeath = GlobalStateKey<uint64>();

  // Night States

  maffiaCommitment = GlobalStateKey<bytes>();

  doctorCommitment = GlobalStateKey<bytes>();

  maffiaVictim = GlobalStateKey<bytes>();

  doctorPatient = GlobalStateKey<bytes>();

  // Game States:

  playersJoined = GlobalStateKey<uint64>();

  gameState = GlobalStateKey<uint64>();

  createApplication(): void {
    this.player1AlgoAddr.value = globals.zeroAddress;
    this.player2AlgoAddr.value = globals.zeroAddress;
    this.player3AlgoAddr.value = globals.zeroAddress;
    this.player4AlgoAddr.value = globals.zeroAddress;
    this.player5AlgoAddr.value = globals.zeroAddress;
    this.player6AlgoAddr.value = globals.zeroAddress;

    this.maffia.value = globals.zeroAddress;
    this.doctor.value = globals.zeroAddress;
    this.farmer.value = globals.zeroAddress;
    this.butcher.value = globals.zeroAddress;
    this.innkeep.value = globals.zeroAddress;
    this.grocer.value = globals.zeroAddress;

    this.playersJoined.value = 0;

    /*     this.justKilledPlayer.value = globals.zeroAddress;
    this.justKilledTimeOfDeath.value = 0;

    this.maffiaCommitment.value = new Uint8Array(0);
    this.doctorCommitment.value = new Uint8Array(0);
 */
    this.gameState.value = 0;
    // 0 = lobby
    // 1 = assign roles
    // 2 = dayVote
    // 3 = dayLynch
    // 4 = dayReveal
    // 5 = nightMaffiaCommitment
    // 6 = nightDoctorCommitment
    // 7 = dawnMaffiaReveal
    // 8 = dawnDoctorReveal
    // 9 = dawnDeadOrSavedReveal
    // 10 = game over
  }

  /** Dummy Op Up
   * Dummy operation to get more opcode budget
   * @i - The number to return, necssary to deduplicate the name
   * @returns the number (but we do nothing with it)
   */
  dummyOpUp(i: uint64): uint64 {
    return i;
  }

  /* Cryptography Utils Functions Start Here */

  /*
Non-Interactive Zero - Knowledge Proof of Discrete Logarithm Knowledge(DLOG)

Given x = g ^ a, prove knowledge of a without revealing it.

1: Prover samples a random r < - Z_q and computes v = g ^ r.
2: Challenge is calculated as hash(g, x, v).
3: Prover computes z = r - c * a.
4: Verifier accepts iff v == g ^ z * x ^ c.

Normally step 2 involves the verifier sampling c and sending it to the prover.
However, we use the Fiat - Shamir heuristic to turn this protocol NON - INTERACTIVE.

Since v = g ^ r, z = r - c * a and x = g ^ a, step 4 is
--> g ^ r == g ^ (r - c * a) * (g ^ a) ^ c == g ^ r * g ^ -ca * g ^ ac == g ^ r

*/
  dlog(g: bytes, x: bytes, v: bytes, z: bytes): boolean {
    // Compute the challenge c
    const hash = keccak256(concat(g, concat(x, v)));
    const challenge = btobigint(hash) % btobigint(hex(BLS12381_CURVE_ORDER_HEX));

    return (
      v === ecAdd('BLS12_381g1', ecScalarMul('BLS12_381g1', g, z), ecScalarMul('BLS12_381g1', x, rawBytes(challenge)))
    );
  }

  hashPointToPoint(point: bytes): bytes {
    const hash = keccak256(point);
    const fpElement = btobigint(hash) % btobigint(hex(BLS12381_FIELD_MODULUS_HEX)); // 4002409555221667393417789825735904156556882819939007885332058136124031650490837864442687629129015664037894272559787;
    // ^This field modulus is so much larger than 2^256 that it will never be required to reduce modulo it
    // This needs to be looked over and converted the ExpandMsgXmd method to properly implement EncodeToG1
    const result = ecMapTo('BLS12_381g1', rawBytes(fpElement));
    return result;
  }

  /* Game Functions Start Here */

  getGameState(): uint64 {
    return this.gameState.value;
  }

  joinGameLobby(NIZK_DLOG: bytes): boolean {
    if (this.gameState.value !== 0) {
      return false;
    }

    if (this.playersJoined.value === 6) {
      return false; // error, should have already moved to the next stage
    }

    const g = extract3(NIZK_DLOG, 0, BLS12381G1_LENGTH);
    const RingPK = extract3(NIZK_DLOG, BLS12381G1_LENGTH, BLS12381G1_LENGTH); // This is the BLS12_381 Ephemeral PK of the player
    const v = extract3(NIZK_DLOG, BLS12381G1_LENGTH * 2, BLS12381G1_LENGTH);
    const z = extract3(NIZK_DLOG, BLS12381G1_LENGTH * 3, 32);

    // Assert that the hash of the public key does not exist in the hash filter

    // Verify ephemeralPK and NIZK_DLOG proof
    if (!this.dlog(g, RingPK, v, z)) {
      return false;
    }

    if (!this.quickAccessPKBoxes(0).exists) {
      this.quickAccessPKBoxes(0).create(BLS12381G1_LENGTH);
    } else {
      this.quickAccessPKBoxes(0).resize(this.quickAccessPKBoxes(0).size + BLS12381G1_LENGTH);
    }

    // Verify that the box exists
    if (!this.quickAccessPKBoxes(0).exists) {
      return false;
    }

    if (this.player1AlgoAddr.value === globals.zeroAddress) {
      this.player1AlgoAddr.value = this.txn.sender;
      // this.player1RingPK.value = RingPK;
      this.quickAccessPKBoxes(0).replace(this.playersJoined.value * BLS12381G1_LENGTH, RingPK);
      this.playersJoined.value += 1;
      return true;
    }
    if (this.player2AlgoAddr.value === globals.zeroAddress) {
      this.player2AlgoAddr.value = this.txn.sender;
      // this.player2RingPK.value = RingPK;
      this.quickAccessPKBoxes(0).replace(this.playersJoined.value * BLS12381G1_LENGTH, RingPK);
      this.playersJoined.value += 1;
      return true;
    }
    if (this.player3AlgoAddr.value === globals.zeroAddress) {
      this.player3AlgoAddr.value = this.txn.sender;
      // this.player3RingPK.value = RingPK;
      this.quickAccessPKBoxes(0).replace(this.playersJoined.value * BLS12381G1_LENGTH, RingPK);
      this.playersJoined.value += 1;
      return true;
    }
    if (this.player4AlgoAddr.value === globals.zeroAddress) {
      this.player4AlgoAddr.value = this.txn.sender;
      // this.player4RingPK.value = RingPK;
      this.quickAccessPKBoxes(0).replace(this.playersJoined.value * BLS12381G1_LENGTH, RingPK);
      this.playersJoined.value += 1;
      return true;
    }
    if (this.player5AlgoAddr.value === globals.zeroAddress) {
      this.player5AlgoAddr.value = this.txn.sender;
      // this.player5RingPK.value = RingPK;
      this.quickAccessPKBoxes(0).replace(this.playersJoined.value * BLS12381G1_LENGTH, RingPK);
      this.playersJoined.value += 1;
      return true;
    }
    if (this.player6AlgoAddr.value === globals.zeroAddress) {
      this.player6AlgoAddr.value = this.txn.sender;
      // this.player6RingPK.value = RingPK;
      this.quickAccessPKBoxes(0).replace(this.playersJoined.value * BLS12381G1_LENGTH, RingPK);
      this.playersJoined.value += 1;
      this.gameState.value = 1; // Go to assign roles
      return true;
    }

    return false; // Error state
  }

  // assignRole(
  //   msg: bytes,
  //   pkAll: bytes,
  //   keyImage: bytes,
  //   sig: bytes,
  //   challenges: bytes,
  //   // pkindex0: uint64,
  //   // pkindex1: uint64,
  //   // pkindex2: uint64,
  //   // pkindex3: uint64,
  //   // pkindex4: uint64,
  //   // pkindex5: uint64,
  //   lsigTxn0: PayTxn,
  //   lsigTxn1: PayTxn,
  //   lsigTxn2: PayTxn,
  //   lsigTxn3: PayTxn,
  //   lsigTxn4: PayTxn,
  //   lsigTxn5: PayTxn,
  //   lsigTxn6: PayTxn
  // ): boolean {
  //   if (this.gameState.value !== 1) {
  //     return false;
  //   }
  //   // To verify a RingSig you need:
  //   // 1. The key image of the signer in question, to prevent duplicate calling/"double spending"
  //   // 2. The message that was signed
  //   // 3. The public keys of the n participants
  //   // 4. Can check that sig and challenges share 0:th value
  //   // 5. The signature itself

  //   // Regarding 1:
  //   assert(!this.hashFilter(rawBytes(sha256(keyImage))).exists); // Has Key Image been used before?
  //   this.hashFilter(rawBytes(sha256(keyImage))).create(0); // This Key Image can no longer be used

  //   // Regarding 2: The message is a concatenation of the calling address and this contract's address
  //   assert(msg === concat(rawBytes(this.txn.sender), rawBytes(this.app.address.authAddr)));

  //   // Regarding 3: Verify PKs are correct:
  //   assert(this.quickAccessPKBoxes(0).extract(0, 6 * BLS12381G1_LENGTH) === pkAll);

  //   // Regarding 4: Verify Sig and Challenges share 0:th value
  //   assert(extract3(sig, 0, RING_SIG_NONCE_LENGTH) === extract3(challenges, 0, RING_SIG_CHALL_LENGTH));

  //   // Regarding 5: Verify Correct RingSig Links Calculation

  //   verifyTxn(lsigTxn0, { sender: Address.fromBytes(RingLinkLSig0.address()) });
  //   verifyTxn(lsigTxn1, { sender: Address.fromBytes(RingLinkLSig1.address()) });
  //   verifyTxn(lsigTxn2, { sender: Address.fromBytes(RingLinkLSig2.address()) });
  //   verifyTxn(lsigTxn3, { sender: Address.fromBytes(RingLinkLSig3.address()) });
  //   verifyTxn(lsigTxn4, { sender: Address.fromBytes(RingLinkLSig4.address()) });
  //   verifyTxn(lsigTxn5, { sender: Address.fromBytes(RingLinkLSig5.address()) });
  //   verifyTxn(lsigTxn6, { sender: Address.fromBytes(RingLinkLSig6.address()) });

  //   if (this.maffia.value === globals.zeroAddress) {
  //     this.maffia.value = this.txn.sender.authAddr;
  //     return true;
  //   }
  //   if (this.doctor.value === globals.zeroAddress) {
  //     this.doctor.value = this.txn.sender.authAddr;
  //     return true;
  //   }
  //   if (this.farmer.value === globals.zeroAddress) {
  //     this.farmer.value = this.txn.sender.authAddr;
  //     return true;
  //   }
  //   if (this.butcher.value === globals.zeroAddress) {
  //     this.butcher.value = this.txn.sender.authAddr;
  //     return true;
  //   }
  //   if (this.innkeep.value === globals.zeroAddress) {
  //     this.innkeep.value = this.txn.sender.authAddr;
  //     return true;
  //   }
  //   if (this.grocer.value === globals.zeroAddress) {
  //     this.grocer.value = this.txn.sender.authAddr;
  //     this.gameState.value = 2; // Go to day
  //     return true;
  //   }

  //   return false; // Error state
  // }

  /*

  dayStageVote(): Boolean {
    if (this.gameState.value !== 2) {
      return false;
    }

    // TODO: Implement day stage
    // Each player votes for a player
    // Once all players have voted, proceed to next stage

    // Implement timer as well, to force a decision to be made in time

    return false;
  }

  dayStageLynch(): Boolean {
    if (this.gameState.value !== 3) {
      return false;
    }
    // Tally votes

    // The player with the most votes is lynched; they are removed from the game

    // If there is a draw, a person is killed at random <-- TODO: think over this

    // Set recently killed
    // this.justKilledPlayer = chosenPlayer
    this.justKilledTimeOfDeath.value = globals.latestTimestamp;

    // once lynch is done, proceed to next stage

    return false;
  }

  dayStageRevealRole(): Boolean {
    if (this.gameState.value !== 4) {
      return false;
    }

    if (this.justKilledPlayer.value === this.txn.sender) {
      // Validate proof of role
      // If proof is valid, return deposit
      // reset this.justKilledPlayer = global.zeroAddress
      // reset this.justKilledTimeOfDeath = 0
      // If there are no mafia left, the townsfolk win
      // --> this.gameState = ; // Game over
      // else if there are mafia left, proceed to next stage
      // this.gameState = ; // Go to next stage
    }

    if (this.justKilledTimeOfDeath.value !== 0 && this.justKilledTimeOfDeath.value + 5 < globals.latestTimestamp) {
      // if the player does not reveal their role within time, the game ends and their deposit is forfeited
      // after all, there is no way to know if they were the mafia or not
      // this.gameState = 7; // Game over
    }

    // the justKilledPlayer is set to zero
    return false;
  }

  nightStageMaffiaCommitment(commitment: Uint8Array): Boolean {
    if (this.gameState.value !== 5) {
      return false;
    }

    if (this.txn.sender === this.maffia.value) {
      this.maffiaCommitment.value = commitment;
      this.gameState.value = 6; // Go to next stage
      return true;
    }

    // add timer, to avoid waiting indefinitely
    return false;
  }

  nightStageDoctorCommitment(commitment: bytes32): Boolean {
    if (this.gameState.value !== 6) {
      return false;
    }

    if (this.txn.sender === this.maffia.value) {
      this.doctorCommitment.value = commitment;
      this.gameState.value = 7; // Go to next stage
      return true;
    }

    // add timer, to avoid waiting indefinitely
    return false;
  }

  dawnStageMaffiaReveal(victimAim: Uint8Array, nonce: Uint8Array): Boolean {
    if (this.gameState.value !== 7) {
      return false;
    }

    if (this.txn.sender !== this.maffia.value) {
      return false; // Error state
    }

    if (sha256(concat(victimAim, nonce)) === this.maffiaCommitment.value) {
      this.maffiaVictim.value = this.maffiaCommitment.value;
      this.gameStateState.value = 8;
      return true;
    }

    return false;
  }

  dawnStageDoctorReveal(saveAim: Uint8Array, nonce: Uint8Array): Boolean {
    if (this.gameState.value !== 8) {
      return false;
    }

    if (this.txn.sender !== this.doctor.value) {
      return false; // Error state
    }

    if (sha256(concat(saveAim, nonce)) === this.doctorCommitment.value) {
      this.doctorPatient.value = this.maffiaCommitment.value;
      this.gameStateState.value = 9;
      return true;
    }

    return false;
  }

  dawnStageDeadOrSaved(): Boolean {
    if (this.gameState.value !== 9) {
      return false;
    }
    const chosenPlayer = this.maffiaVictim.value;
    const dead = this.maffiaVictim.value !== this.doctorPatient.value;

    // TODO: we can check here if the doctor is saving the same person twice
    // According to some rules, the doctor can not save the same person twice in a row
    // We also don't want the doctor to save themselves, but implementing that would require
    // using some kind of DLEQ proof that the underlying value of a once encrypted and a twice encrypted
    // value are not the same.

    // reset a bunch of values here
    // this.maffiaCommitment = new Uint8Array(0);
    // this.doctorCommitment = new Uint8Array(0);
    // this.maffiaVictim = new Uint8Array(0);
    // this.doctorPatient = new Uint8Array(0);

    if (!dead) {
      // The victim was saved
      // The game continues
      this.gameState.value = 2;
      return true;
    }

    // The victim was not saved
    // Set recently killed
    // this.justKilledPlayer = chosenPlayer
    this.justKilledTimeOfDeath.value = globals.latestTimestamp;
    this.gameState.value = 10;
    return true;
  }

  dawnStageRevealRole(): Boolean {
    // This stage is a little unnecessary since it is illogical for he maffia to kill themselves
    // It would be simpler to assume that the maffia would never kill themselves and just check instead
    // if the number of non-maffia players alive is enough to continue the game or if the maffia won
    // But we'll keep this stage. At the very least, it will let the maffia know if they've killed the doctor or not

    if (this.gameState.value !== 10) {
      return false;
    }

    if (this.justKilledPlayer.value === this.txn.sender) {
      // Validate proof of role
      // If proof is valid, return deposit
      // reset this.justKilledPlayer = global.zeroAddress
      // reset this.justKilledTimeOfDeath = 0
      // If there are no mafia left, the townsfolk win
      // --> this.gameState = ; // Game over
      // else if there are mafia left, proceed to next stage
      // this.gameState = ; // Go to next stage
    }

    if (this.justKilledTimeOfDeath.value !== 0 && this.justKilledTimeOfDeath.value + 5 < globals.latestTimestamp) {
      // if the player does not reveal their role within time, the game ends and their deposit is forfeited
      // after all, there is no way to know if they were the mafia or not
      // this.gameState = 7; // Game over
    }

    // the justKilledPlayer is set to zero
    return false;
  }

  gameOver(): Boolean {
    if (this.gameState.value !== 11) {
      return false;
    }
    // return deposits to all players
    // clear out any boxxes
    // delete contract
    return true;
  } */
}
