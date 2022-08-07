//Address in the constructor indicates the we have to edploy also the some mockAggregator for it
const {network, ethers}=require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
module.exports=async({getNamedAccounts,deployments})=>{
const {deploy,log}=deployments
const {deployer}=await getNamedAccounts()
const chainId=network.config.chainId
let vrfCoordinatorV2,subscriptionId
const VRF_SUB_FUND_AMOUNT=ethers.utils.parseEther("2")
if(developmentChains.includes(network.name)){
    const mockAggregator=await ethers.getContract("VRFCoordinatorV2Mock")
    vrfCoordinatorV2=mockAggregator.address
    const transactionResponse=await mockAggregator.createSubscription()
    const transactionReceipt=await transactionResponse.wait(1)
    subscriptionId=transactionReceipt.events[0].args.subId
    await mockAggregator.fundSubscription(subscriptionId,VRF_SUB_FUND_AMOUNT)
}
else {
    vrfCoordinatorV2=networkConfig[chainId]["vrfCoordinatorV2"]
    subscriptionId=networkConfig[chainId]["subscriptionId"]
}
const interval=networkConfig[chainId]["interval"]
const gasLane=networkConfig[chainId]["gasLane"]
const entranceFee=networkConfig[chainId]["entranceFee"]
const callbackGasLimit=networkConfig[chainId]["callbackGasLimit"]
const args=[vrfCoordinatorV2,entranceFee,gasLane,subscriptionId,callbackGasLimit,interval]
const raffle=await deploy("Raffle",{
    from:deployer,
    args:args,
    waitConfirmations:network.config.blockConfirmations || 1
})
}
module.exports.tags=["all","raffle"]