const { task } = require("hardhat/config")

/*
Usage:
npx hardhat --network rinkeby vote
--contract-address "0x629b9Ac309CaaEC7C8351a4779b18114f528B233"
--campaign-id "0"
--candidate-address "0xf630961B8b7CCCE126fc5B8bB27d0B7C21555C6A"
 */

task("vote", "Vote in campaign with given 'campaignId' for candidate with address 'candidateAddress'")
    .addParam("contractAddress", "Deployed contract address. Ex: '0x06f7a2168c962678708259f5809d10531ec34590'")
    .addParam("campaignId", "Id of campaign. Ex: '1'")
    .addParam("candidateAddress", "Candidate's address. Ex: '0xf630961B8b7CCCE126fc5B8bB27d0B7C21555C6A'")
    .setAction(async (taskArgs, hre) => {
        const ethers = hre.ethers;
        const ballotFactory = await ethers.getContractFactory("Ballot");
        const ballot = await ballotFactory.attach(taskArgs.contractAddress);

        const voteCost = await ballot.getCampaignVoteCost();
        const tx = await ballot.vote(taskArgs.campaignId, taskArgs.candidateAddress, { value: voteCost });
        await tx.wait();
        console.log(`Voice has been counted`);
    });
