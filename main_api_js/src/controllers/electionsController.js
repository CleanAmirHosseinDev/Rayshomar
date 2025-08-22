const { StatusCodes } = require('http-status-codes');

// MOCK DATA: In a real implementation, this would be fetched from a database
// and the blockchain. For now, this helps us build the frontend.
const mockElections = [
    { id: '1', name: 'Presidential Election 2025', candidates: [
        { id: 0, name: 'Alice' },
        { id: 1, name: 'Bob' }
    ], results: [120, 155] },
    { id: '2', name: 'City Council Election', candidates: [
        { id: 0, name: 'Charlie' },
        { id: 1, name: 'David' },
        { id: 2, name: 'Eve' }
    ], results: [540, 610, 595] },
];

const getAllElections = async (req, res) => {
    // We only return the id and name for the list view
    const elections = mockElections.map(e => ({ id: e.id, name: e.name }));
    res.status(StatusCodes.OK).json({ elections, count: elections.length });
};

const getElection = async (req, res) => {
    const { id } = req.params;
    const election = mockElections.find(e => e.id === id);

    if (!election) {
        // In a real app, this would be a NotFoundError handled by middleware
        return res.status(StatusCodes.NOT_FOUND).json({ msg: `No election with id ${id}` });
    }

    res.status(StatusCodes.OK).json({ election });
};

const castVote = async (req, res) => {
    const { id: electionId } = req.params;
    const { votes } = req.body; // e.g., { "votes": [1, 0, 0] }

    if (!votes || !Array.isArray(votes)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Invalid vote format. Please provide a "votes" array in the request body.' });
    }

    // TODO: This is where the real blockchain interaction will happen.
    // 1. Get user's VoterAccount address from DB.
    // 2. Get the TVoting contract address for this election from DB.
    // 3. Get the server's signing key (the i_rayshomarAddress).
    // 4. Construct the UserOperation calldata for the `executeVote` function.
    // 5. Send the signed UserOperation to the Bundler service.
    // 6. Return the actual transaction hash from the bundler's response.

    console.log(`(MOCK) Received vote for election ${electionId}:`, votes);

    // For now, we return a mock success response to simulate the flow.
    const mockTxHash = `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    res.status(StatusCodes.CREATED).json({
        msg: 'Vote successfully submitted for processing!',
        txHash: mockTxHash
    });
};

module.exports = {
    getAllElections,
    getElection,
    castVote,
};
