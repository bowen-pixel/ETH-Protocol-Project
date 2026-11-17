# Ethereum protocol starter

A small ETH vault built with Solidity 0.8.28, OpenZeppelin Contracts 5.6.1, and Hardhat 3.22.0 with TypeScript/viem. This is a starting point for defining a protocol, not a production-ready financial product.

## Start locally

Use Node.js 24 and npm. Dependencies are locked in `package-lock.json`.

```sh
nvm use
npm ci
npm run check
```

`check` compiles contracts, generates ABI types, checks TypeScript, and runs tests. Compilation downloads the Solidity compiler on first use. Tests use a local simulated blockchain and need no wallet, RPC key, or real ETH.

For a persistent local node, run in two terminals:

```sh
# Terminal 1
npm run node
```

```sh
# Terminal 2
npm run deploy:local
```

Hardhat's printed local accounts are publicly known development accounts. Never fund them on a public network.

## Vault behavior

- `deposit()` and plain ETH transfers credit `balances(msg.sender)` and increase `totalDeposits`.
- `withdraw(amount)` sends the caller's own deposited ETH back to their address. Failed sends revert the entire accounting change.
- `pause()` and `unpause()` are owner-only and control deposits. Withdrawals remain available during a pause.
- Ownership transfers require the new owner to call `acceptOwnership()`.
- The owner has no function to withdraw another depositor's funds. The contract is immutable and has no proxy or upgrade mechanism.

OpenZeppelin supplies `Ownable2Step`, `Pausable`, and `ReentrancyGuard`. Withdrawal accounting changes before the external ETH call. Both deposit and withdrawal use a reentrancy guard. These components help protect the implementation but do not audit this custom contract.

Accounting invariant: `address(vault).balance >= totalDeposits`; the sum of user credits equals `totalDeposits`. Forced ETH transfers can increase the physical balance without creating a depositor credit. There is intentionally no surplus recovery function, so forced ETH is stuck. Contract wallets that reject ETH cannot withdraw through this version; adding a recipient parameter would require additional design and tests.

The inherited owner can renounce ownership. Doing so permanently disables pause controls; if already paused, new deposits stay disabled. Withdrawals remain available. Do not renounce ownership casually.

## Deploy to Sepolia

Nothing has been deployed to a public network. Use a dedicated test wallet funded with Sepolia test ETH and a Sepolia JSON-RPC endpoint. Store values interactively in Hardhat's encrypted keystore:

```sh
npx hardhat keystore set SEPOLIA_RPC_URL
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
npm run deploy:sepolia
```

Do not paste wallet secrets into chat, source files, shell arguments, or GitHub. The default initial owner is the deploying account. To select another owner, create an Ignition parameters file containing the address (not a private key):

```json
{
  "EthVaultModule": {
    "initialOwner": "YOUR_OWNER_ADDRESS"
  }
}
```

```sh
npm run deploy:sepolia -- --parameters ./parameters.sepolia.json
```

Keep Ignition's public-network deployment records in Git once reviewed; local chain records are ignored. No mainnet network is configured.

## Project layout

| Path | Purpose |
| --- | --- |
| `contracts/EthVault.sol` | Vault implementation |
| `contracts/test/VaultReceiver.sol` | Hostile receiver test fixture; do not deploy as a protocol component |
| `test/EthVault.ts` | Accounting, access, pause, ownership, failed-send, and reentrancy tests |
| `ignition/modules/EthVault.ts` | Repeatable deployment module |
| `hardhat.config.ts` | Compiler and local/Sepolia network configuration |
| `.github/workflows/ci.yml` | Build, type checking, and tests on pushes and pull requests |

## How to build a protocol from here

1. Define the product: custody, staking, escrow, lending, or another specific behavior. Write down assets, user actions, fees, trust assumptions, and accounting invariants first.
2. Extend the smallest necessary contract surface using standard OpenZeppelin components. This vault does not generate yield or issue shares. For a tokenized vault, evaluate ERC-4626 with an ERC-20 asset such as wrapped ETH as a separate design.
3. Add adversarial tests and fuzz/invariant testing for the new accounting and any external integrations. Test on Sepolia and verify deployed source.
4. Before handling valuable assets, review admin ownership and operational procedures, and obtain independent review of the complete system.

## GitHub

The local repository is prepared for a private GitHub repository named `ethereum-protocol-starter`. If publishing manually with an authenticated GitHub CLI:

```sh
gh repo create ethereum-protocol-starter --private --source=. --remote=origin --push
```

## References

- [OpenZeppelin on Ethereum](https://www.openzeppelin.com/networks/ethereum)
- [OpenZeppelin Contracts documentation](https://docs.openzeppelin.com/contracts/5.x)
- [Hardhat 3 documentation](https://hardhat.org/docs/getting-started)
- [Dependency and security notes](SECURITY.md)
