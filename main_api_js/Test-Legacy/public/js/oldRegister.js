// import { ethers } from "./ethers-6.7.esm.min.js";

let publicKey = "";

const connectButton = document.getElementById("connectButton");
connectButton.onclick = connect;

async function connect() {
  if (typeof window.ethereum !== "undefined") {
    try {
      await ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await ethereum.request({ method: "eth_accounts" });
      publicKey = accounts[0]; // Get the public key from MetaMask
      if (
        typeof ethers !== "undefined" &&
        ethers.utils &&
        ethers.utils.getAddress
      ) {
        publicKey = ethers.utils.getAddress(publicKey);
        console.log(publicKey);
        alert("Connected to MetaMask with public key: " + publicKey);
      } else {
        console.error("Ethers.js library is not available.");
        alert("Ethers.js library is not available.");
      }
      alert("Connected to MetaMask with public key: " + publicKey);
    } catch (error) {
      console.log(error);
      alert("Failed to connect to MetaMask");
    }
  } else {
    alert("Please install MetaMask");
  }
}

document
  .getElementById("registerForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!publicKey) {
      alert("Please connect to MetaMask first.");
      return;
    }

    // Send the registration data including the public key
    try {
      const response = await fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, publicKey }), // Include all properties
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        window.location.href = "getRegisteredElections"; // Redirect to create election page
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while registering.");
    }
  });
