// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.14;

contract Ballot {
    uint public constant voteCost = 1 ether / 100;
    uint public constant ownerReceivePerVote = voteCost * 1 / 10;
    uint public constant winnerReceivePerVote = voteCost * 9 / 10;
    uint public constant campaignDuration = 3 days;
    uint public constant drawExtendingDuration = 1 days;

    address public owner;
    uint ownerBalance;

    uint campaignsCount;
    mapping(uint => Campaign) campaigns;

    constructor() {
        owner = msg.sender;
    }

    struct Campaign {
        uint endTime;
        bool isEnded;

        address[] voters;
        mapping(address => bool) isVoter;

        address[] candidates;
        mapping(address => bool) isCandidate;

        mapping(address => uint) candidatesVotes;
    }

    function newCampaign(address[] memory candidates) public CalledByOwner() returns (uint campaignId) {
        require(candidates.length >= 2, "At least two candidates must be proposed");
        campaignId = campaignsCount++;

        Campaign storage campaign = campaigns[campaignId];
        campaign.endTime = block.timestamp + campaignDuration;
        campaign.candidates = candidates;

        for (uint i = 0; i < candidates.length; ++i) {
            address candidate = candidates[i];
            require(campaign.isCandidate[candidate] == false, "Candidates must be unique");
            campaign.isCandidate[candidate] = true;
        }
    }

    function vote(uint campaignId, address candidate) public payable HasCorrectCampaignId(campaignId) {
        require(msg.value == voteCost, "You should pay exactly voteCost");
        Campaign storage campaign = campaigns[campaignId];
        require(block.timestamp <= campaign.endTime, "This campaign is already ended");
        require(!campaign.isVoter[msg.sender], "You have already voted in this campaign");
        require(campaign.isCandidate[candidate], "There is no such candidate in this campaign");
        require(!campaign.isCandidate[msg.sender], "You can't vote because you're one of the candidate");

        address voter = msg.sender;
        campaign.voters.push(voter);
        campaign.isVoter[voter] = true;
        ++campaign.candidatesVotes[candidate];
    }

    function sumUp(uint campaignId) public HasCorrectCampaignId(campaignId) {
        Campaign storage campaign = campaigns[campaignId];
        require(block.timestamp > campaign.endTime, "This campaign is not over yet");
        require(!campaign.isEnded, "The results of this campaign have already been calculated and payments have been made");

        bool isFirst = true;
        address winner;
        uint winnerVotesCount;
        bool hasMultipleWinners;
        for (uint i = 0; i < campaign.candidates.length; ++i) {
            address candidate = campaign.candidates[i];
            uint candidateVotesCount = campaign.candidatesVotes[candidate];

            if (isFirst) {
                winner = candidate;
                winnerVotesCount = candidateVotesCount;
                isFirst = false;
                continue;
            }

            if (candidateVotesCount > winnerVotesCount) {
                winner = candidate;
                winnerVotesCount = candidateVotesCount;
                hasMultipleWinners = false;
            } else if (candidateVotesCount == winnerVotesCount) {
                hasMultipleWinners = true;
            }
        }

        if (hasMultipleWinners) {
            // There are no instructions what to do in such case.
            // I decided it would be fair to extend the voting for one more day.
            campaign.endTime = block.timestamp + drawExtendingDuration;
        } else {
            campaign.isEnded = true;
            uint votersCount = campaign.voters.length;
            uint ownerReceive = votersCount * ownerReceivePerVote;
            uint winnerReceive = votersCount * winnerReceivePerVote;

            ownerBalance += ownerReceive;
            payable(winner).transfer(winnerReceive);
        }
    }

    function withdrawFee() public CalledByOwner() {
        require(ownerBalance > 0, "There is no fee yet");
        uint ownerGot = ownerBalance;
        ownerBalance = 0;
        payable(owner).transfer(ownerGot);
    }


    function getCampaignVoteCost() public pure returns (uint) {
        return voteCost;
    }

    function getOwnerReceivePerVote() public pure returns (uint) {
        return ownerReceivePerVote;
    }

    function getWinnerReceivePerVote() public pure returns (uint) {
        return winnerReceivePerVote;
    }

    function getCampaignDuration() public pure returns (uint) {
        return campaignDuration;
    }

    function getDrawExtendingDuration() public pure returns (uint) {
        return drawExtendingDuration;
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function getOwnerBalance() public view returns (uint) {
        return ownerBalance;
    }

    function getCampaignsCount() public view returns (uint) {
        return campaignsCount;
    }

    function getCampaignInfo(uint campaignId) public view HasCorrectCampaignId(campaignId) returns
    (
        uint endTime,
        bool isEnded,
        address[] memory voters,
        address[] memory candidates,
        uint[] memory candidatesVotes
    ) {
        Campaign storage campaign = campaigns[campaignId];
        endTime = campaign.endTime;
        isEnded = campaign.isEnded;
        voters = campaign.voters;
        candidates = campaign.candidates;
        candidatesVotes = new uint[](candidates.length);
        for (uint i = 0; i < candidates.length; ++i) {
            address candidate = candidates[i];
            candidatesVotes[i] = campaign.candidatesVotes[candidate];
        }
    }


    modifier HasCorrectCampaignId(uint campaignId) {
        require(campaignId < campaignsCount, "There is no campaign with this campaignId");
        _;
    }

    modifier CalledByOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
}