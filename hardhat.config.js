require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("chai")
// require("@nomicfoundation/hardhat-toolbox")
// require("hardhat-contract-sizer")
require("dotenv").config()

const RINKEBY_RPC_URL = process.env.RINKEBY_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const KOVAN_RPC_URL = process.env.KOVAL_URL
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1
        },
        rinkeby: {
            chainId: 4,
            blockConfirmations: 1,
            url: RINKEBY_RPC_URL,
            accounts: [PRIVATE_KEY]
        }
    },
    gasReporter: {
        enabled: false
    },
    solidity: "0.8.8",
    namedAccounts: {
        deployer: {
            default: 0
        },
        player: {
            default: 1
        }
    },
    mocha: {
        timeout: 100000
    }
}
