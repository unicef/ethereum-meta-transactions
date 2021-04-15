import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploy: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment,
) {
  const { deployments, ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const { deploy } = deployments;

  await deploy("GnosisSafeProxyFactory", {
    from: deployer.address,
    args: [],
    log: true,
    deterministicDeployment: true,
  });
};

deploy.tags = ['factory']
export default deploy;
