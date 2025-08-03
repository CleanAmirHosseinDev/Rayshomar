// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// imports from erc-4347 implementation: https://github.com/eth-infinitism/account-abstraction
import {IPaymaster} from "@eth-infinitism-account-abstraction/interfaces/IPaymaster.sol";
import {PackedUserOperation} from "@eth-infinitism-account-abstraction/interfaces/PackedUserOperation.sol";
import {IEntryPoint} from "@eth-infinitism-account-abstraction/interfaces/IEntryPoint.sol";
import {UserOperationLib} from "@eth-infinitism-account-abstraction/core/UserOperationLib.sol";
import {SIG_VALIDATION_FAILED, SIG_VALIDATION_SUCCESS} from "@eth-infinitism-account-abstraction/core/Helpers.sol";

//imports from openzeppelin: https://github.com/OpenZeppelin/openzeppelin-contracts
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title Paymaster(erc-4347) implementation for TVoting
 * @author Rayshomar : https://github.com/rayshomar
 * @notice this is the contract that pays for voters Txs(votes)
 * @dev error handling and event emission is not implemented yet
 */
contract Paymaster is IPaymaster, Ownable {
    error Paymaster__EntryPointAddressMismatch();
    error Paymaster__EntryPointInterfaceMismatch();

    IEntryPoint public immutable entryPoint;
    bytes32 private immutable i_merkleRoot;

    constructor(address _entryPoint, bytes32 _merkleRoot) Ownable(msg.sender) {
        entryPoint = IEntryPoint(_entryPoint);
        // _validateEntryPointInterface(entryPoint);
        i_merkleRoot = _merkleRoot;// @audit does this really work????
    }

    receive() external payable {}

    fallback() external payable {}

    /*//////////////////////////////////////////////////////////////
                               VALIDATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice This is the function called by the entry point
     * @param userOp user operation -> see PackedUserOperation for more details
     * @param userOpHash hash of the (user operation, entrypoint address, chainID) except the signiture of the userOP
     * @param maxCost max cost of the userOperation that this contract pays
     */
    function validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external returns (bytes memory context, uint256 validationData) {
        _requireFromEntryPoint();
        return _validate(userOp, userOpHash, maxCost);
    }

    /**
     * @notice The logic of the validation process:
     * checks if the signer of the userOp is in the Voters Merkle tree using the merkleProof passed from
     * paymasterAndData field in PackedUserOperation
     * @return context this is the data that could be later passed to postOp method in this contract(not used for now)
     * @return validationData 0 for success and 1 for failure
     */
    function _validate(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256
    ) internal view returns (bytes memory context, uint256 validationData) {
        address voterAddress = _getSignerAddress(userOp, userOpHash);

        bytes32[] memory merkleProof = _getMerkleProof(userOp.paymasterAndData);

        bool succes = _checkVoter(voterAddress, merkleProof);
        if (!succes) {
            return ("", SIG_VALIDATION_FAILED);
        }
        return ("", SIG_VALIDATION_SUCCESS);
    }

    /**
     * @notice return the 20bytes ethereum address the signed the userOp
     * @return address of the rayshomarAddress
     */
    function _getSignerAddress(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) public pure returns (address) {

        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            userOpHash
        );
        address signer = ECDSA.recover(ethSignedMessageHash, userOp.signature);
        return signer;
    }

    /**
     * @notice check if the signer of the userOp is in the voters Merkle tree
     * @param voterAddress rayshomarAddress of the voter which signed the userOp
     * @param merkleProof proof that the voterAddress is in the voters Merkle tree and indeed a valid voter
     */
    function _checkVoter(
        address voterAddress,
        bytes32[] memory merkleProof
    ) public view returns (bool) {
        bytes32 leaf = keccak256(
            bytes.concat(keccak256(abi.encode(voterAddress)))
        );
        return MerkleProof.verify(merkleProof, i_merkleRoot, leaf);
    }

    /**
     * @notice ignore the first 52 bytes of the paymasterAndData field in PackedUserOperation and return the rest of the
     * data(merkle proof) in 32bytes array
     * @param paymasterAndData the bytes that contains the paymasterAndData field in PackedUserOperation
     * @return merkleProof the proof that the voterAddress is in the voters Merkle tree
     */
    function _getMerkleProof(
        bytes memory paymasterAndData
    ) public pure returns (bytes32[] memory) {
        // Skip the first 52 bytes
        uint256 numElements = (paymasterAndData.length - 52) / 32;

        // Initialize the bytes32 array
        bytes32[] memory result = new bytes32[](numElements);

        // Loop through and extract each bytes32 element
        for (uint256 i = 0; i < numElements; i++) {
            bytes32 element;
            // Read the bytes32 value starting from the (20 + 32*i)th byte
            assembly {
                element := mload(
                    add(add(paymasterAndData, 0x20), add(52, mul(i, 0x20)))
                )
            }
            result[i] = element;
        }

        return result;
    }

    /*//////////////////////////////////////////////////////////////
                             POST OPERATION
    //////////////////////////////////////////////////////////////*/
    // !!!!!!!!!!!!!!!NOT used for now but might be used in the future!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external override {
        _requireFromEntryPoint();
        _postOp(mode, context, actualGasCost, actualUserOpFeePerGas);
    }

    function _postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) internal virtual {
        (mode, context, actualGasCost, actualUserOpFeePerGas); // unused params
        // salam
    }

    /*//////////////////////////////////////////////////////////////
                    DEPOSITS AND STAKES FROM ENTRY POINT
    //////////////////////////////////////////////////////////////*/

    function deposit() public payable {
        entryPoint.depositTo{value: msg.value}(address(this));
    }

    function withdrawTo(
        address payable withdrawAddress,
        uint256 amount
    ) public onlyOwner {
        entryPoint.withdrawTo(withdrawAddress, amount);
    }

    function addStake(uint32 unstakeDelaySec) external payable onlyOwner {
        entryPoint.addStake{value: msg.value}(unstakeDelaySec);
    }

    function getDeposit() public view returns (uint256) {
        return entryPoint.balanceOf(address(this));
    }

    function unlockStake() external onlyOwner {
        entryPoint.unlockStake();
    }

    function withdrawStake(address payable withdrawAddress) external onlyOwner {
        entryPoint.withdrawStake(withdrawAddress);
    }

    /*//////////////////////////////////////////////////////////////
                                 CHECKS
    //////////////////////////////////////////////////////////////*/

    function _validateEntryPointInterface(
        IEntryPoint _entryPoint
    ) internal virtual {
        if (
            IERC165(address(_entryPoint)).supportsInterface(
                type(IEntryPoint).interfaceId
            ) == false
        ) {
            revert Paymaster__EntryPointInterfaceMismatch();
        }
    }

    function _requireFromEntryPoint() internal virtual {
        if (msg.sender != address(entryPoint)) {
            revert Paymaster__EntryPointAddressMismatch();
        }
    }
}
