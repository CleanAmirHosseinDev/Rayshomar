// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import {Paymaster} from "../../src/Paymaster.sol";
import {EntryPoint} from "@eth-infinitism-account-abstraction/core/EntryPoint.sol";
import {PackedUserOperation} from "@eth-infinitism-account-abstraction/interfaces/PackedUserOperation.sol";
import {SIG_VALIDATION_FAILED, SIG_VALIDATION_SUCCESS} from "@eth-infinitism-account-abstraction/core/Helpers.sol";
// (اختیاری) فقط برای توضیحات مرکل: OZ داخل hashPair ترتیب رو خودش رعایت می‌کند
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract PaymasterTest is Test {
    Paymaster public paymaster;
    EntryPoint public entryPoint;
    bytes32 public merkleRoot;

    address internal constant VOTER_1 =
        0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    uint256 internal constant VOTER_1_PKEY =
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    address internal constant VOTER_2 =
        0x70997970C51812dc3A010C7d01b50e0d17dc79C8;

    address internal constant UNLISTED_VOTER =
        0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
    uint256 internal constant UNLISTED_VOTER_PKEY =
        0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;

    function setUp() public {
        // دو برگ: keccak(address)
        bytes32 leaf1 = keccak256(abi.encodePacked(VOTER_1));
        bytes32 leaf2 = keccak256(abi.encodePacked(VOTER_2));

        // OpenZeppelin MerkleProof هنگام ساخت parent ترتیب (min,max) را رعایت می‌کند،
        // پس روت را هم با همین ترتیب می‌سازیم تا verify درست کار کند.
        if (leaf1 < leaf2) {
            merkleRoot = keccak256(abi.encodePacked(leaf1, leaf2));
        } else {
            merkleRoot = keccak256(abi.encodePacked(leaf2, leaf1));
        }

        entryPoint = new EntryPoint();
        paymaster = new Paymaster(address(entryPoint), merkleRoot);
    }

    function test_validatePaymasterUserOp_ValidProof() public {
        // برای VOTER_1، پروف = [leaf2] (چون درخت دوبرگی است)
        bytes32;
        proof[0] = keccak256(abi.encodePacked(VOTER_2));

        PackedUserOperation memory userOp = _buildUserOp(
            VOTER_1,
            abi.encode(proof)
        );

        bytes32 userOpHash = entryPoint.getUserOpHash(userOp);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(VOTER_1_PKEY, userOpHash);
        userOp.signature = abi.encodePacked(r, s, v);

        vm.prank(address(entryPoint));
        (, uint256 validationData) = paymaster.validatePaymasterUserOp(
            userOp,
            userOpHash,
            1e18
        );

        assertEq(
            validationData,
            SIG_VALIDATION_SUCCESS,
            "Validation should succeed"
        );
    }

    function test_validatePaymasterUserOp_InvalidProof() public {
        //故 عمداً پروف اشتباه: [leaf1] برای VOTER_1
        bytes32;
        proof[0] = keccak256(abi.encodePacked(VOTER_1));

        PackedUserOperation memory userOp = _buildUserOp(
            VOTER_1,
            abi.encode(proof)
        );

        bytes32 userOpHash = entryPoint.getUserOpHash(userOp);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(VOTER_1_PKEY, userOpHash);
        userOp.signature = abi.encodePacked(r, s, v);

        vm.prank(address(entryPoint));
        (, uint256 validationData) = paymaster.validatePaymasterUserOp(
            userOp,
            userOpHash,
            1e18
        );

        assertEq(
            validationData,
            SIG_VALIDATION_FAILED,
            "Validation should fail for invalid proof"
        );
    }

    function test_validatePaymasterUserOp_UnlistedVoter() public {
        // پروف معتبر برای VOTER_1 یا VOTER_2 فرقی ندارد؛ اما آدرس امضاکننده در لیست نیست
        bytes32;
        proof[0] = keccak256(abi.encodePacked(VOTER_2));

        PackedUserOperation memory userOp = _buildUserOp(
            UNLISTED_VOTER,
            abi.encode(proof)
        );

        bytes32 userOpHash = entryPoint.getUserOpHash(userOp);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            UNLISTED_VOTER_PKEY,
            userOpHash
        );
        userOp.signature = abi.encodePacked(r, s, v);

        vm.prank(address(entryPoint));
        (, uint256 validationData) = paymaster.validatePaymasterUserOp(
            userOp,
            userOpHash,
            1e18
        );

        assertEq(
            validationData,
            SIG_VALIDATION_FAILED,
            "Validation should fail for unlisted voter"
        );
    }

    function _buildUserOp(
        address sender,
        bytes memory paymasterAndData
    ) internal pure returns (PackedUserOperation memory) {
        // چون مستقیم validatePaymasterUserOp را صدا می‌زنیم (نه handleOps)،
        // فقط پر بودن فیلدها کافی است.
        return
            PackedUserOperation({
                sender: sender,
                nonce: 0,
                initCode: hex"",
                callData: hex"",
                // مقادیر non-zero برای کاهش ریسک خطای جانبی
                accountGasLimits: bytes32(uint256(500000)), // arbitrary non-zero
                preVerificationGas: 21000,
                gasFees: bytes32(uint256(1)), // arbitrary non-zero
                paymasterAndData: paymasterAndData,
                signature: hex""
            });
    }
}
