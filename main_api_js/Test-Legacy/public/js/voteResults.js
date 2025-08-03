import { ethers } from "./ethers-6.7.esm.min.js";       
// Assuming you have access to the transaction hash through the input field
const transactionHashInput = document.getElementById("name");

transactionHashInput.addEventListener("change", async () => {
  const transactionHash = transactionHashInput.value.trim();

  if (!transactionHash) {
    alert("Please enter a transaction hash.");
    return;
  }

  try {
    let provider;
    if (window.ethereum == null) {
      console.log("MetaMask not installed; using read-only defaults");
      provider = ethers.getDefaultProvider();
    } else {
      provider = new ethers.BrowserProvider(window.ethereum);
    }

    // Fetch transaction details
    const transactionResponse = await provider.getTransaction(transactionHash);
    console.log(transactionResponse)

    if (!transactionResponse) {
      throw new Error("Transaction not found.");
    }

    // Extract relevant transaction details
    const blockNumber = await provider.getBlockNumber();
    console.log(blockNumber)
    // const block = await provider.getBlockWithTransactions(
    //   transactionResponse.blockHash
    // );
    //console.log(block)
    const transactionDetails = {
      blockNumber,
      gasPrice: transactionResponse.gasPrice.toString(),
      gasLimit: transactionResponse.gasLimit.toString(),
      to: transactionResponse.to
        ? transactionResponse.to.toLowerCase()
        : "Contract Interaction",
      //value: ethers.utils.formatEther(transactionResponse.value),
      inputData: transactionResponse.data,
      nonce: transactionResponse.nonce.toString(),
      //timestamp: transactionResponse.timestamp.toString(),
      //confirmations: block.number - transactionResponse.blockNumber,
    };
    console.log(transactionDetails);

    // Update HTML to display transaction details
    const transactionDetailsDiv = document.createElement("div");
    transactionDetailsDiv.innerHTML = `
            <h2>Transaction Details</h2>
            <ul>
                <li><strong>Block Number:</strong> ${transactionDetails.blockNumber}</li>
                <li><strong>Gas Price:</strong> ${transactionDetails.gasPrice}</li>
                <li><strong>Gas Limit:</strong> ${transactionDetails.gasLimit}</li>
                <li><strong>To:</strong> ${transactionDetails.to}</li>
                <li><strong>Data:</strong> ${transactionDetails.inputData}</li>
                <li><strong>Nonce:</strong> ${transactionDetails.nonce}</li>
                
                
            </ul>
        `;

    document.body.appendChild(transactionDetailsDiv);
  } catch (error) {
    console.error("Failed to fetch transaction details:", error);
    alert("Failed to fetch transaction details. Please try again later.");
  }
});
