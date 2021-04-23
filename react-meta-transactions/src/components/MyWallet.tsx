import React, {useState} from 'react'
import { useWeb3React } from '@web3-react/core'
import {Web3Provider} from '@ethersproject/providers'
import {EthSWRConfig} from 'ether-swr'
import {EthBalance} from "./EthBalance";
import {injectedConnector, networkConnector} from "../connectors";
import MetaTxContext from "../context/MetaTxContext";
import {Wallet} from "@ethersproject/wallet";
import {ethers} from "ethers";

export const ABIs = (contracts: any, chainId: number) => { return contracts.map((contract: any) => { return [contract.address,contract.abi]})}

export const MyWallet = (props: any) => {
    const { connector, chainId, account, activate, active, library} = useWeb3React<
        Web3Provider
        >();
    const provider = new ethers.providers.JsonRpcProvider(props.provider)
    const wallet = new Wallet(props.privateKey, provider);
    const [balance, setBalance] = useState(0);
    const [signingAccount, setSigningAccount] = useState(null);
    const [isMetaMask, setIsMetaMask] = useState(false);

    const setContext = (account:any, isMetaMask: boolean) => {
        setSigningAccount(account);
        setIsMetaMask(isMetaMask);
    }

    React.useEffect(() => {
        activate(injectedConnector, (error => activate(networkConnector)));
    }, [activate]);

    React.useEffect(() => {
        if (balance && balance<=0){
            setContext(account,true);
        }
    }, [account,balance])

    return (
        <>
            {active && chainId && (
                <EthSWRConfig
                    value={{ web3Provider: library, ABIs: new Map(ABIs(props.contracts,chainId)) }}
                >{ connector === injectedConnector && (
                    <EthBalance balance={setBalance}>
                        <MetaTxContext.Provider
                            value={{
                                signingAccount,
                                isMetaMask,
                                wallet
                            }}
                        >
                            <div>{props.children}</div>
                        </MetaTxContext.Provider>
                    </EthBalance>
                )
                }
                    { (connector === networkConnector || balance <= 0) && (
                        <MetaTxContext.Provider
                            value={{
                                signingAccount,
                                isMetaMask,
                                wallet
                            }}
                        >
                            <div>{props.children}</div>
                        </MetaTxContext.Provider>
                    )
                    }
                </EthSWRConfig>
            )}
        </>
    )
}
