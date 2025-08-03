require("dotenv").config();
const { JsonRpcProvider } = require("ethers");
const { ethers } = require("ethers");
const { StatusCodes } = require("http-status-codes");

{/**Triggers the StartElection Function in TVoting Contract */ }
const handleStartElectionFunction = async (req, res, next) => {
    console.log("Executing startElection...");

    // const { tVotingAddress } = req.aa;
    // const { NUM_OF_VOTES } = req.election;
    // const { voterAccounts } = req.body;
    const { tVotingAddress } = req.electionData;
    const { electionVoter } = req.body

    let voterAccounts = [];
    let NUM_OF_VOTES = [];

    electionVoter.forEach(voter => {
        if (voter.voterAccount) {
            voterAccounts.push(voter.voterAccount);
        }
        if (voter.shareCount) {
            NUM_OF_VOTES.push(voter.shareCount);
        }
    });


    // Check if data are fetched
    if (!electionVoter.length || !voterAccounts.length || !NUM_OF_VOTES.length) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "No valid voter data found" });
    }
    if (!tVotingAddress) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "No valid election address found" });
    }

    // Set up contract and attempt to call startElection
    const provider = new JsonRpcProvider(process.env.SEPOLIA_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const abi = ['function startElection(address[] memory _voters, uint256[] _numOfVotes) public'];
    const contract = new ethers.Contract(tVotingAddress, abi, wallet);

    console.log("Sending transaction to startElection...");

    try {
        const nonce = await provider.getTransactionCount(wallet.address);

        const tx = await contract.startElection(voterAccounts, NUM_OF_VOTES, {
            nonce: nonce
        });
        const receipt = await tx.wait();

        console.log("Transaction successful! Hash:", receipt.hash);
        // res.status(StatusCodes.OK).send("startElection transaction sent and confirmed");

    } catch (error) {
        console.error("Error calling startElection:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: "Failed to call startElection",
            details: error.reason || error.message || "Unknown blockchain error"
        });
    }

    next();
}

module.exports = { handleStartElectionFunction }