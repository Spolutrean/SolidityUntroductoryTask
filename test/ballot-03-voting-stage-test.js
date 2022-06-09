const { expect } = require("chai");
const { ethers } = require("hardhat");

/*
    There are a few stages and states of this contract life-time:
    - Initial state
    - Creating campaign
    - Campaign created
    - Voting stage <-- You are here
    - Voted state
    - Summing up campaign
    - Summed up
    - Withdrawing owner fees
    - Withdrawn owner fees
 */

describe("Voting process in some campaign", function () {
    let candidates;
    let voters;
    let notCandidate;
    let ballot;
    let campaignId;
    let voteCost;


    beforeEach(async () => {
        const signers = await ethers.getSigners();
        const owner = signers[0];
        candidates = signers.slice(1, 4); // 3 candidates
        voters = signers.slice(4, 7); // 3 voters
        notCandidate = signers[7];

        const ballotFactory = await ethers.getContractFactory("Ballot", owner);
        ballot = await ballotFactory.deploy();
        await ballot.deployed();

        campaignId = await ballot.callStatic.newCampaign(candidates.map(candidate => candidate.address));
        await ballot.newCampaign(candidates.map(candidate => candidate.address));
        voteCost = await ballot.getCampaignVoteCost();
    })

    it("Should be able to vote", async () => {
        await ballot.connect(voters[0]).vote(campaignId, candidates[0].address, { value: voteCost });
        await ballot.connect(voters[1]).vote(campaignId, candidates[0].address, { value: voteCost });
        await ballot.connect(voters[2]).vote(campaignId, candidates[1].address, { value: voteCost });
    });

    it("Should reject voting in wrong campaign id", async () => {
        const voter = voters[0];
        const wrongCampaignId = 1337;
        const candidateAddress = candidates[0].address;

        await expect(ballot.connect(voter).vote(wrongCampaignId, candidateAddress))
            .to.be.revertedWith("There is no campaign with this campaignId");
    });

    it("Should reject voting with less than voteCost amount of ether", async () => {
        const voter = voters[0];
        const candidateAddress = candidates[0].address;

        await expect(ballot.connect(voter).vote(campaignId, candidateAddress, { value : voteCost.sub(1) }))
            .to.be.revertedWith("You should pay exactly voteCost");
    });

    it("Should reject voting with more than voteCost amount of ether", async () => {
        const voter = voters[0];
        const candidatesAddress = candidates[0].address;

        await expect(ballot.connect(voter).vote(campaignId, candidatesAddress, { value : voteCost.add(1) }))
            .to.be.revertedWith("You should pay exactly voteCost");
    });

    it("Should reject voting after campaign end time", async () => {
        const campaignInfo = await ballot.getCampaignInfo(campaignId);
        const campaignEndTime = campaignInfo.endTime;
        const postEndTime = campaignEndTime.add(1);
        await ethers.provider.send("evm_mine", [postEndTime.toNumber()]);

        const voter = voters[0];
        const candidatesAddress = candidates[0].address;

        await expect(ballot.connect(voter).vote(campaignId, candidatesAddress, { value : voteCost }))
            .to.be.revertedWith("This campaign is already ended");
    });

    it("Should reject second voting attempt", async () => {
        const voter = voters[0];
        const candidatesAddress = candidates[0].address;

        await ballot.connect(voter).vote(campaignId, candidatesAddress, { value: voteCost });
        await expect(ballot.connect(voter).vote(campaignId, candidatesAddress, { value: voteCost }))
            .to.be.revertedWith("You have already voted in this campaign");
    });

    it("Should reject voting not for candidates", async () => {
        const voter = voters[0];
        const notCandidateAddress = notCandidate.address;

        await expect(ballot.connect(voter).vote(campaignId, notCandidateAddress, { value: voteCost }))
            .to.be.revertedWith("There is no such candidate in this campaign");
    });

    it("Should reject voting from candidates", async () => {
        const voter = candidates[0];
        const candidateAddress = candidates[0].address

        await expect(ballot.connect(voter).vote(campaignId, candidateAddress, { value: voteCost }))
            .to.be.revertedWith("You can't vote because you're one of the candidate");
    });
});