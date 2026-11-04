import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import wallet from "../../devnet-wallet.json";
import {
  createSignerFromKeypair,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { fetchAsset, mplCore, transfer } from "@metaplex-foundation/mpl-core";
import { base58 } from "@metaplex-foundation/umi/serializers";

const umi = createUmi(
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
);

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(signerIdentity(signer));
umi.use(mplCore());

const assetAddress = publicKey("HKKLeBUG7QhEMFyiA9MRSpZjyMrmen4qove32YaywUFK");
const newOwner = publicKey("6E7HAX9j75mgr6qGpBhK1Cb7AFn4hQkNyHJiUvd6zaDB");

(async () => {
  try {
    const asset = await fetchAsset(umi, assetAddress);
    console.log(`owner before: ${asset.owner}`);

    const tx = await transfer(umi, {
      asset,
      newOwner,
    }).sendAndConfirm(umi);

    const signature = base58.deserialize(tx.signature)[0];
    console.log(`transfer signature: ${signature}`);

    const updated = await fetchAsset(umi, assetAddress, {
      commitment: "confirmed",
    });
    console.log(`owner after: ${updated.owner}`);
  } catch (e) {
    console.log(`error ${e}`);
  }
})();
