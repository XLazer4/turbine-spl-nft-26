import {
  createSignerFromKeypair,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import wallet from "../../devnet-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import {
  createMetadataAccountV3,
  CreateMetadataAccountV3InstructionAccounts,
  CreateMetadataAccountV3InstructionArgs,
  DataV2Args,
} from "@metaplex-foundation/mpl-token-metadata";
import bs58 from "bs58";

const mint = publicKey("BAnxCEjbw5fYVhiYm6XJ5VXqDC2tsxe9Jz8ujUWWNQz6");

const umi = createUmi("https://api.devnet.solana.com");

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader({ address: "https://devnet.irys.xyz/" }));
umi.use(signerIdentity(signer));

const NAME = "Turbine Devnet Token";
const SYMBOL = "TURB";

(async () => {
  try {
    const uri = await umi.uploader.uploadJson({
      name: NAME,
      symbol: SYMBOL,
      description: "SPL token minted on devnet for the Turbine SPL/NFT tasks.",
    });
    console.log(`token json uri: ${uri}`);

    const accounts: CreateMetadataAccountV3InstructionAccounts = {
      mint,
      mintAuthority: signer,
    };

    const data: DataV2Args = {
      name: NAME,
      symbol: SYMBOL,
      uri,
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    };

    const args: CreateMetadataAccountV3InstructionArgs = {
      data,
      isMutable: true,
      collectionDetails: null,
    };

    const tx = createMetadataAccountV3(umi, {
      ...accounts,
      ...args,
    });

    const result = await tx.sendAndConfirm(umi);
    console.log("signature: ", bs58.encode(Buffer.from(result.signature)));
  } catch (error) {
    console.log("error", error);
  }
})();
