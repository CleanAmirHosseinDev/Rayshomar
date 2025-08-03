const handleElectionContractDataFile = require('../../../middleware/createElectionContractDataFile');
const fs = require("fs").promises;
const path = require("path");

jest.mock("fs", () => ({
    promises: {
        writeFile: jest.fn()
    }
}));

describe("handleElectionContractDataFile middleware", () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {
                user: [
                    {
                        id: "string",
                        phoneNumber: "string",
                        publicKey: "string"
                    }
                ],
                electionVoter: [
                    {
                        userId: "string",
                        shareCount: "int",
                        voterAccount: "string"
                    }
                ],
                election: {
                    voterCount: "int",
                    numberOfCandidates: "12"
                }
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();
        jest.clearAllMocks();
    });

    it("should create a file and call next()", async () => {
        await handleElectionContractDataFile(req, res, next);

        const expectedData = {
            NUM_OF_CANDIDATES: 12
        };

        const expectedPath = path.resolve(__dirname, "../../../../../dev_api_foundry/TransferData/ElectionData/election.json");

        expect(fs.writeFile).toHaveBeenCalledWith(expectedPath, JSON.stringify(expectedData, null, 2));
        expect(next).toHaveBeenCalled();
    });

    it("should return 400 if required fields are missing", async () => {
        req.body.election = {};

        await handleElectionContractDataFile(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Missing Required Election Data Fields." });
        expect(fs.writeFile).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 500 on writeFile error", async () => {
        fs.writeFile.mockRejectedValue(new Error("Disk is full"));

        await handleElectionContractDataFile(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Failed to Write Election Contract Data File." });
        expect(next).not.toHaveBeenCalled();
    });
});
