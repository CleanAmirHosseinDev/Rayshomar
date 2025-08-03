require("dotenv").config();
const { JsonRpcProvider } = require("ethers");
const { ethers } = require("ethers");
const { StatusCodes } = require("http-status-codes");

{/**Triggers the setForNewElection Function in VoterAccount Contract */ }
const handleSetForNewElectionFunction = async (req, res, next) => {
    console.log('Executing handleSetForNewElection...');

    // const { tVotingAddress, voters } = req.aa;
    // const { votersPublicKey, voterAccounts } = req.body;

    const { tVotingAddress } = req.electionData;
    const { user, electionVoter } = req.body

    let voterAccounts = [];
    let votersPublicKey = [];

    electionVoter.forEach(voter => {
        if (voter.voterAccount) {
            voterAccounts.push(voter.voterAccount);
        }
    });
    user.forEach(eachUser => {
        if (eachUser.publicKey) {
            votersPublicKey.push(eachUser.publicKey);
        }
    });


    // Check if data are fetched
    if (!Array.isArray(votersPublicKey)
        || votersPublicKey.length === 0
        || !Array.isArray(voterAccounts)
        || voterAccounts.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "Missing or invalid Voters data" });
    }
    if (!tVotingAddress) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "No valid election address found" });
    }

    const provider = new JsonRpcProvider(process.env.SEPOLIA_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const abi = ['function setForNewElection(address _rayshomarAddress, address _tVoting) external'];

    let nonce;
    try {
        nonce = await provider.getTransactionCount(wallet.address);
    } catch (err) {
        console.error("Failed to get transaction nonce:", err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to initialize transaction nonce." });
    }

    let failures = [];

    for (let i = 0; i < voterAccounts.length; i++) {
        const voterAccountAddress = voterAccounts[i];

        try {

            const rayshomarAddress = votersPublicKey[i];
            // const voterAccountAddress = voterAccounts[i];
            const contract = new ethers.Contract(voterAccountAddress, abi, wallet);

            console.log(`Sending transaction ${i + 1} to setForNewElection...`);

            const tx = await contract.setForNewElection(rayshomarAddress, tVotingAddress, {
                nonce: nonce++
            });

            const receipt = await tx.wait();
            console.log(`Transaction successful for ${voterAccountAddress}, hash: ${receipt.hash}`);
        } catch (err) {
            console.error(`Error processing ${voterAccountAddress}:`, err.message);
            failures.push({ voterAccountAddress, error: err.message });
        }
    }

    if (failures.length > 0) {
        return res.status(StatusCodes.PARTIAL_CONTENT).json({
            message: "Some transactions failed.",
            failures
        });
    }

    console.log("All transactions processed successfully.");
    next();

}

module.exports = { handleSetForNewElectionFunction }