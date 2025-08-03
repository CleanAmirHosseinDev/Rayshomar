const { ethers } = require("ethers");
const { handleSetForNewElectionFunction } = require("../../../controllers/setForNewElectionFunction");
const { StatusCodes } = require("http-status-codes");

jest.mock("ethers");

describe("handleSetForNewElectionFunction", () => {
    let req, res, next;
    beforeEach(() => {
        req = {
            body: {
                user: [
                    {
                        id: "string",
                        phoneNumber: "string",
                        publicKey: "string"
                    },
                    {
                        id: "string",
                        phoneNumber: "string",
                        publicKey: "string"
                    },
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
                    },
                    {
                        userId: "string",
                        shareCount: "int",
                        voterAccount: "0xabc2"
                    },
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
    it("should retrun 400 if voters publicKeys are missing or invalid", async () => {
        req = {
            body: {
                user: [
                    {
                        id: "string",
                        phoneNumber: "string",
                        publicKey: null
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

        handleSetForNewElectionFunction(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Missing or invalid Voters data" });
        expect(next).not.toHaveBeenCalled();
    });

    it("should handle partial failures correctly", async () => {

        // Mock contract method

        mockContract = {
            setForNewElection: jest
                .fn()
                .mockResolvedValueOnce({ wait: jest.fn().mockResolvedValue({ hash: "0x123" }) })
                .mockRejectedValueOnce(new Error("Transaction failed"))
                .mockResolvedValueOnce({ wait: jest.fn().mockResolvedValue({ hash: "0x345" }) })
        };

        // Mock ethers.Contract constructor
        ethers.Contract.mockImplementation(() => mockContract);

        await handleSetForNewElectionFunction(req, res, next);

        expect(mockContract.setForNewElection).toHaveBeenCalledTimes(3);
        expect(res.status).toHaveBeenCalledWith(StatusCodes.PARTIAL_CONTENT);
        expect(res.json).toHaveBeenCalledWith({
            message: "Some transactions failed.",
            failures: [
                {
                    voterAccountAddress: "0xabc2",
                    error: "Transaction failed"
                }
            ]
        });

        expect(next).not.toHaveBeenCalled();
    });

    it("should call next if all transactions succeed", async () => {
        mockContract = {
            setForNewElection: jest.fn().mockResolvedValue({
                wait: jest.fn().mockResolvedValue({ hash: "0xsuccess" })
            })
        };

        ethers.Contract.mockImplementation(() => mockContract);

        await handleSetForNewElectionFunction(req, res, next);

        expect(mockContract.setForNewElection).toHaveBeenCalledTimes(3);
        expect(next).toHaveBeenCalled();
    });
})