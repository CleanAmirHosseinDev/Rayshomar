// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {BaseAccount} from "@eth-infinitism-account-abstraction/core/BaseAccount.sol";
import {PackedUserOperation} from "@eth-infinitism-account-abstraction/interfaces/PackedUserOperation.sol";
import {IEntryPoint} from "@eth-infinitism-account-abstraction/interfaces/IEntryPoint.sol";
import {SIG_VALIDATION_FAILED, SIG_VALIDATION_SUCCESS} from "@eth-infinitism-account-abstraction/core/Helpers.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {TVoting} from "./TVoting.sol";

contract VoterAccount is BaseAccount, Ownable {
    TVoting private i_tVoting;
    address private i_rayshomarAddress;
    IEntryPoint private immutable i_entryPoint;

    constructor(address _entryPoint) Ownable(msg.sender) {
        i_entryPoint = IEntryPoint(_entryPoint);
    }

    function entryPoint() public view override returns (IEntryPoint) {
        return i_entryPoint;
    }

    modifier onlyEntryPoint() {
        require(
            msg.sender == address(entryPoint()),
            "Account: not from entry point"
        );
        _;
    }

    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal view virtual override returns (uint256 validationData) {
        address signer = ECDSA.recover(userOpHash, userOp.signature);
        if (signer != i_rayshomarAddress) {
            return SIG_VALIDATION_FAILED;
        }
        return SIG_VALIDATION_SUCCESS;
    }

    function executeVote(
        uint256[] calldata _candidates
    ) external onlyEntryPoint {
        i_tVoting.vote(_candidates);
    }

    function setForNewElection(
        address _rayshomarAddress,
        address _tVoting
    ) external onlyOwner {
        i_rayshomarAddress = _rayshomarAddress;
        i_tVoting = TVoting(_tVoting);
    }
}
