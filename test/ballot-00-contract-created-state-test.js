const { expect } = require("chai");
const { ethers } = require("hardhat");

/*
    There are a few stages and states of this contract life-time:
    - Initial state <-- You are here
    - Creating campaign
    - Campaign created
    - Voting stage
    - Voted state
    - Summing up campaign
    - Summed up
    - Withdrawing owner fees
    - Withdrawn owner fees
 */

describe("Ballot initial state", function () {
    let owner;
    let ballot;

    beforeEach(async () => {
        [owner] = await ethers.getSigners();
        const ballotFactory = await ethers.getContractFactory("Ballot", owner);
        ballot = await ballotFactory.deploy();
        await ballot.deployed();
    })

    it("Should be created by owner", async () => {
        const contractOwner = await ballot.getOwner();

        expect(contractOwner).to.eq(owner.address);
    });

    it("Should have zero owner balance", async () => {
        const ownerBalance = await ballot.getOwnerBalance()

        expect(ownerBalance).to.eq(0);
    });

    it("Should have zero campaigns count", async () => {
        const campaignsCount = await ballot.getCampaignsCount()

        expect(campaignsCount).to.eq(0);
    });
});
