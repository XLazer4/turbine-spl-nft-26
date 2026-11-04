# turbine-spl-nft-26

Scripts for creating SPL tokens and Metaplex Core NFTs on Solana devnet, done as part of Turbine.

Covers:

1. Minting and transferring an SPL token
2. Minting an NFT with MPL Core
3. Updating the NFT's name and metadata as the update authority
4. Transferring the NFT to another wallet
5. Burning the NFT and reclaiming rent

Everything below was run on devnet. Links go to Solana Explorer.

## Wallets

| | Address |
|---|---|
| Main wallet (`devnet-wallet.json`) | [`gz8k5Mq53YZdYGS2gA6iygwxt7vtG82mLRdEv6pvQ5N`](https://explorer.solana.com/address/gz8k5Mq53YZdYGS2gA6iygwxt7vtG82mLRdEv6pvQ5N?cluster=devnet) |
| Second wallet (`devnet-wallet-2.json`) | [`6E7HAX9j75mgr6qGpBhK1Cb7AFn4hQkNyHJiUvd6zaDB`](https://explorer.solana.com/address/6E7HAX9j75mgr6qGpBhK1Cb7AFn4hQkNyHJiUvd6zaDB?cluster=devnet) |

The main wallet is the mint authority, update authority and fee payer for everything. The second wallet receives the token transfer and the NFT, and signs the burn since it owns the NFT at that point.

## Setup

```bash
npm install
```

Put your devnet keypair at the project root as `devnet-wallet.json` (a JSON array of 64 numbers, same format `solana-keygen` writes). Make a second one for the transfer/burn steps:

```bash
solana-keygen new --no-bip39-passphrase -o devnet-wallet-2.json
```

Both files are gitignored. Fund the main wallet with devnet SOL (`solana airdrop 2 <address> --url devnet` or https://faucet.solana.com). The second wallet doesn't need any SOL.

For the NFT image, put an `image.jpeg` in the project root.

The scripts don't pass values between each other. Each one logs the address or URI the next step needs, and you paste it into the constant at the top of the next script.

## 1. SPL token

Uses `@solana/kit` + `@solana-program/token` for the token instructions and `mpl-token-metadata` (through UMI) for the metadata account.

| Script | Command | What it does |
|---|---|---|
| `src/spl/spl_init.ts` | `npm run spl:init` | Creates a mint account (6 decimals), main wallet as mint and freeze authority |
| `src/spl/spl_metadata.ts` | `npm run spl:metadata` | Uploads a small JSON to Irys and creates the Token Metadata account (name, symbol, uri) |
| `src/spl/spl_mint.ts` | `npm run spl:mint` | Creates the main wallet's ATA if needed and mints 1,000 tokens into it |
| `src/spl/spl_transfer.ts` | `npm run spl:transfer` | Creates the recipient's ATA if needed and sends 100 tokens with `transferChecked` |

ATAs are created with the idempotent instruction so the mint/transfer scripts can be re-run without failing.

Result:

- Token: Turbine Devnet Token (`TURB`)
- Mint: [`BAnxCEjbw5fYVhiYm6XJ5VXqDC2tsxe9Jz8ujUWWNQz6`](https://explorer.solana.com/address/BAnxCEjbw5fYVhiYm6XJ5VXqDC2tsxe9Jz8ujUWWNQz6?cluster=devnet)
- Create mint: [`3Abb4ndH...LSTtepq`](https://explorer.solana.com/tx/3Abb4ndHXxyXHQAzUeyDc5GEs4skbZg9FfiSc5JnXNPxaDgDTGnPnvfVRyDYkF5PhuhQdZcyiMAZR9ksVLSTtepq?cluster=devnet)
- Create metadata: [`43uHi9Jp...tJZHvS5`](https://explorer.solana.com/tx/43uHi9JpRx2RBUNJXdZ2b4nDfccyUwnVidtiyoHUWpRYkm3VZ8s6VViWsZaFLbySrdcvKoCtn77AcT5EVtJZHvS5?cluster=devnet) (off-chain JSON: https://gateway.irys.xyz/3heDThBHAZQDKemLCyJYMUKh8Vrjcw94u9QASM5roie7)
- Mint 1,000 TURB to main wallet ATA `HPcy8hAw...98MuZU`: [`2QT3h4Wb...99qtfLnF`](https://explorer.solana.com/tx/2QT3h4WbyBn9Lc1FRGrgmMjYLxLPRq43UPhCiVrKTVvcqU3H99MpiFWG1hPZBp2PHzqh68xni4uWo6Jo99qtfLnF?cluster=devnet)
- Transfer 100 TURB to second wallet ATA `8QCekaxJ...omAVtw7`: [`HvPZQyoh...TcvAbJ`](https://explorer.solana.com/tx/HvPZQyohaiL8GvX5zDTeZAn6CCbDdMYMnv23tvUP2JAs7FwziH9xxZU6hZEXWkHkMxrJHdJ7JQFLpekDJTcvAbJ?cluster=devnet)

Balances after: main wallet 900 TURB, second wallet 100 TURB.

## 2-5. NFT (MPL Core)

Uses `mpl-core` through UMI. Image and JSON metadata are uploaded to Irys devnet.

| Script | Command | What it does |
|---|---|---|
| `src/nft/nft_image.ts` | `npm run nft:image` | Uploads `image.jpeg`, logs the image URI |
| `src/nft/nft_metadata.ts` | `npm run nft:metadata` | Builds the metadata JSON around that image and uploads it, logs the metadata URI |
| `src/nft/nft_mint.ts` | `npm run nft:mint` | Creates the Core asset with that URI |
| `src/nft/nft_update.ts` | `npm run nft:update` | Uploads new metadata JSON, then sets the new name and URI on the asset |
| `src/nft/nft_transfer.ts` | `npm run nft:transfer` | Transfers the asset from the main wallet to the second wallet |
| `src/nft/nft_burn.ts` | `npm run nft:burn` | Burns the asset (second wallet signs as owner, main wallet pays) and logs the balance changes |

A Core asset keeps its owner, update authority, name and URI on a single account, so there's no mint/token account/metadata PDA to deal with like with Token Metadata NFTs. Update, transfer and burn are each one instruction on that account.

Result, all on asset [`HKKLeBUG7QhEMFyiA9MRSpZjyMrmen4qove32YaywUFK`](https://explorer.solana.com/address/HKKLeBUG7QhEMFyiA9MRSpZjyMrmen4qove32YaywUFK?cluster=devnet):

| Step | Tx | Notes |
|---|---|---|
| Mint | [`8teB3bRB...z75SPo`](https://explorer.solana.com/tx/8teB3bRB5tJ32dgzuYyd4LrDxB9tFADdkxrW1CQYgu1BqFmrTvjGhH1FvMp9uNwrut7nQKk2LSYS4oSNEz75SPo?cluster=devnet) | name `rip NFT`, uri https://gateway.irys.xyz/9Ko3TitLoobCAp4WUNfZcLA3r8H17QhJnvuz7NvwgmkP |
| Update | [`3PsiMn9R...cjSWXufw`](https://explorer.solana.com/tx/3PsiMn9RRti4DGWkekDcUrDW1kS677Ty3ixQVzMRCY37nzktg5KHC2xqcQWpQpAa2dqrDAJVs2q1v84bjcSWXufw?cluster=devnet) | name `rip NFT v2`, uri https://gateway.irys.xyz/2zMoGdpmXR9C9yZ4dnwpdHfWcGGNtHZzaq1ic2bzYEPA (new description, added a `Version` trait) |
| Transfer | [`wquYh1zk...AsFHp`](https://explorer.solana.com/tx/wquYh1zkYtez48nrsfuEShXCH286SHMxheZ8DS28jWc6nik99DkPzu5fZSzCeBXW24EsL1CrZsJMRg8TRcAsFHp?cluster=devnet) | owner `gz8k5M...` -> `6E7HAX...` |
| Burn | [`hjShF12q...oSJqTp`](https://explorer.solana.com/tx/hjShF12qqsQ4v9ebtxCiZrxjHeQNpDZ5oV1DYkmJvfPThqJh1b1kFWFp6qDMr8NwEQWJqDDeZQGDPAFggoSJqTp?cluster=devnet) | 0.00077724 SOL rent returned to the payer |

### About the rent on burn

Burning a Core asset doesn't close the account completely. The program shrinks it to 1 byte and marks it uninitialized so the same address can't be used for a new asset later. It then refunds `rent(old size) - rent(1 byte)`, calculated at the current rent rate, to the `payer` of the burn instruction (not the owner).

From the burn above:

- asset account: 0.00293256 SOL, 154 bytes -> 0.00215532 SOL, 1 byte
- main wallet (payer): 20.833966718 -> 20.834733958 SOL (+0.00077724 refund, -0.00001 fee for two signatures)
- second wallet (owner): unchanged

The asset was holding more lamports than devnet's current rent-exempt minimum for its size (devnet rent is lower now than when it was minted). Core only refunds the difference at today's rate, so the extra stays in the 1-byte account.

## Notes

- `nft_update.ts` has to be signed by the asset's update authority, which is the wallet that minted it. Ownership doesn't matter for updates, so it still works after the NFT is transferred.
- `nft_burn.ts` needs the current owner's key, which is why it loads `devnet-wallet-2.json`. Set `payer` to whichever wallet should get the rent back.
- After a transfer or update, the scripts read the asset back with `confirmed` commitment. The default read can hit a devnet node that hasn't caught up yet and show the old owner/name.

## Docs

- [Solana token docs](https://solana.com/docs/tokens)
- [Solana Kit](https://www.solanakit.com/)
- [Metaplex Token Metadata](https://www.metaplex.com/docs/smart-contracts/token-metadata)
- [Metaplex Core](https://www.metaplex.com/docs/smart-contracts/core)
- [Core JSON schema](https://www.metaplex.com/docs/smart-contracts/core/json-schema)
