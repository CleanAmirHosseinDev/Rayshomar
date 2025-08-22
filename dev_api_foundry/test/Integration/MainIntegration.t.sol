// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console} from "@forge-std/Test.sol";
import {MakePackedUserOp} from "../../script/MakePackedUserOp.s.sol";

import {TVoting} from "../../src/TVoting.sol";
import {VoterAccountFactory} from "../../src/VoterAccountFactory.sol";
import {VoterAccount} from "../../src/VoterAccount.sol";
import {Paymaster} from "../../src/Paymaster.sol";

import {EntryPoint} from "@eth-infinitism-account-abstraction/core/EntryPoint.sol";
import {PackedUserOperation} from "@eth-infinitism-account-abstraction/interfaces/PackedUserOperation.sol";

contract MainIntegration is Test {
    TVoting tvoting;
    VoterAccount voterAccount;
    Paymaster paymaster;
    EntryPoint entryPoint;
    VoterAccountFactory factory;
    MakePackedUserOp makePackedUserOp;

    address internal constant VOTER_1 = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    uint256 internal constant VOTER_1_PKEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    address internal constant VOTER_2 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address internal constant BUNDLER_ACC = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;
    address internal constant MONEY_ACC = 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65;

    function setUp() public {
        entryPoint = new EntryPoint();
        tvoting = new TVoting(3);
        factory = new VoterAccountFactory(address(entryPoint));

        // Create the voter's smart contract account
        address senderCreator = address(entryPoint.senderCreator());
        vm.prank(senderCreator);
        voterAccount = factory.createAccount(VOTER_1, address(tvoting), 0);

        // Register the new account in the voting contract
        address[] memory tvoters = new address[](1);
        tvoters[0] = address(voterAccount);
        uint256[] memory numOfVotes = new uint256[](1);
        numOfVotes[0] = 1;
        tvoting.startElection(tvoters, numOfVotes);

        // Setup Merkle Tree for Paymaster
        bytes32 leaf1 = keccak256(abi.encodePacked(VOTER_1));
        bytes32 leaf2 = keccak256(abi.encodePacked(VOTER_2));
        bytes32 merkleRoot;
        if (leaf1 < leaf2) {
            merkleRoot = keccak256(abi.encodePacked(leaf1, leaf2));
        } else {
            merkleRoot = keccak256(abi.encodePacked(leaf2, leaf1));
        }
        
        paymaster = new Paymaster(address(entryPoint), merkleRoot);
        makePackedUserOp = new MakePackedUserOp();
    }

    function test_integration_SuccessfulVote() public {
        // 1. Fund Paymaster
        vm.deal(MONEY_ACC, 100 ether);
        vm.startPrank(MONEY_ACC);
        (bool success, ) = address(paymaster).call{value: 30 ether}("");
        require(success, "Failed to send Ether to Paymaster");
        vm.stopPrank();

        // 2. Stake and deposit for Paymaster in EntryPoint
        paymaster.addStake{value: 10 ether}(10);
        paymaster.deposit{value: 5 ether}();

        // 3. Prepare UserOperation
        uint256[] memory _candidates = new uint256[](3);
        _candidates[0] = 1;
        _candidates[1] = 0;
        _candidates[2] = 0;
        bytes memory callData = abi.encodeWithSelector(
            voterAccount.executeVote.selector,
            _candidates
        );

        // 4. Prepare paymasterAndData with the Merkle proof
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = keccak256(abi.encodePacked(VOTER_2));
        bytes memory paymasterAndData = abi.encode(proof);

        // 5. Generate and sign the UserOperation
        PackedUserOperation memory userOp = makePackedUserOp
            .generateSignedUserOperation(
                address(voterAccount),
                callData,
                address(paymaster),
                paymasterAndData,
                address(entryPoint),
                VOTER_1_PKEY
            );

        // 6. Send the UserOperation via the bundler
        PackedUserOperation[] memory ops = new PackedUserOperation[](1);
        ops[0] = userOp;
        entryPoint.handleOps(ops, payable(BUNDLER_ACC));

        // 7. Check the results
        uint256 result = tvoting.getCandidateVoteNum(0);
        assertEq(result, 1, "Vote count should be 1");
    }
}
