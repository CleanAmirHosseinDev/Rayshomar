const fs = require("fs");
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');


{/** Creates Temporary Data File For Paymaster.sol To Use */ }
const handlePaymasterContractDataFile = async (req, res, next) => {
    try {
        const { user, electionVoter } = req.body
        // const { votersPublicKey } = req.body;

        let votersPublicKey = [];
        user.forEach(eachUser => {
            if (eachUser.publicKey) {
                votersPublicKey.push(eachUser.publicKey);
            }
        });

        if (votersPublicKey.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: "Missing Required Paymaster Data Fields." });
        }

        // Generate Merkle tree root
        const leaves = votersPublicKey.map((x) => keccak256(x));
        const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
        const root = merkleTree.getRoot().toString("hex");

        const data = {
            Entrypoint: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            MerkleRootHash: root,
        };

        const filePath = path.resolve(__dirname, "../../../dev_api_foundry/TransferData/PaymasterData/paymaster.json");

        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log("Paymaster data written to file successfully.");

        next();
    } catch (error) {
        console.error("Error Writing Paymaster Data File!", error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to Write Paymaster Contract Data File." });
    }
};





module.exports = handlePaymasterContractDataFile;
