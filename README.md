# Rayshomar Online Voting System - Blockchain Layer

This repository contains the blockchain infrastructure for the Rayshomar online voting platform. This system provides a secure, transparent, and efficient foundation for conducting elections using the latest Ethereum standards.

## Architecture

This project consists of two main components:

1.  **Smart Contracts (`dev_api_foundry`):** Developed using the **Foundry** framework.
2.  **Node.js API (`main_api_js`):** Acts as an intermediary layer between the main backend and the blockchain network.

### ERC-4337 Account Abstraction

The core of this system is designed around the **ERC-4337 (Account Abstraction)** standard. This architecture allows users to participate in voting without needing an externally owned account (EOA) or directly paying for gas fees.

![Architecture Diagram](dev_api_foundry/Account%20Abstraction%20Digram.png)

The main components of this architecture are:

-   **EntryPoint:** A central, singleton contract that manages and executes all UserOperations.
-   **VoterAccountFactory:** A factory for deploying new smart contract accounts for each voter using `CREATE2`, which allows for deterministic address generation.
-   **VoterAccount:** The smart contract wallet for each user, containing the core voting logic.
-   **Paymaster:** A contract that sponsors transactions for valid users, enabling gasless voting.
-   **Bundler:** An off-chain component that gathers UserOperations and submits them in a batch to the `EntryPoint`.

## ✨ Key Features

-   **Latest ERC-4337 Standard (v0.8.0):** Ensures compatibility with the latest improvements and security features.
-   **Ready for Native AA:** With support for EIP-7702, the project is forward-compatible with the future of native account abstraction on Ethereum.
-   **Gasless Voting:** The `Paymaster` contract covers transaction costs for authorized voters.
-   **Enhanced Security:** Utilizes standard, audited base contracts from OpenZeppelin and implements security mechanisms like the `senderCreator` check to prevent front-running attacks.
-   **Developed with Foundry:** Employs the modern and high-speed Foundry toolkit for smart contract development and testing.

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [Foundry](https://getfoundry.sh/)

### Installation

1.  **Smart Contracts:**
    ```bash
    cd dev_api_foundry
    forge install
    ```

2.  **Node.js Server:**
    ```bash
    cd main_api_js
    npm install
    ```

## 🧪 Testing and Deployment

### Running Tests

To run the complete test suite for the smart contracts, execute the following command in the `dev_api_foundry` directory:

```bash
forge test
```

### Deployment

The necessary deployment scripts are located in the `dev_api_foundry/script` directory. You can run them using the `forge script` command. For example, to deploy the `VoterAccountFactory`:

```bash
forge script script/DeployVoterAccount.s.sol --rpc-url <YOUR_RPC_URL> --private-key <YOUR_PRIVATE_KEY> --broadcast
```
