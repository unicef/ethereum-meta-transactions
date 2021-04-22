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
  let storageAddress;
  let verifierAddress;
  const [creator, user, account1, account2, account3] = accounts;
  const emptyString = "";
  const zeroHash =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const web3 = new Web3();
  const zero = 0;
  const nonce = 0;
  const defaultStorageValue = 1031;
  const hashOfZeroNonce =
    "0xad3228b676f7d3cd4284a5443f17f1962b36e491b30a40b2405849e597ba5fb5";
  let randomNumber;
  let randomNonce;
  const privateKey =
    "0x3141592653589793238462643383279502884197169399375105820974944592";
  const wallet = new ethers.Wallet(privateKey);
  const walletAddress = await wallet.getAddress();
  const testWalletAddress = walletAddress;

  beforeEach(async () => {
    Storage = await SimpleStorage.new(defaultStorageValue);
    storageAddress = Storage.address;
    Verifier = await VerifierV3.new(storageAddress);
    verifierAddress = Verifier.address;
    await Storage.setRelayer(verifierAddress);
    randomNumber = Math.round(Math.random() * 1000);
    randomNonce = Math.round(Math.random() * 1000 + 1000);
  });

  describe("Initialization", async () => {
    it("...artifact exists", async () => {
      expect(Verifier).to.exist;
    });
    it("...is deployed", async () => {
      expect(Verifier.address).to.be.equal(verifierAddress);
    });
    it("...has a storage contract set by the constructor", async () => {
      expect(await Verifier.StorageContract()).to.be.equal(Storage.address);
    });
    it("...storage contract has relayer set to verifier", async () => {
      expect(await Storage.Relayer()).to.be.equal(Verifier.address);
    });
  });

  describe("Functions", () => {
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
  });

  describe("Cryptography", () => {
    it("...recovers the data signer address", async () => {
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

  describe("Transactions", () => {
    it("...calls a public function on a contract", async () => {
      let storedValue = await Verifier.getStorageValue.call();
      storedValue = storedValue.toNumber();

      storedValue.should.be.equal(defaultStorageValue);
    });
    it("...uses a MetaTx to change storage", async () => {
      const appHash = await ethers.utils.solidityKeccak256(
        ["uint256", "uint256"],
        [randomNumber, randomNonce]
      );
      const flatSig = await wallet.signMessage(ethers.utils.arrayify(appHash));

      const { v, r, s } = ethers.utils.splitSignature(flatSig);

      let storageValue = await Verifier.updateStorage.call(
        randomNumber,
        randomNonce,
        appHash,
        v,
        r,
        s
      );
      storageValue = storageValue.toNumber();
      expect(storageValue).to.be.equal(randomNumber);

      await Verifier.updateStorage(randomNumber, randomNonce, appHash, v, r, s);

      const storedValue = (await Storage.getA.call()).toNumber();

      expect(storedValue).to.be.equal(randomNumber);
    });
  });
});
