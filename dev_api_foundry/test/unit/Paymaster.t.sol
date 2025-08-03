// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.26;
// to check the functionality of the each Paymaster functions...
// we only check the Validatation Part not the other parts because they are already copied from eth-infintism erc-4347

import {Test, console} from "@forge-std/Test.sol";
import {Paymaster} from "../../src/Paymaster.sol";

import {EntryPoint} from "@eth-infinitism-account-abstraction/core/EntryPoint.sol";
import {PackedUserOperation} from "@eth-infinitism-account-abstraction/interfaces/PackedUserOperation.sol";

import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract PaymasterTest is Test {
    using MessageHashUtils for bytes32;

    Paymaster public paymaster;
    EntryPoint public entryPoint;
    bytes32 public merkleRoot;

    function setUp() public {
        // Initialize the merkleRoot and deploy the Paymaster contract
        merkleRoot = 0xd21ca6424df344c7bdcd3d65c364ffa0cfbe7e04510d81fa57c175716da06376;
        entryPoint = new EntryPoint();
        paymaster = new Paymaster(address(entryPoint), merkleRoot);
    }

    /*//////////////////////////////////////////////////////////////
                              _CHECKVOTERS
    //////////////////////////////////////////////////////////////*/

    function test_checkVoterValidProof() public view {
        // Address to be validated
        address voterAddress = address(
            0x1111111111111111111111111111111111111111
        );

        // Create a Merkle proof for the voter address
        bytes32[] memory proof = new bytes32[](2);
        proof[
            0
        ] = 0xbd164a4590db938a0b098da1b25cf37b155f857b38c37c016ad5b8f8fce80192;
        proof[
            1
        ] = 0x4de471fd4dc354047905142d46b40b7b787cb74950fa3bcc2b0dad59d44c00b0;

        // Ensure the Merkle proof is valid
        assertTrue(paymaster._checkVoter(voterAddress, proof));
    }

    function test_checkVoterInvalidProof() public view {
        // Address to be validated
        address voterAddress = address(0x456);

        // Create an invalid Merkle proof for the voter address
        bytes32[] memory proof = new bytes32[](2);
        proof[
            0
        ] = 0xbd164a4590db938a0b098da1b25cf37b155f857b38c37c016ad5b8f8fce80192;
        proof[
            1
        ] = 0x4de471fd4dc354047905142d46b40b7b787cb74950fa3bcc2b0dad59d44c00b0;

        // Ensure the Merkle proof is invalid
        assertFalse(paymaster._checkVoter(voterAddress, proof));
    }

    function testCheckVoterEmptyProof() public view {
        // Address to be validated
        address voterAddress = address(0x456);

        // Create an empty Merkle proof
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = 0;

        // Ensure the Merkle proof is invalid
        assertFalse(paymaster._checkVoter(voterAddress, proof));
    }

    /*//////////////////////////////////////////////////////////////
                              _GETMERKLEPROOF
    //////////////////////////////////////////////////////////////*/

    function test_getMerkleProof() public view {
        address senderAddress = 0x1111111111111111111111111111111111111111;

        bytes32[] memory expected_proof = new bytes32[](2);
        expected_proof[
            0
        ] = 0xbd164a4590db938a0b098da1b25cf37b155f857b38c37c016ad5b8f8fce80192;
        expected_proof[
            1
        ] = 0x4de471fd4dc354047905142d46b40b7b787cb74950fa3bcc2b0dad59d44c00b0;

        bytes16 gas1 = 0x00000000000000000000000000000001;
        bytes16 gas2 = 0x00000000000000000000000000000002;

        bytes memory paymasterAndData = abi.encodePacked(
            senderAddress,
            gas1,
            gas2,
            expected_proof[0],
            expected_proof[1]
        );

        console.logBytes(paymasterAndData);

        bytes32[] memory merkleProof = paymaster._getMerkleProof(
            paymasterAndData
        );

        console.logBytes32(merkleProof[0]);
        console.logBytes32(merkleProof[1]);

        assertEq(merkleProof, expected_proof);
    }

    /*//////////////////////////////////////////////////////////////
                              _GETSIGNERADDRESS
    //////////////////////////////////////////////////////////////*/

    function test_getSignerAddress() public view {
        // we need a userOpHash
        uint128 verificationGasLimit = 16777216;
        uint128 callGasLimit = verificationGasLimit;
        uint128 maxPriorityFeePerGas = 256;
        uint128 maxFeePerGas = maxPriorityFeePerGas;
        PackedUserOperation memory userOp = PackedUserOperation({
            sender: 0x1111111111111111111111111111111111111111,
            nonce: 0,
            initCode: hex"",
            callData: hex"",
            accountGasLimits: bytes32(
                (uint256(verificationGasLimit) << 128) | callGasLimit
            ),
            preVerificationGas: verificationGasLimit,
            gasFees: bytes32(
                (uint256(maxPriorityFeePerGas) << 128) | maxFeePerGas
            ),
            paymasterAndData: hex"",
            signature: hex""
        });
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



        address signerAddress = paymaster._getSignerAddress(userOp, userOpHash);
        assertEq(signerAddress, 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266);
    }
}
