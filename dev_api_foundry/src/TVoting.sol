// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/*//////////////////////////////////////////////////////////////
                           IMPORT STATEMENTS
    //////////////////////////////////////////////////////////////*/
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

error NotOwner__TVoting();
error NotVoter__TVoting();
error CandidateIdNotInBound__TVoting();
error MoreThanVotesLeft__TVoting();
error InvalidNumOfCandidates__TVoting();

/**
 * @title Transparent Voting Contract for https://rayshomar.ir
 * @author https://github.com/nadi-mah & https://github.com/parsasarfarazi
 * @notice This contract is used as an election voting ballot.
 */

// TODO : write a enum for the states of the election:
// not started
// open
// finished

contract TVoting {
    /*//////////////////////////////////////////////////////////////
                           Types and Variables
    //////////////////////////////////////////////////////////////*/
    struct Voter {
        bool isVoter;
        int256 votesLeft;
    }

    address private immutable i_owner;
    mapping(address => Voter) private addrToVoter;
    mapping(uint256 => uint256) private candidateNumofVotes;
    uint8 public immutable i_numOfCandidates;

    /*//////////////////////////////////////////////////////////////
                           COSTUME MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyOwner() {
        if (msg.sender != i_owner) revert NotOwner__TVoting();
        _;
    }

    modifier onlyVoter() {
        if (!addrToVoter[msg.sender].isVoter) revert NotVoter__TVoting();
        _;
    }

    event VoteEmmited(address indexed voter, uint256[] indexed vote);

    /*//////////////////////////////////////////////////////////////
                              Set Up
    //////////////////////////////////////////////////////////////*/

    constructor(uint8 _numOfCandidates) {
        i_owner = msg.sender;
        i_numOfCandidates = _numOfCandidates;
    }

    function startElection(
        address[] memory _voters,
        uint256[] memory _numOfVotes
    ) public onlyOwner {
        for (uint i = 0; i < _voters.length; i++) {
            addrToVoter[_voters[i]].isVoter = true;
            addrToVoter[_voters[i]].votesLeft = int256(_numOfVotes[i]);
        }
    }

    /*//////////////////////////////////////////////////////////////
                              Vote Functions
    //////////////////////////////////////////////////////////////*/
    function vote(uint256[] memory _candidates) public onlyVoter {
        if (_candidates.length > i_numOfCandidates)
            revert InvalidNumOfCandidates__TVoting();

        int256 checker = 0;
        for (uint256 i = 0; i < _candidates.length; i++) {
            candidateNumofVotes[i] += _candidates[i];
            checker += int256(_candidates[i]);
        }
        if (addrToVoter[msg.sender].votesLeft - checker < 0)
            revert MoreThanVotesLeft__TVoting();

        addrToVoter[msg.sender].votesLeft -= checker;

        emit VoteEmmited(msg.sender, _candidates);
    }

    function results() public view onlyOwner returns (uint256) {
        uint256 winner = 0;
        uint256 highestVotes = 0;
        for (uint256 i = 0; i < i_numOfCandidates; i++) {
            if (candidateNumofVotes[i] > highestVotes) {
                highestVotes = candidateNumofVotes[i];
                winner = i;
            }
        }
        return winner;
    }

    function getCandidateVoteNum(
        uint8 _candidate
    ) public view returns (uint256) {
        if (_candidate >= i_numOfCandidates)
            revert CandidateIdNotInBound__TVoting();
        return candidateNumofVotes[_candidate];
    }

    function getVoter(address _addr) public view returns (bool, int256) {
        return (addrToVoter[_addr].isVoter, addrToVoter[_addr].votesLeft);
    }
}
