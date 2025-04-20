## Getting Started

First Install the modules with:

```bash
npm install
```

Copy the .env.example to .env.local and add your pinata JWT and your public gateway URL

Deploy the contract with Remix Polkadot and copy/paste the address in utils/abi.ts

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Technologies used
Remix Polkadot to deploy on Westend AssetHub

Rainbowkit for the wallet connection
Wagmi/Viem for interacting with the contract
Pinata IPFS to upload the images and the URI
Swiper to make the DPP cards look better

## Contract
In the folder contracts you can find the PolkaDPP.sol which is a simple erc721 implementation


## Video Demo
https://youtu.be/GOZqsBrJ7Jk

