// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.26;
// to check the functionality of the each Paymaster functions...
// we only check the Validatation Part not the other parts because they are already copied from eth-infintism erc-4347

import {Test, console} from "@forge-std/Test.sol";
import {VoterAccount} from "../../src/VoterAccount.sol";
import {TVoting} from "../../src/TVoting.sol";
import {MakePackedUserOp} from "../../script/MakePackedUserOp.s.sol";

import {EntryPoint} from "@eth-infinitism-account-abstraction/core/EntryPoint.sol";
import {PackedUserOperation} from "@eth-infinitism-account-abstraction/interfaces/PackedUserOperation.sol";

import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract PaymasterTest is Test {
    using MessageHashUtils for bytes32;

    VoterAccount public voterAccount;
    EntryPoint public entryPoint;
    TVoting public tVoting;
    MakePackedUserOp public makePackedUserOp;

    bytes32 public merkleRoot;

    function setUp() public {
        // Initialize the merkleRoot and deploy the Paymaster contract
        merkleRoot = 0x58f8e12b6ea87c29254f6b9f8e845f086aefa9f69b59b337ac9fe40fd8d1e9da;
        address[] memory voters = new address[](10);
        voters[0] = address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266);
        voters[1] = address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
        voters[2] = address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);
        voters[3] = address(0x90F79bf6EB2c4f870365E785982E1f101E93b906);
        voters[4] = address(0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65);
        voters[5] = address(0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc);
        voters[6] = address(0x976EA74026E726554dB657fA54763abd0C3a0aa9);
        voters[7] = address(0x14dC79964da2C08b23698B3D3cc7Ca32193d9955);
        voters[8] = address(0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f);
        voters[9] = address(0xa0Ee7A142d267C1f36714E4a8F75612F20a79720);

        entryPoint = new EntryPoint();
        tVoting = new TVoting(3);
        voterAccount = new VoterAccount(
            address(entryPoint)
        );
        voterAccount.setForNewElection(voters[0], address(tVoting));
        address[] memory voterAccounts = new address[](1);
        voterAccounts[0] = address(voterAccount);
        uint256[] memory numOfVotes = new uint256[](1);
        numOfVotes[0] = 1;
        tVoting.startElection(voterAccounts,numOfVotes);

        makePackedUserOp = new MakePackedUserOp();

    }

    function test_ValidateUserOp() public {
        // create a user operation
        //check if the user operation is valid
        bytes32[] memory _proof = new bytes32[](3);
        _proof[0] = 0xf1b365a92d81563b3458046f18ed62ee1ce7ddc391bd10e7f934ce4c1c3045a7;
        _proof[1] = 0xd0596c46e7822f4074f22d562d30f0927fe292c62e30666629647137c371074b;
        _proof[2] = 0x2a3cb55154243e3bf9cfbb98f8ed87dd65f0f3f3c1e95e4a9e746c3b2b09d6a6;
        bytes memory proof = abi.encodePacked(_proof);
        

        PackedUserOperation memory userOp = makePackedUserOp.generateSignedUserOperation(address(voterAccount),proof, address(0), proof, address(entryPoint), 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80);


        bytes32 userOpHash = entryPoint.getUserOpHash(userOp);
        console.logBytes32(userOpHash);

        bytes32 digest = userOpHash.toEthSignedMessageHash();

        console.logBytes32(digest);
        // we need a userOp.signiture
        // 3. Sign it
        uint8 v;
        bytes32 r;
        bytes32 s;
        uint256 ANVIL_DEFAULT_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

        (v, r, s) = vm.sign(ANVIL_DEFAULT_KEY, digest);

        userOp.signature = abi.encodePacked(r, s, v); // Note the order
        console.logBytes(userOp.signature);

        vm.prank(address(entryPoint));
        uint256 validationData = voterAccount.validateUserOp(
            userOp,
            userOpHash,
            0
        );
        assertEq(validationData, 0);
    }

    function test_execute() public {
        uint256[] memory _candidate = new uint256[](3);
        _candidate[0] = 1;
        _candidate[1] = 0;  
        _candidate[2] = 0; 
        vm.prank(address(voterAccount));
        tVoting.vote(_candidate);

        uint256 expectedValue = 1;
        uint256 actualValue = tVoting.getCandidateVoteNum(0);

        assertEq(actualValue, expectedValue);
    }
}
