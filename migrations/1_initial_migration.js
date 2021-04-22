const Storage = artifacts.require("SetA");
const Verifier = artifacts.require("VerifierV3");

module.exports = async function (deployer) {
  await deployer.deploy(Storage);
  await deployer.deploy(Verifier, Storage.address);
};
