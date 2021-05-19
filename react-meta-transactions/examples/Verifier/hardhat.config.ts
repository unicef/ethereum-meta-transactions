import "@nomiclabs/hardhat-waffle";
import "hardhat-deploy";
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more


export default {
  paths: {
    artifacts: "build/artifacts",
    cache: "build/cache",
    deploy: "deploy",
    sources: "contracts",
    tests: "./"
  },
  solidity: {
    compilers: [
      { version: "0.7.3" },
      { version: "0.6.12" },
      { version: "0.5.17" },
      { version: "0.8.0" },
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
