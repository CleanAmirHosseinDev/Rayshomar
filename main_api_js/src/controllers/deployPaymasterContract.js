require("dotenv").config();

const fs = require("fs");
const { exec } = require("child_process");
const { StatusCodes } = require("http-status-codes");
const { ethers } = require('ethers');

{/** Deploys the Paymaster Contract */ }
const handleDeployPaymasterContract = async (req, res, next) => {
    console.log('Deploying Paymaster...');

    const execPromise = (command) => {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Exec error: ${error.message}`);
                    return reject(new Error(`Command execution failed: ${error.message}`));
                }
                if (stderr) {
                    console.warn(`stderr: ${stderr}`);
                }
                resolve(stdout);
            });
        });
    };

    try {
        const command = `cd ../dev_api_foundry && forge script script/DeployPaymaster.s.sol:DeployPaymaster --rpc-url ${process.env.SEPOLIA_URL} --private-key ${process.env.PRIVATE_KEY} --broadcast`;

        let stdout;
        try {
            stdout = await execPromise(command);
        } catch (execError) {
            console.error('Deployment command failed:', execError.message);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to deploy Paymaster contract', details: execError.message });
        }

        const addressMatch = stdout.match(/Deployed contract address:\s*(0x[a-fA-F0-9]{40})/);
        const payMasterAddress = addressMatch ? addressMatch[1] : null;

        if (!payMasterAddress) {
            console.error("Paymaster address not found in stdout.");
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Paymaster address not found in deployment output." });
        }
        console.log("Paymaster Contract Deployed Successfully with Contract Address:", payMasterAddress);


        // Delete paymaster config file
        try {
            await fs.promises.unlink("../dev_api_foundry/TransferData/PaymasterData/paymaster.json");
            console.log("Paymaster config file deleted successfully.");
        } catch (fileError) {
            console.warn("Failed to delete Paymaster config file:", fileError.message);
            // Still continue, this is non-critical
        }

        return res.status(StatusCodes.OK).json({ message: "Paymaster deployed successfully.", payMasterAddress });

    } catch (error) {
        console.error('Unhandled error in deployPaymaster:', error);
        if (!res.headersSent) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Unexpected error in deployPaymaster', details: error.message });
        }
    }

}

module.exports = { handleDeployPaymasterContract };

