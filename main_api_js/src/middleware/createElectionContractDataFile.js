const fs = require("fs").promises;
const path = require("path");
const { StatusCodes } = require("http-status-codes");

{/** Creates Temporary Data File For TVoting.sol To Use */ }
const handleElectionContractDataFile = async (req, res, next) => {
    try {

        const { numberOfCandidates,
            // voters, NUM_OF_VOTES,
            // name
        } = req.body.election;

        if (!numberOfCandidates
            // || !Array.isArray(voters)
            // || !NUM_OF_VOTES
            // || !name
        ) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: "Missing Required Election Data Fields." });
        }

        const numOfCandidates = Number(numberOfCandidates);
        const data = { NUM_OF_CANDIDATES: numOfCandidates };

        // Save structured data for other middleware/controllers
        // req.election = {
        //     name,
        //     NUM_OF_CANDIDATES: numOfCandidates,
        //     voters,
        //     NUM_OF_VOTES,
        // };
        const filePath = path.resolve(__dirname, "../../../dev_api_foundry/TransferData/ElectionData/election.json");

        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log("TVoting data written to election.json");

        next();
    } catch (err) {
        console.error("Error Writing Election Data File:", err.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to Write Election Contract Data File." });
    }
};

module.exports = handleElectionContractDataFile;
