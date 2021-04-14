import React, {useState} from 'react'
import { useWeb3React } from '@web3-react/core'
import {JsonRpcProvider, Web3Provider} from '@ethersproject/providers'
import { shorter} from '../utils'
import {EthSWRConfig} from 'ether-swr'
import {EthBalance} from "./EthBalance";
import {injectedConnector, networkConnector} from "../connectors";
import MetaTxContext from "../context/MetaTxContext";
import {Wallet} from "@ethersproject/wallet";

export const ABIs = (contracts: any, chainId: number) => { return contracts.map((contract: any) => { return [contract.address,contract.abi]})}

export const MyWallet = (props: any) => {
    const { connector, chainId, account, activate, active, library} = useWeb3React<
        Web3Provider
        >();
    const provider = new JsonRpcProvider(props.provider);
    console.log("provider", provider);
    const wallet = new Wallet(props.privateKey, provider);
    console.log("wallet", wallet);
    // const HDWallet = HDNode.fromMnemonic(process.env.REACT_APP_mnemonic as string, process.env.REACT_APP_RPC_URL_4 as string);
    // console.log(HDWallet);
    // const provider = new Web3Provider(HDWallet, );
    const [balance, setBalance] = useState(0);
    const [signingAccount, setSigningAccount] = useState(null);
    const [isMetaMask, setIsMetaMask] = useState(false);
    const onClick = () => {
        activate(injectedConnector, (error => activate(networkConnector)));
    };

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
        <div>
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
                    {/* This where the business related components will be added. The call of the contract will be eventually done
                    depending on the connector (if network, the process of meta transactions will be called)
                */}
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

        </div>
    )
}
