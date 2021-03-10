import React, {useContext} from "react";
import MetaTxContext from "../context/MetaTxContext";
import {execute} from "../utils";

export const ExecuteMetaTx = (props: any) => {

    const {signingAccount} = useContext(MetaTxContext);
    console.log("signingAccount")
    console.log(signingAccount);
    const getA = async () => {
        const tx = await execute(props.method, props.params, signingAccount);
        console.log(tx);
        props.result(tx);
        console.log(tx);
    };
    React.useEffect(() => {
        getA();
    },[]);
    return props.children
}
