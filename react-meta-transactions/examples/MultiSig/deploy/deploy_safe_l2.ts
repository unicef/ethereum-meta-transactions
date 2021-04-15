import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploy: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment,
) {
  const { deployments, ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const { deploy } = deployments;

  await deploy("GnosisSafeL2", {
    from: deployer.address,
    args: [],
    log: true,
    deterministicDeployment: true,
  });
};

deploy.tags = ['l2']
export default deploy;
