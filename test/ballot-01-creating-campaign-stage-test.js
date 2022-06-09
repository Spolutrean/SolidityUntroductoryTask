const { expect } = require("chai");
const { ethers } = require("hardhat");

/*
    There are a few stages and states of this contract life-time:
    - Initial state
    - Creating campaign <-- You are here
    - Campaign created
    - Voting stage
    - Voted state
    - Summing up campaign
    - Summed up
    - Withdrawing owner fees
    - Withdrawn owner fees
 */

describe("Creating new campaign process", function () {
    let notOwner;
    let candidates;
    let ballot;

    beforeEach(async () => {
        const signers = await ethers.getSigners();
        const owner = signers[0];
        notOwner = signers[1];
        candidates = signers.slice(2, 4); // 2 candidates

        const ballotFactory = await ethers.getContractFactory("Ballot", owner);
        ballot = await ballotFactory.deploy();
        await ballot.deployed();
    });

    it("Should be able to create a campaign", async () => {
        const candidatesAddresses = candidates.map(candidate => candidate.address);

        await ballot.newCampaign(candidatesAddresses);
    });

    it("Should reject creating campaign not by owner", async () => {
        const candidatesAddresses = candidates.map(candidate => candidate.address);

        await expect(ballot.connect(notOwner).newCampaign(candidatesAddresses))
            .to.be.revertedWith("Only owner can call this function");
    });

    it("Should not allow to create campaign without candidates", async () => {
        await expect(ballot.newCampaign([]))
            .to.be.revertedWith("At least two candidates must be proposed");
    });

    it("Should not allow to create campaign with one candidate", async () => {
        await expect(ballot.newCampaign([candidates[0].address]))
            .to.be.revertedWith("At least two candidates must be proposed");
    });

    it("Should not allow to create campaign with repeated candidates", async () => {
        await expect(ballot.newCampaign([candidates[0].address, candidates[1].address, candidates[0].address]))
            .to.be.revertedWith("Candidates must be unique");
    });
});
