# Ethereum smart contract starter

A small learning project following [OpenZeppelin’s Developing smart contracts guide](https://docs.openzeppelin.com/contracts/5.x/learn/developing-smart-contracts#setting-up-a-project).

This repository contains only the basic project setup. No smart contract has been written or deployed yet.

## Setup

Use Node.js 24 and npm.

```sh
git clone https://github.com/bowen-pixel/ethereum-protocol-starter.git
cd ethereum-protocol-starter
nvm use
npm ci
```

If you do not use nvm, install Node.js 24 directly and skip `nvm use`.

## Tools

- **Hardhat 3** compiles Solidity contracts and provides a local development blockchain.
- **OpenZeppelin Contracts 5** provides reusable Solidity components to import when needed.
- **Solidity 0.8.28** is configured in `hardhat.config.js`.

The linked tutorial includes Hardhat 2 and ethers.js examples. This setup uses Hardhat 3 with JavaScript modules, so some commands and configuration differ.

## Files

| File | Responsibility |
| --- | --- |
| `README.md` | Project introduction and setup instructions |
| `package.json` | Dependencies and development commands |
| `package-lock.json` | Exact dependency versions for reproducible installs |
| `hardhat.config.js` | Solidity compiler configuration |
| `.nvmrc` | Node.js version |
| `.gitignore` | Excludes dependencies, generated files, and common secret files |
| `LICENSE` | MIT license |

## Commands

```sh
npm run build
npm run node
```

The build command will have no contracts to compile until you add a `.sol` file under `contracts/`. The node command starts a local development blockchain.

## Next step

Work through the guide’s first `Box.sol` example, then learn how to compile it and import OpenZeppelin components. Add tests and deployment configuration as those steps become relevant.
