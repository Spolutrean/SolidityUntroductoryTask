const { task } = require("hardhat/config")

/*
Usage:
npx hardhat --network rinkeby newCampaign
--contract-address "0x629b9Ac309CaaEC7C8351a4779b18114f528B233"
--candidates-addresses "0xf630961B8b7CCCE126fc5B8bB27d0B7C21555C6A 0xe4d4bc41896e0A40bbA45FDeAD2cdd47828aAdDf 0x05d95b9Ed3D56E99DC0F10Dc9A5C3195FaA4cF22"
*/

task("newCampaign", "Start a new campaign with candidates from 'candidatesAddresses', return its campaignId")
    .addParam("contractAddress", "Deployed contract address. Ex: '0x06f7a2168c962678708259f5809d10531ec34590'")
    .addParam("candidatesAddresses", "Candidates addresses. Ex: 'addr1 addr2 addr3'")
    .setAction(async (taskArgs, hre) => {
        const ethers = hre.ethers;
        const ballotFactory = await ethers.getContractFactory("Ballot");
        const ballot = await ballotFactory.attach(taskArgs.contractAddress);

        const candidatesAddresses = taskArgs.candidatesAddresses.split(" ");
        const newCampaignId = await ballot.callStatic.newCampaign(candidatesAddresses);
        const tx = await ballot.newCampaign(candidatesAddresses);
        await tx.wait();
        console.log(`New campaign has been started with ${ newCampaignId } id`);
    });
