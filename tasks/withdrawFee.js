const { task } = require("hardhat/config")

/*
Usage:
npx hardhat --network rinkeby withdrawFee
--contract-address "0x629b9Ac309CaaEC7C8351a4779b18114f528B233"
 */

task("withdrawFee", "Withdraw owner fees")
    .addParam("contractAddress", "Deployed contract address. Ex: '0x06f7a2168c962678708259f5809d10531ec34590'")
    .setAction(async (taskArgs, hre) => {
        const ethers = hre.ethers;
        const ballotFactory = await ethers.getContractFactory("Ballot");
        const ballot = await ballotFactory.attach(taskArgs.contractAddress);

        const tx = await ballot.withdrawFee();
        await tx.wait();
        console.log(`Fees was withdrawn`);
    });
