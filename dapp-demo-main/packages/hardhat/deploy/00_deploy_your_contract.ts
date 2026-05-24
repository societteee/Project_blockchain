import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a contract named "Ballot" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployBallot: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` or `yarn account:import` to import your
    existing PK which will fill DEPLOYER_PRIVATE_KEY_ENCRYPTED in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  
  // Конвертируем строки в bytes32 для конструктора контракта
  const proposalNames = [
    'Frontend',
    'Backend',
    'Fullstack',
    'DevOps',
  ].map(name => hre.ethers.encodeBytes32String(name));

  await deploy("Ballot", {
    from: deployer,
    // Contract constructor arguments
    args: [proposalNames],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const ballotContract = await hre.ethers.getContract<Contract>("Ballot", deployer);
  console.log("Контракт Ballot развернут по адресу:", ballotContract.address);
  console.log("Председатель: ", await ballotContract.chairperson());
  console.log("Количество предложений: ", (await ballotContract.getProposalCount()).toString());
  
  // Даем право голоса нескольким адресам для тестирования
  const accounts = await hre.ethers.getSigners();
  if (accounts.length > 1) {
    console.log("Предоставляем право голоса тестовым аккаунтам...");
    for (let i = 1; i < Math.min(accounts.length, 4); i++) {
      try {
        await ballotContract.giveRightToVote(accounts[i].address);
        console.log(`Право голоса предоставлено: ${accounts[i].address}`);
      } catch (error) {
        console.log(`Не удалось предоставить право голоса ${accounts[i].address}:`, error.message);
      }
    }
  }
};

export default deployBallot;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags Ballot
deployBallot.tags = ["Ballot"];
