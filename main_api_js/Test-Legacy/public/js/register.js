import { ethers } from "./ethers-6.7.esm.min.js";

async function generateKeyPairFunction(password) {

  // Create a wallet for registered users
  const newWallet = ethers.Wallet.createRandom();
  const publicKey = newWallet.address; // this is the address of the wallet actually
  const encryptedJson = await newWallet.encrypt(password); // encrypte privateKey with password

  return {
    publicKey,
    encryptedJson,
  };
}

document
  .getElementById("registerForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { publicKey, encryptedJson } = await generateKeyPairFunction(password);



    // Send the registration data including the public key and encryptedJson to db
    try {
      const response = await fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          publicKey,
          encryptedJson,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        window.location.href = "create-election";
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while registering.");
    }
  });