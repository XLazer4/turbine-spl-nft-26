import {
  appendTransactionMessageInstructions,
  assertIsTransactionWithBlockhashLifetime,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  generateKeyPairSigner,
  getSignatureFromTransaction,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";
import {
  getInitializeMintInstruction,
  getMintSize,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import { getCreateAccountInstruction } from "@solana-program/system";

import wallet from "../../devnet-wallet.json";

const rpc = createSolanaRpc("https://api.devnet.solana.com");

const rpcSubscriptions = createSolanaRpcSubscriptions(
  "wss://api.devnet.solana.com",
);

const DECIMALS = 6;

(async () => {
  try {
    const signer = await createKeyPairSignerFromBytes(new Uint8Array(wallet));

    const mint = await generateKeyPairSigner();

    const space = BigInt(getMintSize());
    const rent = await rpc.getMinimumBalanceForRentExemption(space).send();

    const createAccountIx = getCreateAccountInstruction({
      payer: signer,
      newAccount: mint,
      lamports: rent,
      space,
      programAddress: TOKEN_PROGRAM_ADDRESS,
    });

    const initializeMintIx = getInitializeMintInstruction({
      mint: mint.address,
      decimals: DECIMALS,
      mintAuthority: signer.address,
      freezeAuthority: signer.address,
    });

    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    const msg = createTransactionMessage({ version: 0 });

    const msgWithPayer = setTransactionMessageFeePayerSigner(signer, msg);

    const msgWithLifetime = setTransactionMessageLifetimeUsingBlockhash(
      latestBlockhash,
      msgWithPayer,
    );

    const txMessage = appendTransactionMessageInstructions(
      [createAccountIx, initializeMintIx],
      msgWithLifetime,
    );

    const signedTx = await signTransactionMessageWithSigners(txMessage);

    assertIsTransactionWithBlockhashLifetime(signedTx);

    const signature = getSignatureFromTransaction(signedTx);

    const sendAndConfirm = sendAndConfirmTransactionFactory({
      rpc,
      rpcSubscriptions,
    });

    await sendAndConfirm(signedTx, { commitment: "confirmed" });

    console.log(`mint address: ${mint.address}`);
    console.log(`init txid: ${signature}`);
  } catch (error) {
    console.log(error);
  }
})();
