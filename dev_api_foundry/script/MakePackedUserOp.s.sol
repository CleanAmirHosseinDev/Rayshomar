// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console2} from "@forge-std/Script.sol";

import {PackedUserOperation} from "@eth-infinitism-account-abstraction/interfaces/PackedUserOperation.sol";
import {IEntryPoint} from "@eth-infinitism-account-abstraction/interfaces/IEntryPoint.sol";

import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MakePackedUserOp is Script {
    using MessageHashUtils for bytes32;

    function generateSignedUserOperation(
        address voterAcount,
        bytes memory callData,
        address payMasterAddress,
        bytes memory merkleProof,
        address entryPoint,
        uint256 privateKey
    ) public view returns (PackedUserOperation memory) {
        // 1. Generate the unsigned data
        uint256 nonce = vm.getNonce(voterAcount) - 1;
        PackedUserOperation memory userOp = _generateUnsignedUserOperation(
            voterAcount,
            nonce,
            callData,
            payMasterAddress,
            merkleProof
        );
        // 2. Get the userOp Hash
        bytes32 userOpHash = IEntryPoint(entryPoint).getUserOpHash(userOp);
        bytes32 digest = userOpHash.toEthSignedMessageHash();

        // 3. Sign it
        uint8 v;
        bytes32 r;
        bytes32 s;

        (v, r, s) = vm.sign(privateKey, digest);

        userOp.signature = abi.encodePacked(r, s, v); // Note the order
        return userOp;
    }

    function _generateUnsignedUserOperation(
        address voterAcount,
        uint256 nonce,
        bytes memory callData,
        address paymaster,
        bytes memory merkleProof
    ) internal pure returns (PackedUserOperation memory) {
        uint128 verificationGasLimit = 1000000;
        uint128 callGasLimit = verificationGasLimit;
        uint128 maxPriorityFeePerGas = 5;
        uint128 maxFeePerGas = maxPriorityFeePerGas;
        uint128 pmVerificationGasLimit = 1000000;
        uint128 pmPostOpGasLimit = 0;

        bytes memory _paymasterAndData = abi.encodePacked(
            address(paymaster),
            pmVerificationGasLimit,
            pmPostOpGasLimit,
            merkleProof
        );

        return
            PackedUserOperation({
                sender: voterAcount,
                nonce: nonce,
                initCode: hex"",
                callData: callData,
                accountGasLimits: bytes32(
                    (uint256(verificationGasLimit) << 128) | callGasLimit
                ),
                preVerificationGas: verificationGasLimit,
                gasFees: bytes32(
                    (uint256(maxPriorityFeePerGas) << 128) | maxFeePerGas
                ),
                paymasterAndData: _paymasterAndData,
                signature: hex""
            });
    }
}
