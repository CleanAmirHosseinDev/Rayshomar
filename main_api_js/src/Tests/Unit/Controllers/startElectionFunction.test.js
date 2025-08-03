const { handleStartElectionFunction } = require("../../../controllers/startElectionFunction");
const { ethers, JsonRpcProvider } = require("ethers");

jest.mock("ethers");
describe("handleStartElectionFunction", () => {
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
            },
            electionData: {
                tVotingAddress: "0x1234567890abcdef1234567890abcdef12345678"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };

        next = jest.fn();
        jest.clearAllMocks();
    });

    it("should return 400 if voterAccounts data fields are missing", async () => {
        req = {
            body: {
                electionVoter: [
                    {
                        userId: "string",
                        "shareCount": 6,
                    },
                    {
                        userId: "string",
                        "shareCount": 5,
                    },
                ],
            },
            electionData: {
                tVotingAddress: "0x1234567890abcdef1234567890abcdef12345678"
            }

        };

        handleStartElectionFunction(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "No valid voter data found" });
        expect(next).not.toHaveBeenCalled();

    });

    it("should return 400 if shareCount data fields are missing", async () => {
        req = {
            body: {
                electionVoter: [
                    {
                        userId: "string",
                        voterAccount: ["account1", "account2"]
                    }
                ],
            },
            electionData: {
                tVotingAddress: "0x1234567890abcdef1234567890abcdef12345678"
            }

        };

        handleStartElectionFunction(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "No valid voter data found" });
        expect(next).not.toHaveBeenCalled();

    });

    it("should call contract.startElection and proceed to next", async () => {
        const mockTx = {
            wait: jest.fn().mockResolvedValue({ hash: "0xMOCKHASH" })
        };

        const mockContract = {
            startElection: jest.fn().mockResolvedValue(mockTx)
        };

        const mockWallet = {
            address: "0xMockWallet"
        };

        ethers.JsonRpcProvider.mockImplementation(() => ({
            getTransactionCount: jest.fn().mockResolvedValue(1)
        }));

        ethers.Wallet.mockImplementation(() => mockWallet);
        ethers.Contract.mockImplementation(() => mockContract);

        await handleStartElectionFunction(req, res, next);

        expect(mockContract.startElection).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });

    it("should return 500 if the contract.startElection transaction failed", async () => {
        const mockTx = {
            wait: jest.fn().mockResolvedValue({ hash: "0xMOCKHASH" })
        };
        const mockContract = {
            startElection: jest.fn().mockResolvedValue(mockTx)
        };
        ethers.JsonRpcProvider.mockImplementation(() => ({
            getTransactionCount: jest.fn().mockResolvedValue(1)
        }));
        const mockWallet = {
            address: "0xMockWallet"
        };
        const fakeError = new Error("Simulated blockchain failure");
        ethers.Contract.mockImplementation(() => ({
            startElection: jest.fn().mockRejectedValue(fakeError)
        }));

        await handleStartElectionFunction(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Failed to call startElection", details: "Simulated blockchain failure" })
        expect(next).not.toHaveBeenCalled();
    })

})