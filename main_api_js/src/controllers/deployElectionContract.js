require('dotenv').config();
const fs = require("fs").promises;
const { exec } = require("child_process");
const { StatusCodes } = require("http-status-codes");
const util = require("util");
const execPromise = util.promisify(exec);

{/** Deploys the TVoting Contract */ }
const handleDeployElectionContract = async (req, res, next) => {
    console.log("Deploying TVoting Contract...");

    const command = `cd ../dev_api_foundry && forge script script/DeployTVoting.s.sol:DeployTVoting \
  --rpc-url ${process.env.SEPOLIA_URL} \
  --private-key ${process.env.PRIVATE_KEY} \
  --broadcast`;

    try {
        const { stdout, stderr } = await execPromise(command);

        if (stderr) {
            console.error("Stderr output:", stderr);
        }
        const addressMatch = stdout.match(/Deployed contract address:\s*(0x[a-fA-F0-9]{40})/);
        const TVotingAddress = addressMatch ? addressMatch[1] : null;

        if (!TVotingAddress) {
            console.error("Contract address not found in output");
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .send("Contract address not found in deployment output");
        }
        console.log("TVoting Contract Deployed Successfully with Contract Address:", TVotingAddress);
        // const { name, NUM_OF_CANDIDATES, voters, NUM_OF_VOTES } = req.election;
        req.electionData = {
            tVotingAddress: TVotingAddress,
            // voters,
        };

        // Delete the temp election file
        const filePath = "../dev_api_foundry/TransferData/ElectionData/election.json";
        try {
            await fs.unlink(filePath);
            console.log("Election file deleted successfully.");
        } catch (fileError) {
            console.warn("Could not delete election file:", fileError.message);
        }

        next();
    } catch (error) {
        console.error("Deployment error:", error);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .send("An error occurred during contract deployment.");
    }
}

module.exports = { handleDeployElectionContract };

