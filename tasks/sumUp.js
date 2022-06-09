const { task } = require("hardhat/config")

/*
Usage:
npx hardhat --network rinkeby sumUp
--contract-address "0x629b9Ac309CaaEC7C8351a4779b18114f528B233"
--campaign-id "0"
 */

task("sumUp", "Sum up campaign with given 'campaignId'. Determine the winner and send him prize. Extend campaign on draw.")
    .addParam("contractAddress", "Deployed contract address. Ex: '0x06f7a2168c962678708259f5809d10531ec34590'")
    .addParam("campaignId", "Id of campaign. Ex: '1'")
    .setAction(async (taskArgs, hre) => {
        const ethers = hre.ethers;
        const ballotFactory = await ethers.getContractFactory("Ballot");
        const ballot = await ballotFactory.attach(taskArgs.contractAddress);

        const tx = await ballot.sumUp(taskArgs.campaignId);
        await tx.wait();
        console.log(`Campaign was summed up`);
    });
