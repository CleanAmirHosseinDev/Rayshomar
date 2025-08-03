// We set the setElection function as a middleware
require("dotenv").config();
const fs = require("fs");
const { exec } = require("child_process");
const ElectionModel = require("../model/election");
const { StatusCodes } = require("http-status-codes");

const deployContract = async (req, res, next) => {
  console.log('before running the command');

  exec(
    `cd ../dev_api_foundry && forge script script/DeployTVoting.s.sol:DeployTVoting --rpc-url ${process.env.SEPOLIA_URL} --private-key ${process.env.PRIVATE_KEY} --broadcast`,
    async (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send(`Error deploying contract: ${error.message}`);
      }

      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }

      // Access contract address
      const addressMatch = stdout.match(
        /Deployed contract address:\s*(0x[a-fA-F0-9]{40})/
      );
      const TVotingAddress = addressMatch ? addressMatch[1] : null;

      if (!TVotingAddress) {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send("Contract address not found in output");
      }

      // Adding the election to the db
      const { name, NUM_OF_CANDIDATES, voters, NUM_OF_VOTES } = req.election;
      try {
        await ElectionModel.create({
          name,
          NUM_OF_CANDIDATES,
          voters,
          NUM_OF_VOTES,
          contractAddress: TVotingAddress,
          entryPointAddress: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
        });
        console.log("Election saved to database, the TVoting address:", TVotingAddress);
        req.aa = {
          tVotingAddress: TVotingAddress,
          voters: voters
        };
      } catch (dbError) {
        console.error("Error saving to database:", dbError);
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send("Error saving to database");
      }

      // Deleting election config file
      fs.unlink("../dev_api_foundry/TransferData/ElectionData/election.json", (err) => {
        if (err) {
          console.error("Error deleting the file:", err);
        } else {
          console.log("tVoting File deleted successfully");
        }
      });

      next();
    }
  );
};

module.exports = { deployContract };
