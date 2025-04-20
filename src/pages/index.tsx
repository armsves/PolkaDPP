"use client";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useAccount } from 'wagmi';
import Web3 from 'web3';
import { abi, wagmiContractConfig } from '../utils/abi';
import { pinata } from "../utils/config";
import Image from 'next/image'
import React, { useEffect, useState } from 'react';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Pagination, Navigation } from 'swiper/modules';

const Home: NextPage = () => {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const web3 = new Web3("https://westend-asset-hub-eth-rpc.polkadot.io");
  const contract = new web3.eth.Contract(abi, wagmiContractConfig.addressOrName);

  const [file, setFile] = useState<File>();
  const [uploading, setUploading] = useState(false);
  const [tokenURIs, setTokenURIs] = useState<string[]>([]);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const formRef = React.useRef<HTMLFormElement>(null);

  const getTokenCount = async (): Promise<number> => {
    try {
      const response = Number(await contract.methods.getTokenCount().call());
      console.log("Token count:", response);
      return response;
    } catch (err: any) {
      console.error("Error fetching count:", err.message);
      throw new Error(err.message);
    }
  };

  const getTokenURI = async (): Promise<String> => {
    try {
      const response = await contract.methods.getTokenURI().call();
      console.log("Token URI:", response);
      return response;
    } catch (err: any) {
      console.error("Error fetching count:", err.message);
      throw new Error(err.message);
    }
  };

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        const count = await getTokenCount();
        console.log("Token count:", count);

        if (count > 0) {
          const uris = [];
          for (let i = 1; i <= count; i++) {
            const uri = await contract.methods.getTokenURI(i).call();
            uris.push(uri);
          }
          setTokenURIs(uris);
          console.log("Token URIs:", uris);
        }
      } catch (error) {
        console.error("Failed to fetch token data:", error);
      }
    };

    fetchTokenData();
  }, [mintSuccess]);

  const mintDPP = async (name: string, description: string, photo: File, origin: string) => {
    try {
      if (!window.ethereum) {
        console.error("MetaMask is not installed!");
        alert("Please install MetaMask to proceed.");
        return;
      }

      setIsLoading(true);

      const web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];
      const contract = new web3.eth.Contract(abi, wagmiContractConfig.addressOrName);

      if (!file) {
        alert("No file selected");
        setIsLoading(false);
        return;
      }

      // Step 1: Upload the file
      let fileUrl = "";
      try {
        setUploading(true);
        const urlRequest = await fetch("/api/files");
        const urlResponse = await urlRequest.json();
        const upload = await pinata.upload.public.file(file).url(urlResponse.url);
        fileUrl = await pinata.gateways.public.convert(upload.cid);
        console.log("File uploaded successfully:", fileUrl);
        setUploading(false);
      } catch (e) {
        console.error("Error uploading file:", e);
        setUploading(false);
        alert("Trouble uploading file. Please try again.");
        setIsLoading(false);
        return;
      }

      // Step 2: Create metadata
      const nftMetadata = {
        name,
        description,
        image: fileUrl,
        origin,
      };

      let metadataUrl = "";
      try {
        setUploading(true);
        const urlRequest = await fetch("/api/files");
        const urlResponse = await urlRequest.json();
        const metadataUpload = await pinata.upload.public.json(nftMetadata).url(urlResponse.url);
        metadataUrl = await pinata.gateways.public.convert(metadataUpload.cid);
        console.log("Metadata uploaded successfully:", metadataUrl);
        setUploading(false);
      } catch (e) {
        console.error("Error uploading metadata:", e);
        setUploading(false);
        alert("Trouble uploading metadata. Please try again.");
        setIsLoading(false);
        return;
      }

      // Step 3: Call the mint function on the smart contract
      try {
        const gasEstimate = await contract.methods.mint(account, metadataUrl).estimateGas({ from: account });
        const gasPrice = await web3.eth.getGasPrice();

        const mintResponse = await contract.methods.mint(account, metadataUrl).send({
          from: account,
          gas: gasEstimate.toString(),
          gasPrice: gasPrice.toString(),
        });

        console.log("Minting successful:", mintResponse);

        // Reset the form
        if (formRef.current) {
          formRef.current.reset();
        }

        // Trigger the useEffect by updating the state
        setMintSuccess(true);
      } catch (e) {
        console.error("Error minting NFT:", e);
        alert("Error minting NFT. Please check the console for details.");
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target?.files?.[0]);
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const validURIs = tokenURIs.filter((uri) => uri); // Filter out empty strings
        const fetchedProducts = await Promise.all(
          validURIs.map(async (uri) => {
            try {
              const response = await fetch(uri);
              if (!response.ok) throw new Error(`Failed to fetch metadata from ${uri}`);
              const metadata = await response.json();
              return metadata;
            } catch (error) {
              console.error("Error fetching metadata:", error);
              return null;
            }
          })
        );
        setProducts(fetchedProducts.filter((product) => product)); // Filter out null values
      } catch (error) {
        console.error("Error fetching metadata:", error);
      }
    };

    fetchMetadata();
  }, [tokenURIs]);

  return (
    <div className={styles.container}>
      <Head>
        <title>PolkaDPP</title>
        <meta content="Generated by @rainbow-me/create-rainbowkit" name="description" />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <header className={styles.header}>
        <h1 className={styles.title}>
          <Image src={`/assets/polkadot-new-dot-logo.png`} alt="Polkadot Logo" width="34" height="34" />

          PolkaDPP (Digital Product Passport)
        </h1>
        <div className={styles.ConnectButton}><ConnectButton /></div>
      </header>

      <main className={`${styles.main}`} style={{ paddingLeft: '8rem', paddingTop: '4rem' }}>
        {/* Form Section */}
        <div className="form-section">
          {isLoading && (
            <div className={styles.fullScreenCenter}>
              <div className={styles.loader}>
                Processing...
                <div className={styles.animation}></div>
              </div>
            </div>
          )}

          <form
            ref={formRef}
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const name = formData.get('name') as string;
              const description = formData.get('description') as string;
              const photo = formData.get('photo') as File;
              const origin = formData.get('origin') as string;
              await mintDPP(name, description, photo, origin);
            }}
            className={styles.form}
          >
            <div className={styles.formGroup}>
              <label htmlFor="name">Name</label>
              <input type="text" id="name" name="name" placeholder="Enter DPP Name" required />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" placeholder="Enter DPP Description" required></textarea>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="photo">Photo</label>
              <input
                type="file"
                id="photo"
                name="photo"
                onChange={handleChange}
                accept="image/*"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="origin">Origin</label>
              <input type="text" id="origin" name="origin" placeholder="Enter Origin" required />
            </div>

            <button type="submit" className={styles.submitButton}>
              Mint DPP
            </button>
          </form>
        </div>

        {/* Product Card Section */}
        <div className="swiper-section" style={{ maxWidth: '100%', flex: 1, paddingRight: '6rem' }}>
          <Swiper
            modules={[Pagination, Navigation]}
            navigation
            spaceBetween={20}
            slidesPerView={1}
            pagination={{ clickable: true }}
            style={{ maxWidth: '400px', margin: '0 auto' }} // Center and constrain Swiper width
          >
            {products.map((product, index) => (
              <SwiperSlide key={index}>
                <div className="border rounded-lg shadow-lg p-6 w-full bg-white flex flex-col items-start">
                  {/* Product Image */}
                  <div className="w-full mb-4">
                    <img
                      src={product.image || "/assets/placeholder.svg"}
                      alt={product.name}
                      width={350}
                      height={250}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>

                  {/* Product Details */}
                  <h2 className="text-xl font-bold mb-2">{product.name}</h2>
                  <p className="text-sm text-gray-600 mb-4">{product.description}</p>

                  {/* Additional Information */}
                  <div className="w-full">
                    <p className="text-sm text-gray-800 font-semibold mb-2">
                      <span className="font-bold">Origin:</span> {product.origin}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </main>

      <footer className={styles.footer}>
        Powered by
        <Image src={`/assets/Polkadot-Logo.png`} alt="Polkadot Logo" width="140" height="64" className={styles.imageStyle} />
        <Image src={`/assets/favicon-32x32.png`} alt="Westend AssetHub Logo" width="64" height="64" className={styles.imageStyle} />
        <Image src={`/assets/drpc.png`} alt="dRPC Logo" width="100" height="64" className={styles.imageStyle} />
      </footer>
    </div>
  );
};

export default Home;