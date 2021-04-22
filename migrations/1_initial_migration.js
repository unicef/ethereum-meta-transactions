const Verifier = artifacts.require("VerifierV2");

module.exports = function(deployer) {
  deployer.deploy(Verifier);
};
