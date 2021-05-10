const {arrayify, solidityKeccak256} = require('ethers/lib/utils');
const {ethers} = require('ethers')
const lightwallet = require('eth-lightwallet')
const Util = require('ethereumjs-util');

const utils = require('./general')
const BigNumber = require('bignumber.js')

const GAS_PRICE = web3.utils.toWei("100", 'gwei')

let byteGasCosts = function(hexValue) {
    // TODO: adjust for Istanbul hardfork (https://eips.ethereum.org/EIPS/eip-2028)
    // Note: this is only supported with the latest ganache versions
    switch(hexValue) {
        case "0x": return 0
        case "00": return 4
        default: return 68
    }
}

 let calcDataGasCosts = function(dataString) {
    const reducer = (accumulator, currentValue) => accumulator += byteGasCosts(currentValue)

   return dataString.match(/.{2}/g).reduce(reducer, 0)
 }

let estimateBaseGas = function(safe, to, value, data, operation, txGasEstimate, gasToken, refundReceiver, signatureCount, nonce) {
    // TODO: adjust for Istanbul hardfork (https://eips.ethereum.org/EIPS/eip-2028)
    // Note: this is only supported with the latest ganache versions
    // numbers < 256 are 192 -> 31 * 4 + 68
    // numbers < 65k are 256 -> 30 * 4 + 2 * 68
    // For signature array length and baseGasEstimate we already calculated the 0 bytes so we just add 64 for each non-zero byte
    let signatureCost = signatureCount * (68 + 2176 + 2176 + 6000) // (array count (3 -> r, s, v) + ecrecover costs) * signature count
    let payload = safe.contract.methods.execTransaction(
        to, value, data, operation, txGasEstimate, utils.Address0, GAS_PRICE, gasToken, refundReceiver, "0x"
    ).encodeABI()
    let baseGasEstimate = calcDataGasCosts(payload) + signatureCost + (nonce > 0 ? 5000 : 20000)
    baseGasEstimate += 1500 // 1500 -> hash generation costs
    baseGasEstimate += 1000 // 1000 -> Event emission
    return baseGasEstimate + 32000; // Add aditional gas costs (e.g. base tx costs, transfer costs)
}

let executeTransactionWithSigner = async function(signer, safe, subject, accounts, to, value, data, operation, executor, opts) {
    let options = opts || {}
    let txFailed = options.fails || false
    let txGasToken = options.gasToken || utils.Address0
    let refundReceiver = options.refundReceiver || utils.Address0
    let extraGas = options.extraGas || 0

    // Estimate safe transaction (need to be called with from set to the safe address)
    let txGasEstimate = 0
    let estimateData = safe.contract.methods.requiredTxGas(to, value, data, operation).encodeABI()
    try {
        let estimateResponse = await web3.eth.call({to: safe.address, from: safe.address, data: estimateData, gasPrice: 0})
        txGasEstimate = new BigNumber(estimateResponse.substring(138), 16)
        // Add 10k else we will fail in case of nested calls
        txGasEstimate = txGasEstimate.toNumber() + 10000
        console.log("    Tx Gas estimate: " + txGasEstimate)
    } catch(e) {
        console.log("    Could not estimate " + subject + "; cause: " + e)
    }
    let nonce = await safe.nonce()

    let baseGasEstimate = estimateBaseGas(safe, to, value, data, operation, txGasEstimate, txGasToken, refundReceiver, accounts.length, nonce) + extraGas
    console.log("    Base Gas estimate: " + baseGasEstimate)

    if (txGasEstimate > 0) {
        let estimateDataGasCosts = calcDataGasCosts(estimateData)
        let additionalGas = 10000
        // To check if the transaction is successfull with the given safeTxGas we try to set a gasLimit so that only safeTxGas is available,
        // when `execute` is triggered in `requiredTxGas`. If the response is `0x` then the inner transaction reverted and we need to increase the amount.
        for (let i = 0; i < 100; i++) {
            try {
                let estimateResponse = await web3.eth.call({
                    to: safe.address, 
                    from: safe.address, 
                    data: estimateData, 
                    gasPrice: 0, 
                    gasLimit: txGasEstimate + estimateDataGasCosts + 21000 // We add 21k for base tx costs
                })
                if (estimateResponse != "0x") break
            } catch(e) {
                console.log("    Could simulate " + subject + "; cause: " + e)
            }
            txGasEstimate += additionalGas
            additionalGas *= 2
        }    
    }
    let gasPrice = GAS_PRICE
    if (txGasToken != utils.Address0) {
        gasPrice = 1
    }
    gasPrice = options.gasPrice || gasPrice

    let sigs = await signer(to, value, data, operation, txGasEstimate, baseGasEstimate, gasPrice, txGasToken, refundReceiver, nonce)

    let payload = safe.contract.methods.execTransaction(
        to, value, data, operation, txGasEstimate, baseGasEstimate, gasPrice, txGasToken, refundReceiver, sigs
    ).encodeABI()

    console.log("    Data costs: " + calcDataGasCosts(payload))
    console.log("    Tx Gas estimate: " + txGasEstimate)
    // Estimate gas of paying transaction
    let estimate = null
    try {
        estimate = await safe.execTransaction.estimateGas(
            to, value, data, operation, txGasEstimate, baseGasEstimate, gasPrice, txGasToken, refundReceiver, sigs, {
                from: executor,
                gasPrice: options.txGasPrice || gasPrice
        })
    } catch (e) {
        console.log("    Estimation error")
        if (options.revertMessage == undefined ||options.revertMessage == null) {
            throw e
        }
        assert.equal(e.message, ("Returned error: VM Exception while processing transaction: revert " + options.revertMessage).trim())
        return null
    }

    if (estimate < txGasEstimate) {
        const block = await web3.eth.getBlock("latest")
        estimate = block.gasLimit - 10000
    }
    console.log("    GasLimit estimation:", (estimate + 10000))

    // Execute paying transaction
    // We add the txGasEstimate and an additional 10k to the estimate to ensure that there is enough gas for the safe transaction
    let tx = await safe.execTransaction(
        to, value, data, operation, txGasEstimate, baseGasEstimate, gasPrice, txGasToken, refundReceiver, sigs, {from: executor, gas: estimate + 10000, gasPrice: options.txGasPrice || gasPrice}
    )
    let eventName = (txFailed) ? 'ExecutionFailure' : 'ExecutionSuccess'
    let event = utils.checkTxEvent(tx, eventName, safe.address, true, subject)
    let transactionHash = await safe.getTransactionHash(to, value, data, operation, txGasEstimate, baseGasEstimate, gasPrice, txGasToken, refundReceiver, nonce)
    assert.equal(transactionHash, event.args.txHash)
    if (txGasEstimate > 0) {
        let maxPayment = (baseGasEstimate + txGasEstimate) * gasPrice
        console.log("    User paid", event.args.payment.toString(), "after signing a maximum of", maxPayment)
        assert.ok(maxPayment >= event.args.payment, "Should not pay more than signed")
    } else {
        console.log("    User paid", event.args.payment.toString())
    }
    return tx
}

let executeMetaTransactionWithSigner = async function(verifier, lw, signer, safe, subject, accounts, to, value, data, operation, executor, opts) {
    let options = opts || {}
    let txFailed = options.fails || false
    let txGasToken = options.gasToken || utils.Address0
    let refundReceiver = options.refundReceiver || utils.Address0
    let extraGas = options.extraGas || 0

    // Estimate safe transaction (need to be called with from set to the safe address)
    let txGasEstimate = 0
    let estimateData = safe.contract.methods.requiredTxGas(to, value, data, operation).encodeABI()
    try {
        let estimateResponse = await web3.eth.call({to: safe.address, from: safe.address, data: estimateData, gasPrice: 0})
        txGasEstimate = new BigNumber(estimateResponse.substring(138), 16)
        // Add 10k else we will fail in case of nested calls
        txGasEstimate = txGasEstimate.toNumber() + 10000
        console.log("    Tx Gas estimate: " + txGasEstimate)
    } catch(e) {
        console.log("    Could not estimate " + subject + "; cause: " + e)
    }
    let nonce = await safe.nonce()
    let baseGasEstimate = estimateBaseGas(safe, to, value, data, operation, txGasEstimate, txGasToken, refundReceiver, accounts.length, nonce) + extraGas
    console.log("    Base Gas estimate: " + baseGasEstimate)

    if (txGasEstimate > 0) {
        let estimateDataGasCosts = calcDataGasCosts(estimateData)
        let additionalGas = 10000
        // To check if the transaction is successfull with the given safeTxGas we try to set a gasLimit so that only safeTxGas is available,
        // when `execute` is triggered in `requiredTxGas`. If the response is `0x` then the inner transaction reverted and we need to increase the amount.
        for (let i = 0; i < 100; i++) {
            try {
                let estimateResponse = await web3.eth.call({
                    to: safe.address,
                    from: safe.address,
                    data: estimateData,
                    gasPrice: 0,
                    gasLimit: txGasEstimate + estimateDataGasCosts + 21000 // We add 21k for base tx costs
                })
                if (estimateResponse != "0x") break
            } catch(e) {
                console.log("    Could simulate " + subject + "; cause: " + e)
            }
            txGasEstimate += additionalGas
            additionalGas *= 2
        }
    }
    let gasPrice = GAS_PRICE
    if (txGasToken != utils.Address0) {
        gasPrice = 1
    }
    gasPrice = options.gasPrice || gasPrice

    let sigs = await signer(to, value, data, operation, txGasEstimate, baseGasEstimate, gasPrice, txGasToken, refundReceiver, nonce)

    let payload = safe.contract.methods.execTransaction(
        to, value, data, operation, txGasEstimate, baseGasEstimate, gasPrice, txGasToken, refundReceiver, sigs
    ).encodeABI()
    console.log('payload', payload)
    const nonceVerifier = await verifier.nonce(accounts[0]);
    console.log('nonceVerifier', nonceVerifier.toNumber())
    const parts = [
        verifier.address,
        accounts[0],
        safe.address,
        0,
        payload,
        nonceVerifier.toNumber()
    ];
    const hashOnChain = await verifier.getHash(accounts[0], safe.address, 0, payload)
    console.log('hashOnChain', hashOnChain)
    let payloadHash = solidityKeccak256([ "address", "address", "address", "uint", "bytes", "uint"], parts);
    console.log('payloadHash', payloadHash)
    const privateKeyBuff = getPrivateKeyBuff(lw.keystore, lw.passwords, accounts[0]);
    const wallet = new ethers.Wallet(privateKeyBuff);
    console.log('wallet', wallet)
    const signature = await wallet.signMessage(arrayify(payloadHash));
    // const signa = lightwallet.signing.signMsgHash(lw.keystore, lw.passwords, payloadHash, accounts[0])
    // const signature = "0x" + signa.r.toString('hex') + signa.s.toString('hex') + signa.v.toString(16)
    console.log('signature', signature)
    let payloadVerifier = verifier.contract.methods.forward(signature, accounts[0], safe.address, 0, payload).encodeABI()

    console.log("    Data costs: " + calcDataGasCosts(payload))
    console.log("    Tx Gas estimate: " + txGasEstimate)
    // Estimate gas of paying transaction
    let estimate = null
    try {
        estimate = await verifier.forward.estimateGas(
            signature, accounts[0], safe.address, 0, payload, {
                from: executor,
                gasLimit: 1200000,
                gasPrice: Math.round(4 * 1000000000)
            })
        console.log('estimate', estimate)
    } catch (e) {
        console.log("    Estimation error")
        if (options.revertMessage == undefined ||options.revertMessage == null) {
            throw e
        }
        assert.equal(e.message, ("Returned error: VM Exception while processing transaction: revert " + options.revertMessage).trim())
        return null
    }

    // if (estimate < txGasEstimate) {
    //     const block = await web3.eth.getBlock("latest")
    //     estimate = block.gasLimit - 10000
    // }
    // console.log("    GasLimit estimation:", (estimate + 10000))

    // Execute paying transaction
    // We add the txGasEstimate and an additional 10k to the estimate to ensure that there is enough gas for the safe transaction
    let tx = await verifier.forward(
        signature, accounts[0], safe.address, 0, payload, {
            from: executor,
            gasLimit: 1200000,
            gasPrice: Math.round(4 * 1000000000)
        })
    let eventName = (txFailed) ? 'ExecutionFailure' : 'Forwarded'
    let event = utils.checkTxEvent(tx, eventName, verifier.address, true, subject)
    console.log('event', event.event)
    assert.equal(event.event, eventName)
    // if (txGasEstimate > 0) {
    //     let maxPayment = (baseGasEstimate + txGasEstimate) * gasPrice
    //     console.log("    User paid", event.args.payment.toString(), "after signing a maximum of", maxPayment)
    //     assert.ok(maxPayment >= event.args.payment, "Should not pay more than signed")
    // } else {
    //     console.log("    User paid", event.args.payment.toString())
    // }
    return tx
}

let executeTransaction = async function(lw, safe, subject, accounts, to, value, data, operation, executor, opts) {
    let signer = async function(to, value, data, operation, txGasEstimate, baseGasEstimate, gasPrice, txGasToken, refundReceiver, nonce) {
        let transactionHash = await safe.getTransactionHash(to, value, data, operation, txGasEstimate, baseGasEstimate, gasPrice, txGasToken, refundReceiver, nonce)
        // Confirm transaction with signed messages
        return utils.signTransaction(lw, accounts, transactionHash)
    }
    return executeTransactionWithSigner(signer, safe, subject, accounts, to, value, data, operation, executor, opts)
}

let executeMetaTransaction = async function(verifier, lw, safe, subject, accounts, to, value, data, operation, executor, opts) {
    let signer = async function(to, value, data, operation, txGasEstimate, baseGasEstimate, gasPrice, txGasToken, refundReceiver, nonce) {
        let transactionHash = await safe.getTransactionHash(to, value, data, operation, txGasEstimate, baseGasEstimate, gasPrice, txGasToken, refundReceiver, nonce)
        // Confirm transaction with signed messages
        return utils.signTransaction(lw, accounts, transactionHash)
    }
    return executeMetaTransactionWithSigner(verifier, lw, signer, safe, subject, accounts, to, value, data, operation, executor, opts)
}

let deployToken = async function(deployer) {
    return deployContract(deployer, `contract TestToken {
        mapping (address => uint) public balances;
        constructor() public {
            balances[msg.sender] = 1000000000000;
        }

        function mint(address to, uint value) public returns (bool) {
            balances[to] += value;
            return true;
        }

        function transfer(address to, uint value) public returns (bool) {
            if (balances[msg.sender] < value) {
                return false;
            }
            balances[msg.sender] -= value;
            balances[to] += value;
            return true;
        }
    }`)
}

let deployContract = async function(deployer, source) {
    let output = await utils.compile(source)
    let contractInterface = output.interface
    let contractBytecode = output.data
    let transaction = await web3.eth.sendTransaction({from: deployer, data: contractBytecode, gas: 6000000})
    let receipt = await web3.eth.getTransactionReceipt(transaction.transactionHash)
    return new web3.eth.Contract(contractInterface, receipt.contractAddress)
}

function getPrivateKeyBuff(keystore, pwDerivedKey, address) {
    const privateKey = keystore.exportPrivateKey(Util.stripHexPrefix(address), pwDerivedKey);

    return new Buffer(privateKey, 'hex');
}

Object.assign(exports, {
    estimateBaseGas,
    executeTransaction,
    executeMetaTransaction,
    executeTransactionWithSigner,
    executeMetaTransactionWithSigner,
    deployToken,
    deployContract
})
