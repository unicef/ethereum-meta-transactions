pragma solidity >=0.4.22 <0.9.0;

contract Addition {

    constructor() public{

    }

    function doAddition(uint n1,uint n2) public view returns(uint){
        return n1+n2;
    }
}
