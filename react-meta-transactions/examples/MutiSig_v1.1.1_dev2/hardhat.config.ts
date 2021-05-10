import "@nomiclabs/hardhat-waffle";
import "hardhat-deploy";
import "@nomiclabs/hardhat-truffle5";
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more


export default {
  paths: {
    artifacts: "build/artifacts",
    cache: "build/cache",
    deploy: "deploy",
    sources: "contracts",
  },
  solidity: {
    compilers: [
      { version: "0.5.14" },
    ]
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      blockGasLimit: 100000000,
      gas: 100000000,
      live: false,
      saveDeployments: true,
      tags: ["test", "local"]
    },
  }
};
