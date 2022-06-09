const { expect } = require("chai");
const { ethers } = require("hardhat");

/*
    There are a few stages and states of this contract life-time:
    - Initial state
    - Creating campaign
    - Campaign created <-- You are here
    - Voting stage
    - Voted state
    - Summing up campaign
    - Summed up
    - Withdrawing owner fees
    - Withdrawn owner fees
 */

describe("Ballot state after creating one campaign", function () {
    let owner;
    let candidates;
    let ballot;
    let campaignId;
    let campaignCreationTimestamp;


    beforeEach(async () => {
        const signers = await ethers.getSigners();
        owner = signers[0];
        candidates = signers.slice(1, 4); // 3 candidates

        const ballotFactory = await ethers.getContractFactory("Ballot", owner);
        ballot = await ballotFactory.deploy();
        await ballot.deployed();

        campaignId = await ballot.callStatic.newCampaign(candidates.map(candidate => candidate.address));
        const invocationResult = await ballot.newCampaign(candidates.map(candidate => candidate.address));
        const blockNumber = invocationResult.blockNumber;
        const currentBlock = await ethers.provider.getBlock(blockNumber);
        const currentBlockTimestamp = currentBlock.timestamp;
        campaignCreationTimestamp = ethers.BigNumber.from(currentBlockTimestamp);
    });

    it("Should not change owner", async () => {
        const contractOwner = await ballot.getOwner();

        expect(contractOwner).to.eq(owner.address);
    });

    it("Should have zero owner balance", async () => {
        const ownerBalance = await ballot.getOwnerBalance();

        expect(ownerBalance).to.eq(0);
    });

    it("Should have one campaign", async () => {
        const campaignsCount = await ballot.getCampaignsCount();

        expect(campaignsCount).to.eq(1);
    });

    it("Should store campaign with correct end time", async () => {
        const campaignInfo = await ballot.getCampaignInfo(campaignId);
        const campaignEndTime = campaignInfo.endTime;
        const campaignDuration = await ballot.getCampaignDuration();

        expect(campaignEndTime).to.eq(campaignCreationTimestamp.add(campaignDuration));
    });

    it("Should store campaign that is not ended yet", async () => {
        const campaignInfo = await ballot.getCampaignInfo(campaignId);
        const campaignIsEnded = campaignInfo.isEnded;

        expect(campaignIsEnded).to.eq(false);
    });

    it("Should store campaign with no voters", async () => {
        const campaignInfo = await ballot.getCampaignInfo(campaignId);
        const campaignVoters = campaignInfo.voters;

        expect(campaignVoters.length).to.eq(0);
    });

    it("Should store campaign with candidates", async () => {
        const campaignInfo = await ballot.getCampaignInfo(campaignId)
        const campaignCandidates = campaignInfo.candidates;
        const candidatesAddresses = candidates.map(candidate => candidate.address);

        expect(campaignCandidates).to.eql(candidatesAddresses);
    });

    it("Should store campaign without any votes", async () => {
        const campaignInfo = await ballot.getCampaignInfo(campaignId)
        const campaignVotes = campaignInfo.candidatesVotes;

        expect(campaignVotes).to.eql(Array(3).fill(ethers.BigNumber.from(0)));
    });
});
