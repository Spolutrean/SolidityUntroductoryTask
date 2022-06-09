const { expect } = require("chai");
const { ethers } = require("hardhat");

/*
    There are a few stages and states of this contract life-time:
    - Initial state
    - Creating campaign
    - Campaign created
    - Voting stage
    - Voted state
    - Summing up campaign <-- You are here
    - Summed up
    - Withdrawing owner fees
    - Withdrawn owner fees
 */

describe("Summing up process of some campaign", function () {
    let anyUser;
    let ballot;
    let campaignId;
    let beforeCampaignEndTime;
    let afterCampaignEndTime;


    beforeEach(async () => {
        const signers = await ethers.getSigners();
        const owner = signers[0];
        const candidates = signers.slice(1, 4); // 3 candidates
        const voters = signers.slice(4, 7); // 3 voters
        anyUser = signers[7];

        const ballotFactory = await ethers.getContractFactory("Ballot", owner);
        ballot = await ballotFactory.deploy();
        await ballot.deployed();

        campaignId = await ballot.callStatic.newCampaign(candidates.map(candidate => candidate.address));
        await ballot.newCampaign(candidates.map(candidate => candidate.address));
        const voteCost = await ballot.getCampaignVoteCost();

        await ballot.connect(voters[0]).vote(campaignId, candidates[0].address, { value: voteCost });
        await ballot.connect(voters[1]).vote(campaignId, candidates[1].address, { value: voteCost });
        await ballot.connect(voters[2]).vote(campaignId, candidates[1].address, { value: voteCost });

        const campaignInfo = await ballot.getCampaignInfo(campaignId);
        const campaignEndTime = campaignInfo.endTime;
        beforeCampaignEndTime = campaignEndTime.sub(1).toNumber();
        afterCampaignEndTime = campaignEndTime.add(1).toNumber();
    })

    it("Should be able to sum up the campaign", async () => {
        await ethers.provider.send("evm_mine", [afterCampaignEndTime]);
        await ballot.connect(anyUser).sumUp(campaignId);
    });

    it("Should reject summing up with wrong campaign id", async () => {
        await ethers.provider.send("evm_mine", [afterCampaignEndTime]);
        const wrongCampaignId = 1;

        await expect(ballot.connect(anyUser).sumUp(wrongCampaignId))
            .to.be.revertedWith("There is no campaign with this campaignId");
    });

    it("Should reject summing up before campaign end time", async () => {
        await ethers.provider.send("evm_mine", [beforeCampaignEndTime]);

        await expect(ballot.connect(anyUser).sumUp(campaignId))
            .to.be.revertedWith("This campaign is not over yet");
    });

    it("Should reject summing up second time", async () => {
        await ethers.provider.send("evm_mine", [afterCampaignEndTime]);

        await ballot.connect(anyUser).sumUp(campaignId);
        await expect(ballot.connect(anyUser).sumUp(campaignId))
            .to.be.revertedWith("The results of this campaign have already been calculated and payments have been made");
    });
});
