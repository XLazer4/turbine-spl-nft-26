import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import wallet from "../../devnet-wallet.json";
import {
  createSignerFromKeypair,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { fetchAsset, mplCore, update } from "@metaplex-foundation/mpl-core";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { base58 } from "@metaplex-foundation/umi/serializers";

const umi = createUmi(
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
);

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader({ address: "https://devnet.irys.xyz/" }));
umi.use(signerIdentity(signer));
umi.use(mplCore());

const assetAddress = publicKey("HKKLeBUG7QhEMFyiA9MRSpZjyMrmen4qove32YaywUFK");

const image =
  "https://gateway.irys.xyz/HktQkdkzC4y1YUjHARR4oHo5Gwka97QVLXchAbPkgscF";

const NEW_NAME = "rip NFT v2";

const newMetadata = {
  name: NEW_NAME,
  description: "Name and metadata updated on-chain by the update authority.",
  image,
  attributes: [
    { trait_type: "Program", value: "Turbine" },
    { trait_type: "Network", value: "Devnet" },
    { trait_type: "Version", value: "2" },
  ],
  properties: {
    files: [{ uri: image, type: "image/jpeg" }],
    category: "image",
  },
};

(async () => {
  try {
    const asset = await fetchAsset(umi, assetAddress);
    console.log(`before -> name: ${asset.name}, uri: ${asset.uri}`);

    const newUri = await umi.uploader.uploadJson(newMetadata);
    console.log(`new metadata uri: ${newUri}`);

    const tx = await update(umi, {
      asset,
      name: NEW_NAME,
      uri: newUri,
    }).sendAndConfirm(umi);

    const signature = base58.deserialize(tx.signature)[0];
    console.log(`update signature: ${signature}`);

    const updated = await fetchAsset(umi, assetAddress);
    console.log(`after  -> name: ${updated.name}, uri: ${updated.uri}`);
  } catch (e) {
    console.log(`error ${e}`);
  }
})();
