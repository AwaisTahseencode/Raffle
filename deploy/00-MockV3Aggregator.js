const { network, ethers } = require("hardhat")
const {networkConfig,developmentChains}=require("../helper-hardhat-config.js")
const BASE_FEE=ethers.utils.parseEther("0.25")
const GASPRICELINK=1e9
const args=[BASE_FEE,GASPRICELINK]
module.exports=async({getNamedAccounts,deployments})=>{
    const {deploy,log}=deployments
    const{deployer}=await getNamedAccounts()
    const chainId=network.config.chainId
    if(developmentChains.includes(network.name)){
        log("Local Network detected , deploying Mocks.....")
        await deploy("VRFCoordinatorV2Mock",{
            from:deployer,
            log:true,
            args:args,
        })
        log("Mocks deployed..")
        log("------------------------------------")
    }
}
module.exports.tags=["all","mock"]