const Migrations = artifacts.require("Migrations");
const SetA = artifacts.require("SetA");
const Addition = artifacts.require("Addition");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(SetA);
  deployer.deploy(Addition);
};
