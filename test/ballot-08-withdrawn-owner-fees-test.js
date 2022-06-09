const { expect } = require("chai");
const { ethers } = require("hardhat");

/*
    There are a few stages and states of this contract life-time:
    - Initial state
    - Creating campaign
    - Campaign created
    - Voting stage
    - Voted state
    - Summing up campaign
    - Summed up
    - Withdrawing owner fees
    - Withdrawn owner fees <-- You are here
 */

describe("State after withdrawing owner fees", function () {
    let owner, notOwner;
    let ballot;


    beforeEach(async () => {
        const signers = await ethers.getSigners();
        owner = signers[0];
        const candidates = signers.slice(1, 4); // 3 candidates
        const voters = signers.slice(4, 7); // 3 voters
        const anyUser = signers[7];
        notOwner = anyUser;

        const ballotFactory = await ethers.getContractFactory("Ballot", owner);
        ballot = await ballotFactory.deploy();
        await ballot.deployed();

        const campaignId = await ballot.callStatic.newCampaign(candidates.map(candidate => candidate.address));
        await ballot.newCampaign(candidates.map(candidate => candidate.address));
        const voteCost = await ballot.getCampaignVoteCost();

        await ballot.connect(voters[0]).vote(campaignId, candidates[0].address, { value: voteCost });
        await ballot.connect(voters[1]).vote(campaignId, candidates[0].address, { value: voteCost });
        await ballot.connect(voters[2]).vote(campaignId, candidates[1].address, { value: voteCost });

        const campaignInfo = await ballot.getCampaignInfo(campaignId);
        const campaignEndTime = campaignInfo.endTime;
        const postEndTime = campaignEndTime.add(1).toNumber();
        await ethers.provider.send("evm_mine", [postEndTime]);

        const sumUpTransaction = await ballot.connect(anyUser).sumUp(campaignId);
        await sumUpTransaction.wait();
    });

    it("Should not change owner", async () => {
        const contractOwner = await ballot.getOwner();

        expect(contractOwner).to.eq(owner.address);
    });

    it("Should increase owner wallet balance", async () => {
        const contractOwnerBalance = await ballot.getOwnerBalance();
        const withdrawFeeTransaction = await ballot.withdrawFee();

        await expect(() => withdrawFeeTransaction)
            .to.changeEtherBalance(owner, contractOwnerBalance);
    });

    it("Should have one campaign", async () => {
        const campaignsCount = await ballot.getCampaignsCount();

        expect(campaignsCount).to.eq(1);
    });

    it("Should reset to zero owner contract balance", async () => {
        const withdrawFeeTransaction = await ballot.withdrawFee();
        await withdrawFeeTransaction.wait();

        const contractOwnerBalance = await ballot.getOwnerBalance();

        await expect(contractOwnerBalance).to.eq(0);
    });
});
