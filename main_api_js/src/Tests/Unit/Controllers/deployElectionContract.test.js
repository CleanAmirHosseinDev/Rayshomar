
let mockExecPromise = jest.fn();
jest.mock("util", () => {
    const actual = jest.requireActual("util");
    return {
        ...actual,
        promisify: () => mockExecPromise
    };
});

const { handleDeployElectionContract } = require('../../../controllers/deployElectionContract');
const fs = require("fs").promises;

jest.mock("fs", () => ({
    promises: {
        unlink: jest.fn()
    }
}));

describe("handleDeployElectionContract", () => {
    let req, res, next;

    beforeEach(() => {
        mockExecPromise.mockReset();

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
            send: jest.fn()
        };

        next = jest.fn();
        jest.clearAllMocks();
    });

    it("should read the contract address properly and call next()", async () => {
        const fakeAddress = "0x1234567890abcdef1234567890abcdef12345678";
        mockExecPromise.mockResolvedValue({
            stdout: `Some logs...\nDeployed contract address: ${fakeAddress}\nMore logs...`,
            stderr: ""
        });

        await handleDeployElectionContract(req, res, next);

        expect(req.electionData.tVotingAddress).toBe(fakeAddress);
        expect(fs.unlink).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it("should return error if address not found", async () => {
        mockExecPromise.mockResolvedValue({
            stdout: `Deployment logs without address`,
            stderr: ""
        });

        await handleDeployElectionContract(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Contract address not found in deployment output");
        expect(next).not.toHaveBeenCalled();
    });

    it("should handle shell command errors", async () => {
        mockExecPromise.mockRejectedValue(new Error("Shell error"));

        await handleDeployElectionContract(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("An error occurred during contract deployment.");
        expect(next).not.toHaveBeenCalled();
    });

    it("should continue even if file deletion fails", async () => {
        const fakeAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
        mockExecPromise.mockResolvedValue({
            stdout: `Deployed contract address: ${fakeAddress}`,
            stderr: ""
        });

        fs.unlink.mockRejectedValue(new Error("File not found"));

        await handleDeployElectionContract(req, res, next);

        expect(fs.unlink).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });

});
