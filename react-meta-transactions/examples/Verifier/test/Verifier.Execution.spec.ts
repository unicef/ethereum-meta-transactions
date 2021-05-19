import { expect } from "chai";
import hre, { deployments, waffle } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import {deployContract} from "../../MultiSig_v1.2/test/utils/setup";
import {execute, verifierContract} from "../../../src/utils";
import {arrayify, solidityKeccak256} from "ethers/lib/utils";
import assert from "assert";
import {Contract} from "ethers";

describe("GnosisSafe", async () => {

    const [user1, relayer] = waffle.provider.getWallets();

    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();
        const setterSource = `
            contract StorageSetter {
                function setStorage(bytes3 data) public {
                    bytes32 slot = 0x4242424242424242424242424242424242424242424242424242424242424242;
                    // solhint-disable-next-line no-inline-assembly
                    assembly {
                        sstore(slot, data)
                    }
                }
            }`
        const storageSetter = await deployContract(user1, setterSource);
        const verifierContract = await hre.ethers.getContractFactory("Verifier", relayer);
        const verifier = await verifierContract.deploy();
        await verifier.updateCallWhitelist(storageSetter.address, true)
        return {
            storageSetter,
            verifier,
        }
    })


    describe("possible attacks", async () => {


        it('should revert replay attack', async () => {
            const { storageSetter, verifier } = await setupTests()
            await verifier.updateCallWhitelist(storageSetter.address, true)
            // const isCallable = await verifier.callWhitelist(storageSetter.address)
            // expect(isCallable).true
            const data = storageSetter.interface.encodeFunctionData("setStorage",["0xbaddad"]);
            const account = await user1.getAddress();
            const nonce = await verifier.nonce(account);
            const parts = [
                verifier.address,
                account,
                storageSetter.address,
                0,
                data,
                nonce
            ];
            let payloadHash = solidityKeccak256([ "address", "address", "address", "uint", "bytes", "uint"], parts);
            const signature = await user1.signMessage(arrayify(payloadHash));
            const txRequest1 = await verifier.forward(signature, account, storageSetter.address, 0, data, {gasLimit: 1200000, gasPrice: Math.round(4 * 1000000000)});
            expect(txRequest1).to.emit(verifier, "Forwarded")
            await expect(verifier.forward(signature, account, storageSetter.address, 0, data, {gasLimit: 1200000, gasPrice: Math.round(4 * 1000000000)})).to.be.revertedWith("Verifier::forward message is not signed correctly")
        })

        it('should revert if not owner', async () => {
            const { storageSetter, verifier } = await setupTests()
            const isOwner = await verifier.ownerWhitelist(user1.address)
            expect(isOwner).false
            const verifierWithWrongOwner = new Contract(verifier.address,verifier.interface, user1);
            await expect(execute(verifierWithWrongOwner, user1, user1, storageSetter, "setStorage", ["0xbaddad"])).to.be.revertedWith("Verifier::forward Owner Account Not Whitelisted")
        })

        it('should revert with non authorized contract call', async () => {
            const { storageSetter, verifier } = await setupTests()
            const setterSource = `
            contract StorageSetter {
                function setStorage(bytes3 data) public {
                    bytes32 slot = 0x4242424242424242424242424242424242424242424242424242424242424242;
                    // solhint-disable-next-line no-inline-assembly
                    assembly {
                        sstore(slot, data)
                    }
                }
            }`
            const storageSetter2 = await deployContract(user1, setterSource);
            const isCallable = await verifier.callWhitelist(storageSetter2.address)
            expect(isCallable).false
            await expect(execute(verifier, user1, relayer, storageSetter2, "setStorage", ["0xbaddad"])).to.be.revertedWith("Verifier::forward Smart Contract Address Not Whitelisted")
        })

    })
})
