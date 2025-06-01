/* eslint-disable prettier/prettier */
import { LogicSig } from '@algorandfoundation/tealscript';
import { LSIG_FUND_AMOUNT, RING_SIG_LINKS_AMNT } from './Constants';

export class FunderLSig extends LogicSig {
  APP_ID = TemplateVar<AppID>();

  /** logic: Funder
   * The logic signature for the Funder contract.
   * This contract is used to fund the ring signature.
   * The day algo address will use it to fund the equivalent night algo address.
   */
  logic(): void {

    // Verify that assignRole from the right TownHall contract is being called
    const appCall = this.txnGroup[this.txn.groupIndex + RING_SIG_LINKS_AMNT + 1];
    assert(appCall.applicationID === this.APP_ID);
    assert(
      appCall.applicationArgs[0] ===
      method('assignRole(byte[],byte[],byte[],byte[],byte[],pay,pay,pay,pay,pay,pay,pay)void')
    );

    // msg is a concatenation of the ring sig's signer and the app address
    const msg = appCall.applicationArgs[1];

    verifyPayTxn(this.txn, {
      amount: LSIG_FUND_AMOUNT,
      fee: 0,
      closeRemainderTo: globals.zeroAddress,
      rekeyTo: globals.zeroAddress,
    })

    // Asserting here since not possible to convert to bytes in verifyPayTxn
    assert(rawBytes(this.txn.receiver) === extract3(msg, 2, 32));
  }
}
