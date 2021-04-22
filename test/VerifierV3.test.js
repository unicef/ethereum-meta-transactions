const BigNumber = web3.BigNumber;
const SimpleStorage = artifacts.require("SetA");
const VerifierV3 = artifacts.require("VerifierV3");
const ethers = require("ethers");
const Web3 = require("web3");
const util = require("ethereumjs-util");
require("chai")
  .use(require("chai-as-promised"))
  .use(require("chai-bignumber")(BigNumber))
  .should();

contract("Verifier", async (accounts) => {
  let Verifier = null;
  let Storage = null;
  const [creator, user, account1, account2, account3] = accounts;
  const emptyString = "";
  const zeroHash =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const verifierAddress = "0x9FBDa871d559710256a2502A2517b794B482Db40";
  const web3 = new Web3();
  const zero = 0;
  const nonce = 0;
  const hashOfZeroNonce =
    "0xad3228b676f7d3cd4284a5443f17f1962b36e491b30a40b2405849e597ba5fb5";
  let randomNumber;
  let randomNonce;
  const privateKey =
    "0x3141592653589793238462643383279502884197169399375105820974944592";

  beforeEach(async () => {
    Storage = await SimpleStorage.new();
    Verifier = await VerifierV3.new(Storage.address);
    randomNumber = Math.round(Math.random() * 1000);
    randomNonce = Math.round(Math.random() * 1000 + 1000);
  });

  it("...artifact exists", async () => {
    expect(Verifier).to.exist;
  });
  it("...is deployed", async () => {
    expect(Verifier.address).to.be.equal(verifierAddress);
  });
  it("...has a storage contract set by the constructor", async () => {
    expect(await Verifier.StorageContract()).to.be.equal(Storage.address);
  });
  it("...calculates a keccak256 (SHA3) hash on the application side", async () => {
    const appHash = await ethers.utils.solidityKeccak256(
      ["uint256", "uint256"],
      [zero, nonce]
    );

    appHash.should.be.equal(hashOfZeroNonce);
  });
  it("...calculates a keccak256 (SHA3) hash on the contract side", async () => {
    const contractHash = await Verifier.calcHash.call(zero, nonce);

    contractHash.should.be.equal(hashOfZeroNonce);
  });
  it("...calculates a matching keccak256 (SHA3) hash", async () => {
    const appHash = await ethers.utils.solidityKeccak256(
      ["uint256", "uint256"],
      [randomNumber, randomNonce]
    );
    const contractHash = await Verifier.calcHash.call(
      randomNumber,

      randomNonce
    );

    appHash.should.be.equal(contractHash);
  });
  it("...recovers the data signer address", async () => {
    const wallet = new ethers.Wallet(privateKey);
    const walletAddress = await wallet.getAddress();

    const appHash = await ethers.utils.solidityKeccak256(
      ["uint256", "uint256"],
      [randomNumber, randomNonce]
    );
    const flatSig = await wallet.signMessage(ethers.utils.arrayify(appHash));

    const { v, r, s } = ethers.utils.splitSignature(flatSig);

    const recoveredAddress = await Verifier.recoverSignerAddress(
      appHash,
      v,
      r,
      s
    );

    walletAddress.should.be.equal(recoveredAddress);
  });
  it("...recovers a valid signer address", async () => {
    const wallet = new ethers.Wallet(privateKey);
    const walletAddress = await wallet.getAddress();

    const appHash = await ethers.utils.solidityKeccak256(
      ["uint256", "uint256"],
      [randomNumber, randomNonce]
    );
    const flatSig = await wallet.signMessage(ethers.utils.arrayify(appHash));

    const { v, r, s } = ethers.utils.splitSignature(flatSig);

    const recoveredAddress = await Verifier.verifySignatureAddress(
      randomNumber,
      randomNonce,
      appHash,
      v,
      r,
      s
    );

    walletAddress.should.be.equal(recoveredAddress);
  });
});
