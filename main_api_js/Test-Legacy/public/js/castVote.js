// require("dotenv").config();
import { ethers, Interface, concat, getBytes, AbiCoder } from "./ethers-6.7.esm.min.js";
// ABI
const abi = ["function vote(uint8[] memory _candidates) public"];
const executeAbi = ["function execute(uint8[] calldata _candidates) external"]

// Elements
const inputPasswordElem = document.getElementById('walletPassword')
const btnPasswordElem = document.getElementById('btn-password')
const hashElem = document.getElementById("hash");

// Event Listener
btnPasswordElem.addEventListener('click', fetchUserData)

// Fetch Functions
async function fetchUserData() {
  const token = localStorage.getItem("token");

  const response = await fetch('/user', {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
  })

  const data = await response.json();
  const encryptedJson = data.encryptedJson;
  const sender = data.accountAbstractionAddress
  const publicKey = data.publicKey
  const email = data.email
  const password = inputPasswordElem.value;
  console.log('ok');
  return { encryptedJson, password, sender, publicKey, email }
}

async function fetchElectionData() {
  const urlParams = new URLSearchParams(window.location.search);
  const contractAddress = urlParams.get("contractAddress");
  const token = localStorage.getItem("token");
  const response = await fetch(`/vote/${contractAddress}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  const { NUM_OF_CANDIDATES, NUM_OF_VOTES, payMasterAddress, voters, votersAA, entryPointAddress } = data.election;
  return { NUM_OF_CANDIDATES, NUM_OF_VOTES, contractAddress, payMasterAddress, voters, votersAA, entryPointAddress };
}


// Onload Event
document.addEventListener("DOMContentLoaded", async () => {
  const { NUM_OF_CANDIDATES, NUM_OF_VOTES, voters } = await fetchElectionData();
  const { email } = await fetchUserData()
  console.log('the number of candidates and votes', NUM_OF_CANDIDATES, NUM_OF_VOTES);

  // find the max num of votes of the user
  const userIndex = voters.indexOf(email)
  console.log('the index of the user is ', userIndex);


  const form = document.getElementById("castVoteForm");
  const container = document.createElement("div");
  const maxVotes = document.getElementById("maxVotes");

  for (let i = 0; i < NUM_OF_CANDIDATES; i++) {
    const label = document.createElement("label");
    label.textContent = `Candidate ${i + 1}: `;
    container.appendChild(label);

    const input = document.createElement("input");
    input.type = "number";
    input.name = `vote-${i}`;
    input.required = true;
    container.appendChild(input);
  }

  maxVotes.textContent = `max number of votes : ${NUM_OF_VOTES[userIndex]}`;

  form.insertBefore(container, form.firstChild);
});


// Submit Event
document
  .getElementById("castVoteForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();


    // create packedUserOp and send it to entryPoint
    await buildUserOperation()

    const { NUM_OF_CANDIDATES, contractAddress } = await fetchElectionData();
    const votes = await voteConversion(NUM_OF_CANDIDATES)
    const { encryptedJson, password } = await fetchUserData()

    const token = localStorage.getItem("token");
    // const wallet = await ethers.Wallet.fromEncryptedJson(encryptedJson, password);

    // const provider = await ethers.getDefaultProvider("http://127.0.0.1:8545");
    // const connectedWallet = wallet.connect(provider);
    // const contract = new ethers.Contract(contractAddress, abi, connectedWallet);

    // try {
    //   const tx = await contract.vote(votes);
    //   console.log("Transaction hash:", tx.hash);
    //   hashElem.innerHTML = tx.hash;
    //   await tx.wait(); // Wait for transaction to be mined
    //   console.log("Transaction confirmed!");
    // } catch (error) {
    //   console.error("Error sending votes:", error);
    // }

    // Sending information to db
    try {
      const response = await fetch(`/vote/${contractAddress}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ votes }),
      });

      const data = await response.text();
      if (response.ok) {
        alert(data);
      } else {
        alert(data);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while casting the vote in db.");
    }
  });

// conversion functions
const voteConversion = async (NUM_OF_CANDIDATES) => {
  const votes = Array.from({ length: NUM_OF_CANDIDATES }, (_, i) =>
    Number(document.getElementsByName(`vote-${i}`)[0].value)
  );
  return votes;
}

function hexToBytes(hex) {
  if (hex.startsWith('0x')) {
    hex = hex.slice(2);
  }
  let bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return new Uint8Array(bytes);
}


// Creating UserOp 
const buildUserOperation = async () => {
  // sample
  // const theSender = '0xa2dD817c2fDc3a2996f1A5174CF8f1AaED466E82'
  // const thePaymasterAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

  const { encryptedJson, password, sender, publicKey } = await fetchUserData()
  const nonce = 1
  const initCode = "0x"

  // create callData
  const { NUM_OF_CANDIDATES, payMasterAddress, voters, votersAA } = await fetchElectionData();
  const votes = await voteConversion(NUM_OF_CANDIDATES)

  const contractInterface = new Interface(executeAbi)
  const callData = contractInterface.encodeFunctionData("execute", [votes]);

  // Gas stuff
  const preVerificationGas = BigInt(50000);
  const preVerificationGasHex = ethers.toBeHex(preVerificationGas, 32);

  const accountGasLimits1 = BigInt(1000000);
  const accountGasLimits2 = BigInt(1000000);

  const accountGasLimitsHex1 = ethers.toBeHex(accountGasLimits1, 16);
  const accountGasLimitsHex2 = ethers.toBeHex(accountGasLimits2, 16);
  const accountGasLimit = concat([accountGasLimitsHex1, accountGasLimitsHex2]);
  

  const gasFees1 = BigInt(1000);
  const gasFees2 = BigInt(1000);


  const gasFeesHex1 = ethers.toBeHex(gasFees1, 32);
  const gasFeesHex2 = ethers.toBeHex(gasFees2, 32);
  const gasFees = concat([gasFeesHex1, gasFeesHex2]);



  // create paymasterAndData / generate merkle proof / paymaster validation gas limit
  const leaf = keccak256(sender);
  const leaves = votersAA.map(x => keccak256(x))

  const merkleTree = new window.MerkleTree(leaves, keccak256, { sortPairs: true })
  const merkleProof = merkleTree.getHexProof(leaf)

  const isValid = merkleTree.verify(merkleProof, leaf, merkleTree.getRoot());
  console.log('Is Valid Proof:', isValid);

  const validationGasLimit = BigInt(1000)
  const validationGasLimitHex = ethers.toBeHex(validationGasLimit, 16)
  const postOpGasLimit = BigInt(0)
  const postOpGasLimitHex = ethers.toBeHex(postOpGasLimit, 16)

  const paymasterAndData = concat([
    getBytes(payMasterAddress),
    getBytes(validationGasLimitHex),
    getBytes(postOpGasLimitHex),
    ...merkleProof.map(proof => getBytes(proof)),
  ]);
  console.log('paymasterAndData: ', paymasterAndData);

  const userOp = {
    sender: sender,
    nonce: nonce,
    initCode: initCode,
    callData: callData,
    accountGasLimits: accountGasLimit,
    preVerificationGas: preVerificationGasHex,
    gasFees: gasFees,
    paymasterAndData: paymasterAndData,
    signature: "0x", // Placeholder, this will be filled after signing
  };

  const abiCoder = new AbiCoder();
  const userOpWithoutSignature = abiCoder.encode(
    [
      "address",
      "uint256",
      "bytes",
      "bytes",
      "bytes32",
      "uint256",
      "bytes32",
      "bytes",
    ],
    [
      userOp.sender,
      userOp.nonce,
      userOp.initCode,
      userOp.callData,
      userOp.accountGasLimits,
      userOp.preVerificationGas,
      userOp.gasFees,
      userOp.paymasterAndData,
    ]
  );

  const userOpHash = keccak256(userOpWithoutSignature);
  const userOpHashBytes = hexToBytes(userOpHash.toString());

  const wallet = await ethers.Wallet.fromEncryptedJson(encryptedJson, password);
  const signature = await wallet.signMessage(userOpHashBytes);
  userOp.signature = signature

  console.log('userOp: ', userOp);

  //send userOp to entryPoint
  await sendUserOp(userOp)

  // save packedUserOp to DB
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`/auth/userOp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ publicKey, userOp }),
    });
    const data = await response.text();
    if (response.ok) {
      alert(data);
    } else {
      alert(data);
    }
  } catch (error) {
    console.log(error);

  }

}

const sendUserOp = async (userOp) => {

  const { entryPointAddress } = await fetchElectionData()
  const arrayUserOp = []

  arrayUserOp[0] = userOp
  console.log(arrayUserOp);
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

  const provider = new ethers.getDefaultProvider('http://127.0.0.1:8545')
  const wallet = new ethers.Wallet(privateKey, provider)
  // const abi = ['function handleOps(PackedUserOperation[] calldata ops, address payable beneficiary) external',
  //   'struct PackedUserOperation {address sender; uint256 nonce;bytes initCode;bytes callData;bytes32 accountGasLimits;uint256 preVerificationGas;bytes32 gasFees;bytes paymasterAndData;bytes signature;}']

  const abi = [
    'function handleOps((address sender, uint256 nonce, bytes initCode, bytes callData, bytes32 accountGasLimits, uint256 preVerificationGas, bytes32 gasFees, bytes paymasterAndData, bytes signature)[] calldata ops, address payable beneficiary) external'
  ];

  const contract = new ethers.Contract(entryPointAddress, abi, wallet);

  console.log('sending transaction to handleOp...');
  try {
    const tx = await contract.handleOps(arrayUserOp, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266') // ignore bundler
    const receipt = await tx.wait();
    console.log('Transaction to startElection successful with hash:', receipt.hash);

  } catch (error) {
    console.error('Error calling handleOp:', error);
  }



}