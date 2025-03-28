import { Contract } from '@algorandfoundation/tealscript';
import {
  BLS12381_CURVE_ORDER_HEX,
  BLS12381_FIELD_MODULUS_HEX,
  BLS12381G1_BASEPOINT_BYTES,
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

// Would ideally be an ENUM but they are not supported at this point
const stateJoinGameLobby = 0;
const stateAssignRole = stateJoinGameLobby + 1;
const stateDayStageVote = stateAssignRole + 1;
const stateDayStageEliminate = stateDayStageVote + 1;
const stateDayStageReveal = stateDayStageEliminate + 1;
const stateNightStageMafiaCommit = stateDayStageReveal + 1;
const stateNightStageDoctorCommit = stateNightStageMafiaCommit + 1;
const stateDawnStageMafiaReveal = stateNightStageDoctorCommit + 1;
const stateDawnStageDoctorReveal = stateDawnStageMafiaReveal + 1;
const stateDawnStageDeadOrSaved = stateDawnStageDoctorReveal + 1;
const stateDawnStageRevealRoles = stateDawnStageDeadOrSaved + 1;
const stateGameOver = stateDawnStageRevealRoles + 1;

export class TownHall extends Contract {
  // Players:

  player1AlgoAddr = GlobalStateKey<Address>();

  player2AlgoAddr = GlobalStateKey<Address>();

  player3AlgoAddr = GlobalStateKey<Address>();

  player4AlgoAddr = GlobalStateKey<Address>();

  player5AlgoAddr = GlobalStateKey<Address>();

  player6AlgoAddr = GlobalStateKey<Address>();

  // Roles:
  mafia = GlobalStateKey<Address>();

  mafiaKeyImage = GlobalStateKey<bytes>();

  doctor = GlobalStateKey<Address>();

  doctorKeyImage = GlobalStateKey<bytes>();

  farmer = GlobalStateKey<Address>();

  butcher = GlobalStateKey<Address>();

  innkeep = GlobalStateKey<Address>();

  grocer = GlobalStateKey<Address>();

  // Ring Signature State:

  // PK BOXES
  // We want to store the ephemeral PKs in a way that allows for easy access for when they are included in a ring signature.
  quickAccessPKBoxes = BoxMap<uint64, bytes>(); // Boxes containing PK bytes, accessible by [boxId][offsetIndex].

  // HashFilter BOXES
  // We want a simple way to ensure that an ephemeral PK or a key image (KI) is not submitted twice.
  hashFilter = BoxMap<bytes, bytes>(); // HashFilter with box titles = Hash(public key) or Hash/(key image)

  // Day States

  player1HasVoted = GlobalStateKey<uint64>();

  player1ReceivedVotes = GlobalStateKey<uint64>();

  player2HasVoted = GlobalStateKey<uint64>();

  player2ReceivedVotes = GlobalStateKey<uint64>();

  player3HasVoted = GlobalStateKey<uint64>();

  player3ReceivedVotes = GlobalStateKey<uint64>();

  player4HasVoted = GlobalStateKey<uint64>();

  player4ReceivedVotes = GlobalStateKey<uint64>();

  player5HasVoted = GlobalStateKey<uint64>();

  player5ReceivedVotes = GlobalStateKey<uint64>();

  player6HasVoted = GlobalStateKey<uint64>();

  player6ReceivedVotes = GlobalStateKey<uint64>();

  playersVoted = GlobalStateKey<uint64>();

  playersAlive = GlobalStateKey<uint64>();

  justEliminatedPlayer = GlobalStateKey<Address>();

  // Night States

  doctorStillAlive = GlobalStateKey<uint64>();

  mafiaCommitment = GlobalStateKey<bytes>();

  doctorCommitment = GlobalStateKey<bytes>();

  mafiaVictim = GlobalStateKey<Address>();

  doctorPatient = GlobalStateKey<Address>();

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

    this.mafia.value = globals.zeroAddress;
    this.doctor.value = globals.zeroAddress;
    this.farmer.value = globals.zeroAddress;
    this.butcher.value = globals.zeroAddress;
    this.innkeep.value = globals.zeroAddress;
    this.grocer.value = globals.zeroAddress;

    this.player1HasVoted.value = 0;
    this.player2HasVoted.value = 0;
    this.player3HasVoted.value = 0;
    this.player4HasVoted.value = 0;
    this.player5HasVoted.value = 0;
    this.player6HasVoted.value = 0;
    this.playersVoted.value = 0;

    this.player1ReceivedVotes.value = 0;
    this.player2ReceivedVotes.value = 0;
    this.player3ReceivedVotes.value = 0;
    this.player4ReceivedVotes.value = 0;
    this.player5ReceivedVotes.value = 0;
    this.player6ReceivedVotes.value = 0;
    this.playersVoted.value = 0;

    this.playersJoined.value = 0;
    this.playersAlive.value = 6;
    this.doctorStillAlive.value = 1;

    this.justEliminatedPlayer.value = globals.zeroAddress;
    this.mafiaVictim.value = globals.zeroAddress;
    this.doctorPatient.value = globals.zeroAddress;

    this.gameState.value = 0;
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

  joinGameLobby(NIZK_DLOG: bytes): void {
    if (this.gameState.value !== stateJoinGameLobby) {
      throw Error('Invalid method call: Game is not in Join Game Lobby state.');
    }

    if (this.playersJoined.value === 6) {
      throw Error('Max players already joined! Error, game should have moved to the next stage already.');
    }

    const g = extract3(NIZK_DLOG, 0, BLS12381G1_LENGTH);
    const RingPK = extract3(NIZK_DLOG, BLS12381G1_LENGTH, BLS12381G1_LENGTH); // This is the BLS12_381 Ephemeral PK of the player
    const v = extract3(NIZK_DLOG, BLS12381G1_LENGTH * 2, BLS12381G1_LENGTH);
    const z = extract3(NIZK_DLOG, BLS12381G1_LENGTH * 3, 32);

    // Assert that the hash of the public key does not exist in the hash filter

    // Verify ephemeralPK and NIZK_DLOG proof
    if (!this.dlog(g, RingPK, v, z)) {
      throw Error('DLOG NIZK Proof failed!');
    }

    if (!this.quickAccessPKBoxes(0).exists) {
      this.quickAccessPKBoxes(0).create(BLS12381G1_LENGTH);
    } else {
      this.quickAccessPKBoxes(0).resize(this.quickAccessPKBoxes(0).size + BLS12381G1_LENGTH);
    }

    // Verify that the box exists
    if (!this.quickAccessPKBoxes(0).exists) {
      throw Error('PK Box failed to be created.');
    }

    this.quickAccessPKBoxes(0).replace(this.playersJoined.value * BLS12381G1_LENGTH, RingPK);
    this.playersJoined.value += 1;

    if (this.player1AlgoAddr.value === globals.zeroAddress) {
      this.player1AlgoAddr.value = this.txn.sender;
      return;
    }
    if (this.player2AlgoAddr.value === globals.zeroAddress) {
      this.player2AlgoAddr.value = this.txn.sender;
      return;
    }
    if (this.player3AlgoAddr.value === globals.zeroAddress) {
      this.player3AlgoAddr.value = this.txn.sender;
      return;
    }
    if (this.player4AlgoAddr.value === globals.zeroAddress) {
      this.player4AlgoAddr.value = this.txn.sender;
      return;
    }
    if (this.player5AlgoAddr.value === globals.zeroAddress) {
      this.player5AlgoAddr.value = this.txn.sender;
      return;
    }
    if (this.player6AlgoAddr.value === globals.zeroAddress) {
      this.player6AlgoAddr.value = this.txn.sender;
      this.gameState.value = stateAssignRole; // Go to next stage.
      return;
    }

    throw Error('Invalid state! Error, game should have moved to the next stage already.');
  }

  assignRole(
    msg: bytes,
    pkAll: bytes,
    keyImage: bytes,
    sig: bytes,
    challenges: bytes,
    lsigTxn0: PayTxn,
    lsigTxn1: PayTxn,
    lsigTxn2: PayTxn,
    lsigTxn3: PayTxn,
    lsigTxn4: PayTxn,
    lsigTxn5: PayTxn
  ): void {
    if (this.gameState.value !== stateAssignRole) {
      throw Error('Invalid method call: Game is not in Assign Role state.');
    }
    // To verify a RingSig you need:
    // 1. The key image of the signer in question, to prevent duplicate calling/"double spending"
    // 2. The message that was signed
    // 3. The public keys of the n participants
    // 4. Can check that sig and challenges share 0:th value
    // 5. The signature itself

    // Regarding 1:
    // TODO:
    assert(
      !this.hashFilter(rawBytes(sha256(keyImage))).exists,
      'KeyImage already in store. Are you trying to double-dip with your ring signature?'
    ); // Has Key Image been used before?
    this.hashFilter(rawBytes(sha256(keyImage))).create(0); // This Key Image can no longer be used

    // Regarding 2: The message is a concatenation of the calling address and this contract's address
    // TODO: Fix msg
    // assert(msg === concat(rawBytes(this.txn.sender), rawBytes(this.app.address)));
    assert(msg === 'Hello World', 'Invalid msg value to have been signed!');

    // Regarding 3: Verify PKs are correct:
    assert(
      this.quickAccessPKBoxes(0).extract(0, 6 * BLS12381G1_LENGTH) === pkAll,
      'Invalid PKs! Are you trying to pass in a different ring of PKs?'
    );

    // Regarding 4: Verify Sig and Challenges share 0:th value
    assert(
      extract3(sig, 0, RING_SIG_NONCE_LENGTH) === extract3(challenges, 0, RING_SIG_CHALL_LENGTH),
      'The Ring Sig Nonces and Ring Sig Intermediate Challenge Values must start with the same value!'
    );

    // Regarding 5: Verify Correct RingSig Links Calculation

    verifyTxn(lsigTxn0, { sender: Address.fromBytes(RingLinkLSig0.address()) });
    verifyTxn(lsigTxn1, { sender: Address.fromBytes(RingLinkLSig1.address()) });
    verifyTxn(lsigTxn2, { sender: Address.fromBytes(RingLinkLSig2.address()) });
    verifyTxn(lsigTxn3, { sender: Address.fromBytes(RingLinkLSig3.address()) });
    verifyTxn(lsigTxn4, { sender: Address.fromBytes(RingLinkLSig4.address()) });
    verifyTxn(lsigTxn5, { sender: Address.fromBytes(RingLinkLSig5.address()) });

    // TODO: introduce some type of randomness here, so that it is more difficult for someone
    // to be able to influence which role they will get. Currently it is just whichever player
    // was able to get their transaction in first, and if they happen to be the block proposer
    // they will be able to control the order of transactions.

    if (this.mafia.value === globals.zeroAddress) {
      this.mafia.value = this.txn.sender;
      this.mafiaKeyImage.value = keyImage;
      return;
    }
    if (this.doctor.value === globals.zeroAddress) {
      this.doctor.value = this.txn.sender;
      this.doctorKeyImage.value = keyImage;
      return;
    }
    if (this.farmer.value === globals.zeroAddress) {
      this.farmer.value = this.txn.sender;
      return;
    }
    if (this.butcher.value === globals.zeroAddress) {
      this.butcher.value = this.txn.sender;
      return;
    }
    if (this.innkeep.value === globals.zeroAddress) {
      this.innkeep.value = this.txn.sender;
      return;
    }
    if (this.grocer.value === globals.zeroAddress) {
      this.grocer.value = this.txn.sender;
      this.gameState.value = stateDayStageVote; // Go to day
      return;
    }

    throw Error('Invalid state! Error, game should have moved to the next stage already.');
  }

  dayStageVote(vote: uint64): void {
    if (this.gameState.value !== stateDayStageVote) {
      throw Error('Invalid method call: Game is not in Day Stage Vote state.');
    }

    assert(vote > 0 && vote < 7, 'Invalid vote: Vote must be int 1 <= n <= 6.');

    assert(this.txn.sender !== globals.zeroAddress, 'Sending from global zero address is not allowed.');

    if (vote === 1 && this.player1AlgoAddr.value !== globals.zeroAddress) {
      this.player1ReceivedVotes.value += 1;
    } else if (vote === 2 && this.player2AlgoAddr.value !== globals.zeroAddress) {
      this.player2ReceivedVotes.value += 1;
    } else if (vote === 3 && this.player3AlgoAddr.value !== globals.zeroAddress) {
      this.player3ReceivedVotes.value += 1;
    } else if (vote === 4 && this.player4AlgoAddr.value !== globals.zeroAddress) {
      this.player4ReceivedVotes.value += 1;
    } else if (vote === 5 && this.player5AlgoAddr.value !== globals.zeroAddress) {
      this.player5ReceivedVotes.value += 1;
    } else if (vote === 6 && this.player6AlgoAddr.value !== globals.zeroAddress) {
      this.player6ReceivedVotes.value += 1;
    } else {
      throw Error('Invalid vote: Is player still alive?');
    }

    if (this.txn.sender === this.player1AlgoAddr.value && this.player1HasVoted.value === 0) {
      this.player1HasVoted.value = 1;
    } else if (this.txn.sender === this.player2AlgoAddr.value && this.player2HasVoted.value === 0) {
      this.player2HasVoted.value = 1;
    } else if (this.txn.sender === this.player3AlgoAddr.value && this.player3HasVoted.value === 0) {
      this.player3HasVoted.value = 1;
    } else if (this.txn.sender === this.player4AlgoAddr.value && this.player4HasVoted.value === 0) {
      this.player4HasVoted.value = 1;
    } else if (this.txn.sender === this.player5AlgoAddr.value && this.player5HasVoted.value === 0) {
      this.player5HasVoted.value = 1;
    } else if (this.txn.sender === this.player6AlgoAddr.value && this.player6HasVoted.value === 0) {
      this.player6HasVoted.value = 1;
    } else {
      throw Error('Address not allowed to vote.'); // Error state, player has already voted, or not actually player voting
    }

    this.playersVoted.value += 1;

    if (this.playersVoted.value === this.playersAlive.value) {
      // All players have voted
      this.gameState.value = stateDayStageEliminate; // Go to next stage

      // Reset all votes
      this.playersVoted.value = 0;
      this.player1HasVoted.value = 0;
      this.player2HasVoted.value = 0;
      this.player3HasVoted.value = 0;
      this.player4HasVoted.value = 0;
      this.player5HasVoted.value = 0;
      this.player6HasVoted.value = 0;
    }

    // TODO: Implement timer as well, to force a decision to be made in time and prevent the game from stalling
  }

  dayStageEliminate(): void {
    if (this.gameState.value !== stateDayStageEliminate) {
      throw Error('Invalid method call: Game is not in Day Stage Eliminate state.');
    }

    this.justEliminatedPlayer.value = globals.zeroAddress;
    let topVotes = 0;

    // Sometimes we get a draw, in which case we need to have a tiebreaker
    // We check if the global round is even or odd and use that as our tiebreaker
    // Definitely NOT the best way to do this, but it's a simple way to do it

    const even = globals.round % 2 === 0;

    if (this.player1ReceivedVotes.value > topVotes || (this.player1ReceivedVotes.value === topVotes && even)) {
      this.justEliminatedPlayer.value = this.player1AlgoAddr.value;
      topVotes = this.player1ReceivedVotes.value;
    }

    if (this.player2ReceivedVotes.value > topVotes || (this.player2ReceivedVotes.value === topVotes && even)) {
      this.justEliminatedPlayer.value = this.player2AlgoAddr.value;
      topVotes = this.player2ReceivedVotes.value;
    }

    if (this.player3ReceivedVotes.value > topVotes || (this.player3ReceivedVotes.value === topVotes && even)) {
      this.justEliminatedPlayer.value = this.player3AlgoAddr.value;
      topVotes = this.player3ReceivedVotes.value;
    }

    if (this.player4ReceivedVotes.value > topVotes || (this.player4ReceivedVotes.value === topVotes && even)) {
      this.justEliminatedPlayer.value = this.player4AlgoAddr.value;
      topVotes = this.player4ReceivedVotes.value;
    }

    if (this.player5ReceivedVotes.value > topVotes || (this.player5ReceivedVotes.value === topVotes && even)) {
      this.justEliminatedPlayer.value = this.player5AlgoAddr.value;
      topVotes = this.player5ReceivedVotes.value;
    }

    if (this.player6ReceivedVotes.value > topVotes || (this.player6ReceivedVotes.value === topVotes && even)) {
      this.justEliminatedPlayer.value = this.player6AlgoAddr.value;
      topVotes = this.player6ReceivedVotes.value;
    }

    assert(this.justEliminatedPlayer.value !== globals.zeroAddress, 'Error state: Zero Address won vote!');
    assert(topVotes !== 0, 'Error state: No votes were cast!');

    // justEliminatedPlayer should now be the player with the most votes
    // The player with the most votes is Eliminateed; they are removed from the game

    if (this.justEliminatedPlayer.value === this.player1AlgoAddr.value) {
      this.player1AlgoAddr.value = globals.zeroAddress;
    }

    if (this.justEliminatedPlayer.value === this.player2AlgoAddr.value) {
      this.player2AlgoAddr.value = globals.zeroAddress;
    }

    if (this.justEliminatedPlayer.value === this.player3AlgoAddr.value) {
      this.player3AlgoAddr.value = globals.zeroAddress;
    }

    if (this.justEliminatedPlayer.value === this.player4AlgoAddr.value) {
      this.player4AlgoAddr.value = globals.zeroAddress;
    }

    if (this.justEliminatedPlayer.value === this.player5AlgoAddr.value) {
      this.player5AlgoAddr.value = globals.zeroAddress;
    }

    if (this.justEliminatedPlayer.value === this.player6AlgoAddr.value) {
      this.player6AlgoAddr.value = globals.zeroAddress;
    }

    this.playersAlive.value -= 1;

    // Reset all votes

    this.player1ReceivedVotes.value = 0;
    this.player2ReceivedVotes.value = 0;
    this.player3ReceivedVotes.value = 0;
    this.player4ReceivedVotes.value = 0;
    this.player5ReceivedVotes.value = 0;
    this.player6ReceivedVotes.value = 0;

    this.gameState.value = stateDayStageReveal; // Go to next stage
  }

  dayStageRevealRole(BLS_PRIVATE: bytes): void {
    if (this.gameState.value !== stateDayStageReveal) {
      throw Error('Invalid method call: Game is not in Day Stage Reveal state.');
    }

    assert(this.justEliminatedPlayer.value === this.txn.sender, 'Error state: Other player called method.');
    // TODO: Implement timer, to avoid everyone waiting indefinitely on a reluctant eliminated player.

    const BLS_PK = ecScalarMul('BLS12_381g1', BLS12381G1_BASEPOINT_BYTES, BLS_PRIVATE);
    const hashToPoint = this.hashPointToPoint(BLS_PK);
    const genKeyImage = ecScalarMul('BLS12_381g1', hashToPoint, BLS_PRIVATE);

    if (genKeyImage === this.mafiaKeyImage.value) {
      // The village eliminated the mafia!
      // The townsfolk have won!
      this.gameState.value = stateGameOver;
      return;
    }

    if (genKeyImage === this.doctorKeyImage.value) {
      // The village eliminated the doctor! Uh oh.
      this.gameState.value = stateNightStageMafiaCommit;
      this.doctorStillAlive.value = 0;
    }

    this.justEliminatedPlayer.value = globals.zeroAddress;
  }

  nightStageMafiaCommit(commitment: bytes): void {
    if (this.gameState.value !== stateNightStageMafiaCommit) {
      throw Error('Invalid method call: Game is not in Night Stage Maffia Commit state.');
    }

    assert(this.txn.sender === this.mafia.value, 'Error state: Non-mafia player called method.');

    this.mafiaCommitment.value = commitment;

    if (this.doctorStillAlive.value === 0) {
      // If doctor is dead, no point in waiting for them to commit
      this.gameState.value = stateDawnStageMafiaReveal;
    } else {
      this.gameState.value = stateNightStageDoctorCommit;
    }
  }

  nightStageDoctorCommit(commitment: bytes): void {
    if (this.gameState.value !== stateNightStageDoctorCommit) {
      throw Error('Invalid method call: Game is not in Night Stage Doctor Commit state.');
    }

    assert(this.txn.sender === this.doctor.value, 'Error state: Non-doctor player called method.');
    assert(this.doctorStillAlive.value === 1, 'Error state: Doctor is dead, should not have entered this state.');

    this.doctorCommitment.value = commitment;

    this.gameState.value = stateDawnStageMafiaReveal;
  }

  dawnStageMafiaReveal(victimAim: Address, blinder: bytes): void {
    if (this.gameState.value !== stateDawnStageMafiaReveal) {
      throw Error('Invalid method call: Game is not in Dawn Stage Maffia Reveal state.');
    }

    assert(this.txn.sender === this.mafia.value, 'Error state: Non-mafia player called method.');

    assert(this.mafiaVictim.value === globals.zeroAddress, 'Error state: Mafia has already committed to a victim.');

    assert(victimAim !== globals.zeroAddress, 'Error state: Victim must be a valid address.');

    // TODO: Implement timer logic that handles the case where the mafia doesn't call this method (successfully) in time

    const reveal = sha256(concat(victimAim, blinder));

    assert(
      rawBytes(reveal) === this.mafiaCommitment.value,
      'Error state: Provided address + blinder does NOT match commitment.'
    );

    if (victimAim === this.player1AlgoAddr.value) {
      this.mafiaVictim.value = this.player1AlgoAddr.value;
    } else if (victimAim === this.player2AlgoAddr.value) {
      this.mafiaVictim.value = this.player2AlgoAddr.value;
    } else if (victimAim === this.player3AlgoAddr.value) {
      this.mafiaVictim.value = this.player3AlgoAddr.value;
    } else if (victimAim === this.player4AlgoAddr.value) {
      this.mafiaVictim.value = this.player4AlgoAddr.value;
    } else if (victimAim === this.player5AlgoAddr.value) {
      this.mafiaVictim.value = this.player5AlgoAddr.value;
    } else if (victimAim === this.player6AlgoAddr.value) {
      this.mafiaVictim.value = this.player6AlgoAddr.value;
    } else {
      throw Error('Error state: Victim must be a player!');
    }

    // Reset commitment
    // TODO: this.mafiaCommitment.value = hex('0');

    this.gameState.value = stateDawnStageDoctorReveal;
  }

  dawnStageDoctorReveal(patientAim: Address, blinder: bytes): void {
    if (this.gameState.value !== stateDawnStageDoctorReveal) {
      throw Error('Invalid method call: Game is not in Dawn Stage Doctor Reveal state.');
    }

    assert(this.txn.sender === this.doctor.value, 'Error state: Non-doctor player called method.');

    assert(this.doctorPatient.value === globals.zeroAddress, 'Error state: Doctor has already committed to a patient.');

    assert(patientAim !== globals.zeroAddress, 'Error state: Patient must be a valid address.');

    // TODO: Implement timer logic that handles the case where the mafia doesn't call this method (successfully) in time

    const reveal = sha256(concat(patientAim, blinder));

    assert(
      rawBytes(reveal) === this.doctorCommitment.value,
      'Error state: Provided address + blinder does NOT match commitment.'
    );

    if (patientAim === this.player1AlgoAddr.value) {
      this.doctorPatient.value = this.player1AlgoAddr.value;
    } else if (patientAim === this.player2AlgoAddr.value) {
      this.doctorPatient.value = this.player2AlgoAddr.value;
    } else if (patientAim === this.player3AlgoAddr.value) {
      this.doctorPatient.value = this.player3AlgoAddr.value;
    } else if (patientAim === this.player4AlgoAddr.value) {
      this.doctorPatient.value = this.player4AlgoAddr.value;
    } else if (patientAim === this.player5AlgoAddr.value) {
      this.doctorPatient.value = this.player5AlgoAddr.value;
    } else if (patientAim === this.player6AlgoAddr.value) {
      this.doctorPatient.value = this.player6AlgoAddr.value;
    } else {
      throw Error('Error state: Victim must be a player!');
    }

    // Reset commitment
    // TODO: this.doctorCommitment.value = hex('0'); ? Is it necessary?

    this.gameState.value = stateDawnStageDeadOrSaved;
  }

  dawnStageDeadOrSaved() {
    if (this.gameState.value !== stateDawnStageDeadOrSaved) {
      throw Error('Invalid method call: Game is not in Dawn Stage DeadOrSaved? state.');
    }

    if (this.mafiaVictim.value === this.doctorPatient.value) {
      // The doctor saved the victim
      // Nothing happened!
      // The game continues
      this.gameState.value = stateDayStageVote;
      return;
    }

    // TODO: look into the possibility preventing the doctor saving the same person twice in a row

    if (this.mafiaVictim.value === this.player1AlgoAddr.value) {
      this.justEliminatedPlayer.value = this.player1AlgoAddr.value;
      this.player1AlgoAddr.value = globals.zeroAddress;
    } else if (this.mafiaVictim.value === this.player2AlgoAddr.value) {
      this.justEliminatedPlayer.value = this.player2AlgoAddr.value;
      this.player2AlgoAddr.value = globals.zeroAddress;
    } else if (this.mafiaVictim.value === this.player3AlgoAddr.value) {
      this.justEliminatedPlayer.value = this.player3AlgoAddr.value;
      this.player3AlgoAddr.value = globals.zeroAddress;
    } else if (this.mafiaVictim.value === this.player4AlgoAddr.value) {
      this.justEliminatedPlayer.value = this.player4AlgoAddr.value;
      this.player4AlgoAddr.value = globals.zeroAddress;
    } else if (this.mafiaVictim.value === this.player5AlgoAddr.value) {
      this.justEliminatedPlayer.value = this.player5AlgoAddr.value;
      this.player5AlgoAddr.value = globals.zeroAddress;
    } else if (this.mafiaVictim.value === this.player6AlgoAddr.value) {
      this.justEliminatedPlayer.value = this.player6AlgoAddr.value;
      this.player6AlgoAddr.value = globals.zeroAddress;
    } else {
      throw Error('Error state: Victim must be a player! Should not have entered this state.');
    }

    this.playersAlive.value -= 1;

    if (this.playersAlive.value <= 2) {
      // The mafia has won!
      this.gameState.value = stateGameOver;
    }
  }

  dawnStageRevealRole(BLS_PRIVATE: bytes): void {
    // This stage is a little unnecessary since it is illogical for he mafia to kill themselves
    // It would be simpler to assume that the mafia would never kill themselves and just check instead
    // if the number of non-mafia players alive is enough to continue the game or if the mafia won
    // But we'll keep this stage. At the very least, it will let the mafia know if they've killed the doctor or not

    if (this.gameState.value !== stateDawnStageRevealRoles) {
      throw Error('Invalid method call: Game is not in Dawn Stage Reveal state.');
    }

    assert(this.justEliminatedPlayer.value === this.txn.sender, 'Error state: Other player called method.');
    // TODO: Implement timer, to avoid everyone waiting indefinitely on a reluctant eliminated player.

    const BLS_PK = ecScalarMul('BLS12_381g1', BLS12381G1_BASEPOINT_BYTES, BLS_PRIVATE);
    const hashToPoint = this.hashPointToPoint(BLS_PK);
    const genKeyImage = ecScalarMul('BLS12_381g1', hashToPoint, BLS_PRIVATE);

    if (genKeyImage === this.mafiaKeyImage.value) {
      // The maffia some how eliminated the mafia!?
      // Impossible scenario in this one with only 1 mafia?
      // The townsfolk have won!
      this.gameState.value = stateGameOver;
      return;
    }

    if (genKeyImage === this.doctorKeyImage.value) {
      // The village eliminated the doctor! Uh oh.
      this.gameState.value = stateNightStageMafiaCommit;
      this.doctorStillAlive.value = 0;
    }

    // Reset the justEliminatedPlayer
    this.justEliminatedPlayer.value = globals.zeroAddress;

    this.gameState.value = stateDayStageVote;
  }

  gameOver(): void {
    if (this.gameState.value !== stateGameOver) {
      throw Error('Invalid method call: Game is not in Game Over state.');
    }
    // TODO: return deposits to all players
    // TODO: clear out any boxxes
    // TODO: delete contract
  }
}
