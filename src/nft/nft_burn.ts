import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import wallet from "../../devnet-wallet.json";
import ownerWallet from "../../devnet-wallet-2.json";
import {
  createSignerFromKeypair,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { burn, fetchAsset, mplCore } from "@metaplex-foundation/mpl-core";
import { base58 } from "@metaplex-foundation/umi/serializers";

const umi = createUmi(
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
);

const payer = createSignerFromKeypair(
  umi,
  umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet)),
);
const owner = createSignerFromKeypair(
  umi,
  umi.eddsa.createKeypairFromSecretKey(new Uint8Array(ownerWallet)),
);

umi.use(signerIdentity(payer));
umi.use(mplCore());

const assetAddress = publicKey("HKKLeBUG7QhEMFyiA9MRSpZjyMrmen4qove32YaywUFK");

const sol = (lamports: bigint) => (Number(lamports) / 1e9).toFixed(9);

(async () => {
  try {
    const asset = await fetchAsset(umi, assetAddress);
    console.log(`asset: ${asset.publicKey}, name: ${asset.name}, owner: ${asset.owner}`);
    console.log(`rent held by asset: ${sol(asset.header.lamports.basisPoints)} SOL`);

    const payerBefore = await umi.rpc.getBalance(payer.publicKey);
    const ownerBefore = await umi.rpc.getBalance(owner.publicKey);

    const tx = await burn(umi, {
      asset,
      authority: owner,
    }).sendAndConfirm(umi);

    const signature = base58.deserialize(tx.signature)[0];
    console.log(`burn signature: ${signature}`);

    const opts = { commitment: "confirmed" as const };
    const payerAfter = await umi.rpc.getBalance(payer.publicKey, opts);
    const ownerAfter = await umi.rpc.getBalance(owner.publicKey, opts);
    const leftover = await umi.rpc.getAccount(assetAddress, opts);

    console.log(
      `payer ${payer.publicKey}: ${sol(payerBefore.basisPoints)} -> ${sol(payerAfter.basisPoints)} SOL`,
    );
    console.log(
      `owner ${owner.publicKey}: ${sol(ownerBefore.basisPoints)} -> ${sol(ownerAfter.basisPoints)} SOL`,
    );
    console.log(
      leftover.exists
        ? `asset account left with ${leftover.data.length} byte(s), ${sol(leftover.lamports.basisPoints)} SOL`
        : "asset account closed",
    );
  } catch (e) {
    console.log(`error ${e}`);
  }
})();
