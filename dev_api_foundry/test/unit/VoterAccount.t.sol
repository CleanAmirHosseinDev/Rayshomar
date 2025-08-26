// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {Test, console} from "@forge-std/Test.sol";
import {VoterAccount} from "../../src/VoterAccount.sol";
import {VoterAccountFactory} from "../../src/VoterAccountFactory.sol";
import {TVoting} from "../../src/TVoting.sol";
import {EntryPoint} from "@eth-infinitism-account-abstraction/core/EntryPoint.sol";
import {PackedUserOperation} from "@eth-infinitism-account-abstraction/interfaces/PackedUserOperation.sol";
import {MakePackedUserOp} from "../../script/MakePackedUserOp.s.sol";

contract VoterAccountTest is Test {
    VoterAccount public voterAccount;
    VoterAccountFactory public factory;
    EntryPoint public entryPoint;
    TVoting public tVoting;
    MakePackedUserOp public makePackedUserOp;

    address internal constant VOTER_ELECTION_OWNER =
        0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    uint256 internal constant VOTER_PKEY =
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    address internal constant BUNDLER_ACC =
        0x70997970C51812dc3A010C7d01b50e0d17dc79C8;

    function setUp() public {
        entryPoint = new EntryPoint();
        tVoting = new TVoting(3);
        factory = new VoterAccountFactory(address(entryPoint));

        // Deploy a VoterAccount for our test voter
        voterAccount = factory.createAccount(
            VOTER_ELECTION_OWNER,
            address(tVoting),
            0
        );

        // Register the new VoterAccount in the TVoting contract
        address[] memory voterAccounts = new address[](1);
        voterAccounts[0] = address(voterAccount);
        uint256[] memory numOfVotes = new uint256[](1);
        numOfVotes[0] = 1;
        tVoting.startElection(voterAccounts, numOfVotes);

        makePackedUserOp = new MakePackedUserOp();
    }

    function test_executeVote_successful() public {
        // 1. Prepare UserOperation to call `executeVote`
        uint256[] memory candidates = new uint256[](3);
        candidates[0] = 1; // Vote for candidate 0
        bytes memory callData = abi.encodeWithSelector(
            voterAccount.executeVote.selector,
            candidates
        );

        // 2. Generate and sign the UserOperation (without a paymaster)
        PackedUserOperation memory userOp = makePackedUserOp
            .generateSignedUserOperation(
                address(voterAccount),
                callData,
                address(0), // No paymaster
                "", // No paymaster data
                address(entryPoint),
                VOTER_PKEY
            );

        // 3. Fund the account with enough ETH to pay for the transaction
        vm.deal(address(voterAccount), 1 ether);

        // 4. Send the UserOperation
        PackedUserOperation[] memory ops = new PackedUserOperation[](1);
        ops[0] = userOp;
        entryPoint.handleOps(ops, payable(BUNDLER_ACC));

        // 5. Check that the vote was counted
        uint256 voteCount = tVoting.getCandidateVoteNum(0);
        assertEq(voteCount, 1, "Vote should have been counted.");
    }
}
