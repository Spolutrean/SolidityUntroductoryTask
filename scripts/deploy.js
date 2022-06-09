const { ethers } = require("hardhat");

// Usage: npx hardhat run scripts/deploy.js --network rinkeby
async function main() {
    const ballotFactory = await ethers.getContractFactory("Ballot");
    const ballot = await ballotFactory.deploy();

    await ballot.deployed();

    console.log("Ballot deployed to: ", ballot.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
