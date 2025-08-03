import { ethers } from "./ethers-6.7.esm.min.js";

const abi = ["function results() public view returns (uint8)"];
// const contractAddress = "CONTRACT_ADDRESS";

document.getElementById("getResults").addEventListener("click", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const contractAddress = urlParams.get("contractAddress");

  let provider;
  if (window.ethereum == null) {
    console.log("MetaMask not installed; using read-only defaults");
    provider = ethers.getDefaultProvider();
  } else {
    provider = new ethers.BrowserProvider(window.ethereum);
  }
  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();
  const contract = new ethers.Contract(contractAddress, abi, signer);

  const contractWithSigner = contract.connect(signer);
  const result = await contractWithSigner.results();

  console.log(result.toString());
  // try {
  //   const tx = await contract.results();
  //   console.log("Transaction hash:", tx.hash);
  //   await tx.wait(); // Wait for transaction to be mined
  //   console.log("Transaction confirmed!");
  //   console.log(tx);
  // } catch (error) {
  //   console.error("Error sending votes:", error);
  // }
});
