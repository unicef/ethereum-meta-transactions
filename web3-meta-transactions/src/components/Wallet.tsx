import React, {useState} from 'react'
import { useWeb3React } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import { shorter} from '../utils'
import {EthSWRConfig} from 'ether-swr'
import {EthBalance} from "./EthBalance";
import {injectedConnector, networkConnector} from "../connectors";
import MetaTxContext from "../context/MetaTxContext";

export const ABIs = (contracts: any, chainId: number) => { return contracts.map((contract: any) => { return [contract.address,contract.abi]})}

export const Wallet = (props: any) => {
    const { connector, chainId, account, activate, active, library} = useWeb3React<
        Web3Provider
        >();
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
        if (active) {
            console.log(connector);
        }
    }, [active, connector]);

    React.useEffect(() => {
        if (balance && balance<=0){
            setContext(account,true);
        }
    }, [account,balance])
    return (
        <div>
            <div>ChainId: {chainId}</div>
            <div>Account: {shorter(account)}</div>
            {active ? (
                <span role="img" aria-label="active">
          ✅{' '}
        </span>
            ) : (
                <button type="button" onClick={onClick}>
                    Connect
                </button>
            )}
            {active && chainId && (
                <EthSWRConfig
                    value={{ web3Provider: library, ABIs: new Map(ABIs(props.contracts,chainId)) }}
                >{ connector === injectedConnector && (
                    <EthBalance balance={setBalance}>
                        <MetaTxContext.Provider
                            value={{
                                signingAccount,
                                isMetaMask
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
                                isMetaMask
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
