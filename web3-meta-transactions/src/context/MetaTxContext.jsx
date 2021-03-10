import { createContext } from "react";

const MetaTxContext = createContext({
    signingAccount: null,
    isMetaMask: false
});

export default MetaTxContext;
