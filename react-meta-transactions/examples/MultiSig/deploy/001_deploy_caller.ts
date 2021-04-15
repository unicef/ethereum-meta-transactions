import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploy: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment,
) {
    const { deployments, ethers } = hre;
    const [deployer] = await ethers.getSigners();

    console.log(
        "Deploying contracts with the account:",
        deployer.address
    );
    const { deploy } = deployments;

    await deploy("Caller", {
        from: deployer.address,
        args: [],
        log: true,
        deterministicDeployment: true,
    });
};

deploy.tags = ['caller']
export default deploy;
