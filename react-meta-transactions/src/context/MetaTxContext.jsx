import { createContext } from "react";
import {Wallet} from "@ethersproject/wallet";

const MetaTxContext = createContext({
    signingAccount: null,
    isMetaMask: false,
    wallet: Wallet.createRandom()
});

export default MetaTxContext;
