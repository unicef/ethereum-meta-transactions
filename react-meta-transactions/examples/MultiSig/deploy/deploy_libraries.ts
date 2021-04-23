import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploy: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment,
) {
  const { deployments, ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const { deploy } = deployments;

  await deploy("CreateCall", {
    from: deployer.address,
    args: [],
    log: true,
    deterministicDeployment: true,
  });

  await deploy("MultiSend", {
    from: deployer.address,
    args: [],
    log: true,
    deterministicDeployment: true,
  });

  await deploy("MultiSendCallOnly", {
    from: deployer.address,
    args: [],
    log: true,
    deterministicDeployment: true,
  });
};

deploy.tags = ['libraries']
export default deploy;
