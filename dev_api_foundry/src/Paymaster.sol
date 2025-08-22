// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BasePaymaster} from "@eth-infinitism-account-abstraction/core/BasePaymaster.sol";
import {PackedUserOperation} from "@eth-infinitism-account-abstraction/interfaces/PackedUserOperation.sol";
import {IEntryPoint} from "@eth-infinitism-account-abstraction/interfaces/IEntryPoint.sol";
import {SIG_VALIDATION_FAILED, SIG_VALIDATION_SUCCESS} from "@eth-infinitism-account-abstraction/core/Helpers.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract Paymaster is BasePaymaster {
    bytes32 private i_merkleRoot;

    constructor(
        address _entryPoint,
        bytes32 _merkleRoot
    ) BasePaymaster(IEntryPoint(_entryPoint)) {
        i_merkleRoot = _merkleRoot;
    }

    receive() external payable {}

    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    )
        internal
        view
        override
        returns (bytes memory context, uint256 validationData)
    {
        address signer = _validateSignature(userOp, userOpHash);
        (bytes32[] memory merkleProof) = _parsePaymasterData(
            userOp.paymasterAndData
        );
        bool isValidVoter = _checkVoter(signer, merkleProof);
        if (!isValidVoter) {
            return ("", SIG_VALIDATION_FAILED);
        }
        return ("", SIG_VALIDATION_SUCCESS);
    }

    function _postOp(
        PostOpMode,
        bytes calldata,
        uint256,
        uint256
    ) internal pure override {
    }

    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal pure returns (address) {
        return ECDSA.recover(userOpHash, userOp.signature);
    }

    function _parsePaymasterData(
        bytes calldata paymasterAndData
    ) internal pure returns (bytes32[] memory merkleProof) {
        (merkleProof) = abi.decode(paymasterAndData, (bytes32[]));
    }

    function _checkVoter(
        address voterAddress,
        bytes32[] memory merkleProof
    ) internal view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(voterAddress));
        return MerkleProof.verify(merkleProof, i_merkleRoot, leaf);
    }
}
