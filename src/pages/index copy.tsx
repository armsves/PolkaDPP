"use client";
import { ConnectButton, connectorsForWallets, } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useAccount } from 'wagmi';
import { Address } from 'viem'
import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image'
import Web3 from 'web3';
import { abi, wagmiContractConfig } from '../utils/abi';
import { NextResponse } from 'next/server';


import { pinata } from "../utils/config";

const Home: NextPage = () => {
  const { address } = useAccount();
  const [adminAddress, setAdminAddress] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState<any | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  //const [categories, setCategories] = useState<{ index: number; value: Category; }[]>([]);
  //const [products, setProducts] = useState<{ index: number; value: Product; }[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const inputRefs2 = useRef<(HTMLInputElement | null)[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const web3 = new Web3("https://westend-asset-hub-eth-rpc.polkadot.io");
  const contract = new web3.eth.Contract(abi, wagmiContractConfig.addressOrName);
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [name, setName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<{ [key: number]: number | undefined }>({});


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


  const [tokenURIs, setTokenURIs] = useState<string[]>([]);

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
  }, []);

  //const ipfs = create({ url: 'https://ipfs.infura.io:5001/api/v0' });

  const mintNFT = async (name: string, description: string, photo: File, origin: string) => {
    try {
      if (!window.ethereum) {
        console.error("MetaMask is not installed!");
        return;
      }

      const web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];

      // Step 1: Upload the photo to IPFS
      const photoAdded = await ipfs.add(photo);
      const photoCID = photoAdded.cid.toString();
      const photoURL = `https://ipfs.io/ipfs/${photoCID}`;
      console.log("Photo uploaded to IPFS:", photoURL);

      // Step 2: Create metadata
      const metadata = {
        name,
        description,
        image: photoURL,
        origin,
      };

      // Step 3: Upload metadata to IPFS
      const metadataAdded = await ipfs.add(JSON.stringify(metadata));
      const metadataCID = metadataAdded.cid.toString();
      const metadataURI = `https://ipfs.io/ipfs/${metadataCID}`;
      console.log("Metadata uploaded to IPFS:", metadataURI);

      // Step 4: Call the mint function on the smart contract
      const contract = new web3.eth.Contract(abi, wagmiContractConfig.addressOrName);
      const mintResponse = await contract.methods.mint(account, metadataURI).send({ from: account });
      console.log("Minting successful:", mintResponse);
    } catch (error) {
      console.error("Error minting NFT:", error);
    }
  };
  /*
  interface Category {
    index: number;
    name: string;
    isActive: boolean;
  }

  interface Product {
    index: number;
    name: string;
    categoryId: number;
    price: number;
    stock: number;
    isActive: boolean;
  }


  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('selectedCategoryId', selectedCategoryId)
    const newIndex = products.length + 1;
    const newProduct = {
      index: newIndex,
      value: {
        index: newIndex,
        name,
        categoryId: parseInt(selectedCategoryId),
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        isActive: true
      }
    };
    setProducts([...products, newProduct]);
    console.log('products', products)
    setSelectedCategoryId("");
    setName('');
    setPrice('');
    setStock('');

    try {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          await window.ethereum.enable();
          const accounts = await web3.eth.getAccounts();
          const account = accounts[0];
          const contract = new web3.eth.Contract(abi, wagmiContractConfig.addressOrName);

          const productName = name;
          const productPrice = web3.utils.toWei(parseFloat(price), "ether");
          const productQuantity = parseInt(stock, 10);
          console.log('productName', productName)
          console.log('productPrice', productPrice)
          console.log('productQuantity', productQuantity)
          setIsLoading(true)
          const productValue = await contract.methods.addProduct(selectedCategoryId, productName, productPrice, productQuantity).send({ from: account });
          console.log("Product added:", productValue);
          setIsLoading(false)
        } catch (error: any) {
          setIsLoading(false)
          console.error("Error during account access or transaction send:", error);
        }
      } else {
        setIsLoading(false)
        console.error("MetaMask is not installed!");
      }
    } catch (error: any) {
      setIsLoading(false)
      console.error("Error in addProduct:", error);
    }

  };

  const getCategory = async (categoryNumber: string): Promise<Category> => {
    try {
      const categoryValue = await contract.methods.getCategory(categoryNumber).call();
      console.log("categoryValue", categoryValue);
      // Assuming categoryValue is an object with properties that match the names 'index', 'name', and 'isActive'
      return {
        index: parseInt(categoryNumber, 10),
        name: categoryValue['name'],
        isActive: categoryValue['isActive']
      };
    } catch (err: any) {
      console.error("Error fetching category:", err.message);
      throw new Error(err.message);
    }
  };

  const getProduct = async (productNumber: string): Promise<Product> => {
    try {
      const productValue = await contract.methods.getProduct(productNumber).call();
      console.log("productValue", productValue);
      // Assuming categoryValue is an object with properties that match the names 'index', 'name', and 'isActive'
      return {
        index: parseInt(productNumber, 10), // Assuming categoryNumber is the index and it's passed as a string
        name: productValue['name'],
        categoryId: Number(productValue['categoryId']),
        price: Number(productValue['price']),
        stock: Number(productValue['stock']),
        isActive: productValue['isActive']
      };
    } catch (err: any) {
      console.error("Error fetching category:", err.message);
      throw new Error(err.message);
    }
  };

  const getCategoryCount = async (): Promise<number> => {
    try {
      const categoryValue = await contract.methods.categoryCount().call();
      const categoryValueNumber = Number(categoryValue);
      return categoryValueNumber;
    } catch (err: any) {
      console.error("Error fetching category:", err.message);
      throw new Error(err.message);
    }
  };

  const getProductCount = async (): Promise<number> => {
    try {
      const categoryValue = await contract.methods.productCount().call();
      const categoryValueNumber = Number(categoryValue);
      return categoryValueNumber;
    } catch (err: any) {
      console.error("Error fetching category:", err.message);
      throw new Error(err.message);
    }
  };

  const getAdminAddress = async (): Promise<string> => {
    try {
      const adminAddress = await contract.methods.admin().call();
      return adminAddress;
    } catch (err: any) {
      console.error("Error fetching category:", err.message);
      throw new Error(err.message);
    }
  };

  const updateProduct = async (index: number, newValue: { category: string, name: string, price: string, stock: string }) => {
    console.log('index', index)
    console.log('newValue', newValue)
    try {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          await window.ethereum.enable();
          const accounts = await web3.eth.getAccounts();
          const account = accounts[0];

          console.log('index', index)
          const contract = new web3.eth.Contract(abi, wagmiContractConfig.addressOrName);
          setIsLoading(true)
          const categoryValue = await contract.methods.updateProduct(index, newValue.category, newValue.name, web3.utils.toWei(parseFloat(newValue.price), "ether"), newValue.stock, true).send({ from: account });
          console.log("Category updated:", categoryValue);
          setIsLoading(false)
          const updatedProducts = products.map((product, idx) => {
            if (product.index === index) {
              return {
                ...product,
                value: {
                  ...product.value,
                  name: newValue.name,
                  price: Number(newValue.price),
                  stock: Number(newValue.stock),
                  isActive: true
                }
              };
            }
            return product;
          });
          setProducts(updatedProducts);
          return categoryValue;
        } catch (error: any) {
          setIsLoading(false)
          console.error("Error during account access or transaction send:", error);
          //throw new Error(error.message);
        }
      } else {
        setIsLoading(false)
        console.error("MetaMask is not installed!");
        //throw new Error("MetaMask is not installed!");
      }
    } catch (err: any) {
      setIsLoading(false)
      console.error("Error updating category:", err.message);
      //throw new Error(err.message);
    }
  }

  function deleteProduct(index: number): void {
    // Implementation to delete a product
  }

  function toggleProductEnabled(index: number): void {
    // Implementation to toggle product enabled state
  }*/

  /*

useEffect(() => {
  const fetchCategoriesAndCheckAdmin = async () => {
    try {
      const count = await getCategoryCount(); // Fetch the total number of categories
      const categoryNumbers = Array.from({ length: count }, (_, i) => i + 1); // Start from 1 instead of 0

      const categoryPromises = categoryNumbers.map(async (number) => {
        const value = await getCategory(number.toString());
        return { index: number, value }; // Here, `value` is of type `Category`
      });

      const productCount = await getProductCount(); // Fetch the total number of products
      const productNumbers = Array.from({ length: productCount }, (_, i) => i + 1);

      const productPromises = productNumbers.map(async (number) => {
        const value = await getProduct(number.toString());
        return { index: number, value }; // Here, `value` is of type `Product`
      });

      const [categoryValues, productValues] = await Promise.all([
        Promise.all(categoryPromises),
        Promise.all(productPromises),
      ]);

      // Assuming setCategories and setProducts are your state update functions
      setCategories(categoryValues); // `categoryValues` is of type '{ index: number; value: Category; }[]'
      setProducts(productValues); // `productValues` is of type '{ index: number; value: Product; }[]'

      const adminAddress = await getAdminAddress();
      console.log("adminAddress", adminAddress);
      if (address?.toString() === adminAddress.toString()) {
        setIsAdmin(true);
        console.log("Welcome, Admin!");
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  fetchCategoriesAndCheckAdmin();
}, [address]);

const updateCategory = async (index: number, newValue: string) => {
  console.log('index', index)
  console.log('newValue', newValue)
  try {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      try {
        await window.ethereum.enable();
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];

        console.log('index', index)
        const contract = new web3.eth.Contract(abi, wagmiContractConfig.addressOrName);
        setIsLoading(true)
        const categoryValue = await contract.methods.updateCategory(index, newValue, true).send({ from: account });
        setIsLoading(false)
        console.log("Category updated:", categoryValue);
        const updatedCategories = categories.map((category, idx) => {
          if (category.index === index) {
            return {
              ...category,
              value: {
                ...category.value,
                name: newValue
              }
            };
          }
          return category;
        });
        setCategories(updatedCategories);
        return categoryValue;
      } catch (error: any) {
        console.error("Error during account access or transaction send:", error);
        //throw new Error(error.message);
      }
    } else {
      console.error("MetaMask is not installed!");
      //throw new Error("MetaMask is not installed!");
    }
  } catch (err: any) {
    console.error("Error updating category:", err.message);
    //throw new Error(err.message);
  }
};

async function addCategory(newValue: string) {
  const newIndex = categories.length + 1;
  const newCategory = { index: newIndex, value: { index: newIndex, name: newValue, isActive: true } };
  setCategories([...categories, newCategory]);

  try {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      try {
        await window.ethereum.enable();
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0]; // Using the first account as the signer

        const contract = new web3.eth.Contract(abi, wagmiContractConfig.addressOrName);
        setIsLoading(true)
        const categoryValue = await contract.methods.addCategory(newValue).send({ from: account });
        setIsLoading(false)
        console.log("Category added:", categoryValue);
        const newCategory = { index: newIndex, value: { index: newIndex, name: newValue, isActive: true } };
        setCategories([...categories, newCategory]);
      } catch (error: any) {
        console.error("Error during account access or transaction send:", error);
      }
    } else {
      console.error("MetaMask is not installed!");
    }
  } catch (error: any) {
    console.error("Error in addCategory:", error);
  }
}

function deleteCategory(index: number) {
  // Remove the category with the given index
  setCategories(categories.filter(category => category.index !== index));
}

function toggleCategoryEnabled(index: number) {
  // Toggle the isEnabled property of the category with the given index
  setCategories(categories.map(category => {
    if (category.index === index) {
      return { ...category, isEnabled: !category.value.isActive };
    }
    return category;
  }));
}

const buyProduct = async (productId: number, amount: string) => {

  try {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      try {
        await window.ethereum.enable();
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0]; // Using the first account as the signer

        const contract = new web3.eth.Contract(abi, wagmiContractConfig.addressOrName);
        setIsLoading(true)
        const productResponse = await contract.methods.buyProduct(productId, 1).send({ from: account, value: amount });
        setIsLoading(false)
      } catch (error: any) {
        console.error("Error during account access or transaction send:", error);
      }
    } else {
      console.error("MetaMask is not installed!");
    }
  } catch (error: any) {
    console.error("Error in addCategory:", error);
  }

}

useEffect(() => {
  const initialCategoryIds: Record<number, number> = {};
  products.forEach((product, index) => {
    initialCategoryIds[index] = product.value.categoryId;
  });
  setSelectedCategoryIds(initialCategoryIds);
}, [products]);
*/

  return (
    <div className={styles.container}>
      <Head>
        <title>PolkaDPP</title>
        <meta
          content="Generated by @rainbow-me/create-rainbowkit"
          name="description"
        />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <header className={styles.header}>
        <h1 className={styles.title}>
          <Image src={`/assets/polkadot-new-dot-logo.png`} alt="Polkadot Logo" width="34" height="34" />
          PolkaDPP (Digital Product Passport)
        </h1>
        <div className={styles.ConnectButton}><ConnectButton /></div>
      </header>

      {
        /*

      <main className={styles.main}>
        {address && isAdmin ? (
          <>
            <div>
              <h1 className={styles.title}>Categories</h1>
              <div>
                {categories.map((category, index) => (
                  <div key={category.index} className={styles.categoryItem}>
                    <input className={styles.input} type="text" defaultValue={category.value.name} ref={el => { inputRefs.current[index] = el; }} />
                    <button className={`${styles.button} ${styles.storeButton}`} onClick={() => updateCategory(category.index, inputRefs.current[index]?.value || '')}>Update</button>
                    <button className={`${styles.button} ${styles.storeButton}`} onClick={() => deleteCategory(category.index)}>Delete</button>
                    <button className={`${styles.button} ${styles.storeButton}`} onClick={() => toggleCategoryEnabled(category.index)}>
                      {category.value.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.categoryItem}>
                <input
                  className={styles.input}
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Add new category"
                />
                <button className={`${styles.button} ${styles.storeButton}`} onClick={() => addCategory(newCategory)}>Add Category</button>
              </div>
            </div>

            <h1 className={styles.title}>Products</h1>
            <div>
              {products.map((product, index) => (
                <div key={product.index} className={styles.categoryItem}>
                  <select
                    className={styles.input}
                    // Step 3: Use the product index to get the correct selected category ID
                    value={selectedCategoryIds[index] || ''} // Use an empty string as fallback
                    onChange={(e) => {
                      // Step 2: Update the selected category ID for this product
                      const updatedSelectedCategoryIds = {
                        ...selectedCategoryIds,
                        [index]: Number(e.target.value), // Ensure the value is correctly typed
                      };
                      setSelectedCategoryIds(updatedSelectedCategoryIds);
                      console.log("Before update:", product.value.categoryId);
                      console.log("After update:", e.target.value.toString());
                    }}
                  >
                    {categories.map((category) => (
                      <option key={category.value.index} value={category.value.index}>
                        {category.value.name}
                      </option>
                    ))}
                  </select>

                  <input className={styles.input} type="text" defaultValue={product.value.name} ref={el => { inputRefs2.current[index * 3] = el; }} />
                  <input className={styles.input} type="text" defaultValue={web3.utils.fromWei(product.value.price, "ether")} ref={el => { inputRefs2.current[index * 3 + 1] = el; }} />
                  <input className={styles.input} type="text" defaultValue={product.value.stock} ref={el => { inputRefs2.current[index * 3 + 2] = el; }} />

                  <button className={`${styles.button} ${styles.storeButton}`} onClick={() =>
                    updateProduct(product.index, {
                      category: selectedCategoryIds[index]?.toString() || '',
                      name: inputRefs2.current[index * 3]?.value || '',
                      price: inputRefs2.current[index * 3 + 1]?.value || '',
                      stock: inputRefs2.current[index * 3 + 2]?.value || ''
                    })}>Update</button>
                  <button className={`${styles.button} ${styles.storeButton}`} onClick={() => deleteProduct(product.index)}>Delete</button>
                  <button className={`${styles.button} ${styles.storeButton}`} onClick={() => toggleProductEnabled(product.index)}>
                    {product.value.isActive ? 'Disable' : 'Enable'}
                  </button>
                </div>
              ))}
            </div>

            <div onSubmit={handleAddProduct} className={styles.categoryItem}>
              <select
                className={styles.input}
                value={selectedCategoryId}
                onChange={(e) => {
                  console.log(e.target.value); // Log the selected category ID
                  setSelectedCategoryId(e.target.value)
                }}
              >
                <option value="" disabled>Select Category</option>
                {categories.map((category) => (
                  <option key={category.value.index} value={category.value.index}>
                    {category.value.name}
                  </option>
                ))}
              </select>
              <input
                className={styles.input}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product Name"
                required
              />
              <input
                className={styles.input}
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Price"
                required
              />
              <input
                className={styles.input}
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Stock"
                required
              />
              <button className={`${styles.button} ${styles.storeButton}`} type="submit">Add Product</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className={styles.categoriesTitle}>Categories:</div>
              {categories.map((category, index) => (
                <div key={index} className={styles.categoriesTitle} style={{ marginLeft: '10px', display: 'inline' }}>{category.value.name}</div>
              ))}
            </div>

            <div>
              <h1 className={styles.productsTitle}>Products</h1>
              <div className={styles.productsContainer}>
                {products.map((product) => (
                  <div key={product.index} className={styles.productCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className={styles.productsTitle}>{product.value.name}</div>
                    <p style={{ textAlign: 'center' }}>Price: {web3.utils.fromWei(product.value.price, "ether")} DEV</p>
                    <button className={`${styles.button} ${styles.storeButton}`} onClick={() => buyProduct(product.index, product.value.price.toString())}>Buy</button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
                  */
      }
      <main>
        {isLoading && (
          <div className={styles.fullScreenCenter}>
            <div className={styles.loader}>
              Processing...
              <div className={styles.animation}></div>
            </div>
          </div>
        )}

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const name = formData.get('name') as string;
            const description = formData.get('description') as string;
            const photo = formData.get('photo') as File;
            const origin = formData.get('origin') as string;

            await mintNFT(name, description, photo, origin);
          }}
        >
          <input type="text" name="name" placeholder="Name" required />
          <textarea name="description" placeholder="Description" required></textarea>
          <input type="file" name="photo" accept="image/*" required />
          <input type="text" name="origin" placeholder="Origin" required />
          <button type="submit">Mint NFT</button>
        </form>

      </main>

      <footer className={styles.footer}>
        Powered by
        <Image src={`/assets/Polkadot-Logo.png`} alt="Polkadot Logo" width="140" height="64" className={styles.imageStyle} />
        <Image src={`/assets/favicon-32x32.png`} alt="Westend AssetHub Logo" width="64" height="64" className={styles.imageStyle} />
        <Image src={`/assets/drpc.png`} alt="dRPC Logo" width="100" height="64" className={styles.imageStyle} />
      </footer>
    </div >
  );
};

export default Home;
