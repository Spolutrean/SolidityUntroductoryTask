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
    - Summed up <-- You are here
    - Withdrawing owner fees
    - Withdrawn owner fees
 */

describe("Summed up state of some success campaign", function () {
    let owner, winner;
    let ownerPrize;
    let winnerPrize;

    let ballot;
    let campaignId;
    let sumUpTransaction;


    beforeEach(async () => {
        const signers = await ethers.getSigners();
        owner = signers[0];
        const candidates = signers.slice(1, 4) // 3 candidates
        winner = candidates[0];
        const voters = signers.slice(4, 7); // 3 voters
        const anyUser = signers[7];

        const ballotFactory = await ethers.getContractFactory("Ballot", owner);
        ballot = await ballotFactory.deploy();
        await ballot.deployed();

        const ownerReceivePerVote = await ballot.getOwnerReceivePerVote();
        const winnerReceivePerVote = await ballot.getWinnerReceivePerVote();
        const votesCount = voters.length;
        ownerPrize = ownerReceivePerVote.mul(votesCount);
        winnerPrize = winnerReceivePerVote.mul(votesCount);

        campaignId = await ballot.callStatic.newCampaign(candidates.map(candidate => candidate.address));
        await ballot.newCampaign(candidates.map(candidate => candidate.address));

        const voteCost = await ballot.getCampaignVoteCost();
        await ballot.connect(voters[0]).vote(campaignId, winner.address, { value: voteCost });
        await ballot.connect(voters[1]).vote(campaignId, winner.address, { value: voteCost });
        await ballot.connect(voters[2]).vote(campaignId, candidates[1].address, { value: voteCost });

        const campaignInfo = await ballot.getCampaignInfo(campaignId);
        const campaignEndTime = campaignInfo.endTime;
        const postEndTime = campaignEndTime.add(1).toNumber();
        await ethers.provider.send("evm_mine", [postEndTime]);

        sumUpTransaction = await ballot.connect(anyUser).sumUp(campaignId);
    });

    it("Should not change owner", async () => {
        const contractOwner = await ballot.getOwner();

        expect(contractOwner).to.eq(owner.address);
    });

    it("Should increase ownerBalance", async () => {
        await sumUpTransaction.wait();

        const ownerBalance = await ballot.getOwnerBalance();

        expect(ownerBalance).to.eq(ownerPrize);
    });

    it("Should have one campaign", async () => {
        const campaignsCount = await ballot.getCampaignsCount();

        expect(campaignsCount).to.eq(1);
    });

    it("Should increase winner balance", async () => {
        await expect(() => sumUpTransaction)
            .to.changeEtherBalance(winner, winnerPrize);
    });

    it("Should decrease contract balance", async () => {
        await expect(() => sumUpTransaction)
            .to.changeEtherBalance(ballot, winnerPrize.mul(-1));
    });

    it("Should mark summed up campaign as ended", async () => {
        await sumUpTransaction.wait();

        const campaignInfo = await ballot.getCampaignInfo(campaignId);
        const isEnded = campaignInfo.isEnded;

        expect(isEnded).to.eq(true);
    });
});

describe("Summed up state of some draw campaign", function () {
    let owner;

    let ballot;
    let campaignId;
    let campaignSummingUpTimestamp;


    beforeEach(async () => {
        const signers = await ethers.getSigners();
        owner = signers[0];
        const candidates = signers.slice(1, 4); // 3 candidates
        const voters = signers.slice(4, 8); // 4 voters
        const anyUser = signers[8];

        const ballotFactory = await ethers.getContractFactory("Ballot", owner);
        ballot = await ballotFactory.deploy();
        await ballot.deployed();

        campaignId = await ballot.callStatic.newCampaign(candidates.map(candidate => candidate.address));
        await ballot.newCampaign(candidates.map(candidate => candidate.address));

        const voteCost = await ballot.getCampaignVoteCost();
        await ballot.connect(voters[0]).vote(campaignId, candidates[0].address, { value: voteCost });
        await ballot.connect(voters[1]).vote(campaignId, candidates[1].address, { value: voteCost });
        await ballot.connect(voters[2]).vote(campaignId, candidates[0].address, { value: voteCost });
        await ballot.connect(voters[3]).vote(campaignId, candidates[1].address, { value: voteCost });

        const campaignInfo = await ballot.getCampaignInfo(campaignId);
        const campaignEndTime = campaignInfo.endTime;
        const postEndTime = campaignEndTime.add(1).toNumber();
        await ethers.provider.send("evm_mine", [postEndTime]);

        const sumUpTransaction = await ballot.connect(anyUser).sumUp(campaignId);
        const blockNumber = sumUpTransaction.blockNumber;
        const currentBlock = await ethers.provider.getBlock(blockNumber);
        const currentBlockTimestamp = currentBlock.timestamp;
        campaignSummingUpTimestamp = ethers.BigNumber.from(currentBlockTimestamp)
        await sumUpTransaction.wait();
    });

    it("Should not change owner", async () => {
        const contractOwner = await ballot.getOwner();

        expect(contractOwner).to.eq(owner.address);
    });

    it("Should not change ownerBalance", async () => {
        const ownerBalance = await ballot.getOwnerBalance();

        expect(ownerBalance).to.eq(0);
    });

    it("Should have one campaign", async () => {
        const campaignsCount = await ballot.getCampaignsCount();

        expect(campaignsCount).to.eq(1);
    });

    it("Should extend campaign duration", async () => {
        const drawExtendingDuration = await ballot.getDrawExtendingDuration();
        const extendedCampaignEndTime = campaignSummingUpTimestamp.add(drawExtendingDuration);
        const campaignInfo = await ballot.getCampaignInfo(campaignId);
        const campaignEndTime = campaignInfo.endTime;

        expect(campaignEndTime).to.eq(extendedCampaignEndTime);
    });

    it("Should not mark summed up campaign as ended", async () => {
        const campaignInfo = await ballot.getCampaignInfo(campaignId);
        const isEnded = campaignInfo.isEnded;

        expect(isEnded).to.eq(false);
    });
});
