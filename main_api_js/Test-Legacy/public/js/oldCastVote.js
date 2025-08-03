import { ethers } from "./ethers-6.7.esm.min.js";

const abi = ["function vote(uint8[] memory _candidates) public"];
const hashElem = document.getElementById("hash");
 
async function fetchData() {
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
  const { NUM_OF_CANDIDATES, NUM_OF_VOTES } = data.election;
  return { NUM_OF_CANDIDATES, NUM_OF_VOTES, contractAddress };
  // const numCandidates = NUM_OF_CANDIDATES;
  // const max_vote = NUM_OF_VOTES;
}

// const contractAddress = "YOUR_CONTRACT_ADDRESS"; // fetch from back
// const numCandidates = 3; // fetch from back
// const max_vote = 5; // fetch from back

document.addEventListener("DOMContentLoaded", async () => {
  const { NUM_OF_CANDIDATES, NUM_OF_VOTES } = await fetchData();
  console.log(NUM_OF_CANDIDATES, NUM_OF_VOTES);
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

  maxVotes.textContent = `max number of votes : ${NUM_OF_VOTES}`;

  form.insertBefore(container, form.firstChild);
});

document
  .getElementById("castVoteForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { NUM_OF_CANDIDATES, contractAddress } = await fetchData();
    console.log(NUM_OF_CANDIDATES);
    const votes = Array.from({ length: NUM_OF_CANDIDATES }, (_, i) =>
      Number(document.getElementsByName(`vote-${i}`)[0].value)
    );
    console.log(votes);

    const token = localStorage.getItem("token");

    let provider;
    if (window.ethereum == null) {
      console.log("MetaMask not installed; using read-only defaults");
      provider = ethers.getDefaultProvider();
    } else {
      provider = new ethers.BrowserProvider(window.ethereum);
    }

    await provider.send("eth_requestAccounts", []);
    // await provider.request({ method: "eth_requestAccounts" });
    const signer = await provider.getSigner();
    console.log(contractAddress, abi, signer);
    const contract = new ethers.Contract(contractAddress, abi, signer);

    try {
      const tx = await contract.vote(votes);
      console.log("Transaction hash:", tx.hash);
      hashElem.innerHTML = tx.hash;
      await tx.wait(); // Wait for transaction to be mined
      console.log("Transaction confirmed!");
    } catch (error) {
      console.error("Error sending votes:", error);
    }

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