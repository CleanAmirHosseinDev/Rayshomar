require("dotenv").config();
const fs = require("fs");
const { exec } = require("child_process");
const { StatusCodes } = require("http-status-codes");
const ElectionModel = require('../model/election');
const { NotFoundError } = require("../errors/index");
const { ethers } = require('ethers');


// Deploy Paymaster
const deployPaymaster = async (req, res, next) => {
    console.log('Deploying Paymaster...');
    const { name } = req.election;

    const execPromise = (command) => {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) return reject(error);
                if (stderr) console.error(`stderr: ${stderr}`);
                resolve(stdout);
            });
        });
    };

    try {
        const command = `cd ../dev_api_foundry && forge script script/DeployPaymaster.s.sol:DeployPaymaster --rpc-url ${process.env.SEPOLIA_URL} --private-key ${process.env.PRIVATE_KEY} --broadcast`;
        const stdout = await execPromise(command);

        const addressMatch = stdout.match(/Deployed contract address:\s*(0x[a-fA-F0-9]{40})/);
        const payMasterAddress = addressMatch ? addressMatch[1] : null;

        if (payMasterAddress) {
            const election = await ElectionModel.findOneAndUpdate({ name }, { payMasterAddress });
            if (!election) throw new NotFoundError(`Election not found with name: ${name}`);

            console.log('Paymaster Address saved to Database successfully.');

            await fs.promises.unlink("../dev_api_foundry/TransferData/PaymasterData/paymaster.json");
            console.log("Paymaster config file deleted successfully.");

        } else {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Paymaster Address not found in output");
        }
    } catch (error) {
        console.error('Error in deployPaymaster:', error);
        if (!res.headersSent) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error in deployPaymaster: ${error.message}`);
        }
    }
};

const addStake = async (req, res, next) => {
    console.log('Executing addStake...');
    const { name } = req.election;
    const provider = new ethers.getDefaultProvider("http://127.0.0.1:8545");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const abi = ['function addStake(uint32 unstakeDelaySec) external payable'];

    try {
        const election = await ElectionModel.findOne({ name });
        if (!election || !election.payMasterAddress) {
            throw new NotFoundError(`Paymaster address not found for election: ${name}`);
        }
        const payMasterContractAddress = election.payMasterAddress;

        const contract = new ethers.Contract(payMasterContractAddress, abi, wallet);

        console.log(`Sending transaction to addStake...`);
        const tx = await contract.addStake(10, { value: ethers.parseUnits("10", "ether") });

        const receipt = await tx.wait();
        console.log('Transaction to addStake successful with hash:', receipt.hash);

        // Optionally send a success response or call next middleware
        if (!res.headersSent) {
            res.status(StatusCodes.OK).send(`addStake successful with transaction hash: ${receipt.hash}`);
        }
    } catch (error) {
        console.error('Error in addStake:', error);
        if (!res.headersSent) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error in addStake: ${error.message}`);
        }
    } finally {
        next()
    }

}

// Deposit Paymaster
const depositPaymaster = async (req, res, next) => {
    console.log('Executing depositPaymaster...');
    const { name } = req.election;
    const provider = new ethers.getDefaultProvider("http://127.0.0.1:8545");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const abi = ['function deposit() public payable'];

    try {
        const election = await ElectionModel.findOne({ name });
        if (!election || !election.payMasterAddress) {
            throw new NotFoundError(`Paymaster address not found for election: ${name}`);
        }
        const payMasterContractAddress = election.payMasterAddress;

        const contract = new ethers.Contract(payMasterContractAddress, abi, wallet);

        console.log(`Sending transaction to deposit...`);
        const tx = await contract.deposit({ value: ethers.parseUnits("10", "ether") });

        const receipt = await tx.wait();
        console.log('Transaction to deposit successful with hash:', receipt.hash);

        // Optionally send a success response or call next middleware
        if (!res.headersSent) {
            res.status(StatusCodes.OK).send(`Deposit successful with transaction hash: ${receipt.hash}`);
        }
    } catch (error) {
        console.error('Error in depositPaymaster:', error);
        if (!res.headersSent) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error in depositPaymaster: ${error.message}`);
        }
    }
};

module.exports = { deployPaymaster, addStake, depositPaymaster };
