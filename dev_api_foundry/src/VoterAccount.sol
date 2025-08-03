// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IAccount} from "@eth-infinitism-account-abstraction/interfaces/IAccount.sol";
import {SIG_VALIDATION_FAILED, SIG_VALIDATION_SUCCESS} from "@eth-infinitism-account-abstraction/core/Helpers.sol";
import {IEntryPoint} from "@eth-infinitism-account-abstraction/interfaces/IEntryPoint.sol";
import {UserOperationLib} from "@eth-infinitism-account-abstraction/core/UserOperationLib.sol";
import {PackedUserOperation} from "@eth-infinitism-account-abstraction/interfaces/PackedUserOperation.sol";

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import {TVoting} from "./TVoting.sol";

contract VoterAccount is IAccount, Ownable {
    using UserOperationLib for PackedUserOperation;

    IEntryPoint private immutable i_entryPoint;
    TVoting private i_tVoting;
    address private i_rayshomarAddress;

    constructor(address _entryPoint) Ownable(msg.sender) {
        i_entryPoint = IEntryPoint(_entryPoint);
    }

    function recieve() external payable {}

    function _requireFromEntryPoint() internal view virtual {
        require(
            msg.sender == address(i_entryPoint),
            "account: not from EntryPoint"
        );
    }

    /**
     * @notice This is the function called by the entry point
     * @param userOp user operation -> see PackedUserOperation for more details
     * @param userOpHash hash of the (user operation, entrypoint address, chainID) except the signiture of the userOP
     *  param uint256 the cost of the userOperation(payed by paymaster)
     * @return  validationData which might be 0 for success and 1 for falure
     * @dev error handling and event emission is not implemented yet
     */
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256
    ) external virtual override returns (uint256 validationData) {
        _requireFromEntryPoint();
        validationData = _validateSignature(userOp, userOpHash);
    }

    /**
     * @notice this is the validation process:
     * checks if the signer of the userOp is the rayshomarAddress
     * @param userOp PackedUserOperation
     * @param userOpHash hash of the (user operation, entrypoint address, chainID) except the signiture of the userOP
     */
    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal view virtual returns (uint256 validationData) {
        // SECURITY: This is a highly centralized design. The i_rayshomarAddress has control
        // over all voter accounts. If this key is compromised, the entire election is compromised.
        // For a decentralized system, each VoterAccount should have its own owner,
        // and this function should check for the owner's signature.
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            userOpHash
        );
        address signer = ECDSA.recover(ethSignedMessageHash, userOp.signature);
        // owner should be change to voter rayshomar public key
        if (signer != i_rayshomarAddress) {
            return SIG_VALIDATION_FAILED;
        }
        return SIG_VALIDATION_SUCCESS;
    }

    /**
     * @notice execution function which is called by the entrypoint and passes the vote to TVoting contract
     * the uint256[] _candidates in encoded in calldata field of PackedUserOperation
     * */
    function execute(uint256[] calldata _candidates) external {
        // SECURITY: This function must only be callable by the EntryPoint.
        _requireFromEntryPoint();
        // call _vote
        i_tVoting.vote(_candidates);
    }

    /**
     * @notice sets the rayshomar address and the TVoting contract and is called by the owner(rayshomar)
     * @param _rayshomarAddress local rayshomar address of the signer of the userOp
     * @param _tVoting the address of the TVoting contract
     */
    function setForNewElection(
        address _rayshomarAddress,
        address _tVoting
    ) external onlyOwner {
        i_rayshomarAddress = _rayshomarAddress;
        i_tVoting = TVoting(_tVoting);
    }

    // TODO : reset function for new election
    
}
