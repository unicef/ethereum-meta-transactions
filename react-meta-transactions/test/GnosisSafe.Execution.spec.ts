import { expect } from "chai";
import hre, { deployments, waffle } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import { deployContract, getSafeWithOwners } from "./utils/setup";
import {
    safeApproveHash,
    buildSignatureBytes,
    executeContractCallWithSigners,
    buildSafeTransaction,
    executeTx,
    calculateSafeTransactionHash,
    buildContractCall,
    executeMetaContractCallWithSigners, executeNestedTxCall
} from "../src/utils/multiSig";
import { parseEther } from "@ethersproject/units";
import { chainId } from "./utils/encoding";
import {verifierContract} from "../src/utils";
import {safeContractUnderTest} from "./utils/config";

describe("GnosisSafe", async () => {

    const [user1, user2, relayer] = waffle.provider.getWallets();

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
        const callerContract = await hre.ethers.getContractFactory("Caller", user1);
        const caller = await callerContract.deploy();
        return {
            safe: await getSafeWithOwners([user1.address, user2.address]),
            storageSetter,
            verifier,
            caller
        }
    })

    describe("execTransaction", async () => {


        it('should emit event for successful call execution', async () => {
            const { safe, storageSetter } = await setupTests();
            const txHash = calculateSafeTransactionHash(safe, buildContractCall(storageSetter, "setStorage", ["0xbaddad"], await safe.nonce()), await chainId())
            const balanceBeforeTx = await hre.ethers.provider.getBalance(user1.address);
            await expect(
                executeContractCallWithSigners(safe, storageSetter, "setStorage", ["0xbaddad"], [user1, user2])
            ).to.emit(safe, "ExecutionSuccess").withArgs(txHash, 0)
            await expect(
                await hre.ethers.provider.getBalance(user1.address)
            ).to.not.be.eq(balanceBeforeTx);
            await expect(
                await hre.ethers.provider.getStorageAt(safe.address, "0x4242424242424242424242424242424242424242424242424242424242424242")
            ).to.be.eq("0x" + "".padEnd(64, "0"));

            await expect(
                await hre.ethers.provider.getStorageAt(storageSetter.address, "0x4242424242424242424242424242424242424242424242424242424242424242")
            ).to.be.eq("0x" + "baddad".padEnd(64, "0"))
        })



        // it('should emit event for successful delegatecall execution', async () => {
        //     const { safe, storageSetter } = await setupTests()
        //     await expect(
        //         executeContractCallWithSigners(safe, storageSetter, "setStorage", ["0xbaddad"], [user1], true)
        //     ).to.emit(safe, "ExecutionSuccess")
        //
        //     await expect(
        //         await hre.ethers.provider.getStorageAt(safe.address, "0x4242424242424242424242424242424242424242424242424242424242424242")
        //     ).to.be.eq("0x" + "baddad".padEnd(64, "0"))
        //
        //     await expect(
        //         await hre.ethers.provider.getStorageAt(storageSetter.address, "0x4242424242424242424242424242424242424242424242424242424242424242")
        //     ).to.be.eq("0x" + "".padEnd(64, "0"))
        // })


    })

    describe("execMetaTransaction", async () => {


        it('should emit event for successful Meta call execution', async () => {
            const { safe, storageSetter, verifier } = await setupTests()
            const balanceBeforeTx = await hre.ethers.provider.getBalance(user1.address);
            await expect(
                executeMetaContractCallWithSigners(verifier, user1, relayer, safe, storageSetter, "setStorage", ["0xbaddad"], [user1, user2])
            ).to.emit(safe, "ExecutionSuccess")
            await expect(
                await hre.ethers.provider.getBalance(user1.address)
            ).to.be.eq(balanceBeforeTx);

            await expect(
                await hre.ethers.provider.getStorageAt(safe.address, "0x4242424242424242424242424242424242424242424242424242424242424242")
            ).to.be.eq("0x" + "".padEnd(64, "0"))

            await expect(
                await hre.ethers.provider.getStorageAt(storageSetter.address, "0x4242424242424242424242424242424242424242424242424242424242424242")
            ).to.be.eq("0x" + "baddad".padEnd(64, "0"))
        })

        it('should emit event for successful nested contract call', async () => {
            const { caller, storageSetter, verifier } = await setupTests()
            const balanceBeforeTx = await hre.ethers.provider.getBalance(user1.address);
            await expect(
                executeNestedTxCall(verifier, user1, relayer, caller, storageSetter, "setStorage", ["0xbaddad"])
            ).to.emit(caller, "Forwarded")
            await expect(
                await hre.ethers.provider.getBalance(user1.address)
            ).to.be.eq(balanceBeforeTx);

            await expect(
                await hre.ethers.provider.getStorageAt(storageSetter.address, "0x4242424242424242424242424242424242424242424242424242424242424242")
            ).to.be.eq("0x" + "baddad".padEnd(64, "0"))
        })

    })
})
