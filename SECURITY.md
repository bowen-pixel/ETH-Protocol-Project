# Security notes

This starter has not received an independent security audit. It is intended for local development and testnets. OpenZeppelin's library audit status does not extend to this application's custom logic.

## Dependency review at setup

`npm audit` reported 12 high-severity package entries inherited from one advisory in Hardhat's development dependency `zod@3.25.76`: [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). The advisory concerns memory exhaustion during validation of oversized collections. It affects tooling, not deployed Solidity bytecode.

Hardhat 3.22.0 declares Zod 3.x. The advisory lists a fix in Zod 4.6.6, which is a major version change. This starter does not force an incompatible dependency override or automatically downgrade the Hardhat stack. Use trusted configuration and review upstream updates before deploying from this toolchain. Run `npm audit` again when updating dependencies; the findings can change.

## Scope and trust assumptions

- The owner controls deposit availability but cannot seize credited deposits through the vault API.
- Withdrawals are deliberately available while deposits are paused. This means a future withdrawal vulnerability cannot be halted by the current pause mechanism; reconsider this policy if the contract grows.
- The vault does not invest, lend, bridge, or stake deposited ETH.
- No external oracle, token integration, fee system, upgrade authority, or UI is included.
- User balances are internal credits, not transferable tokens.
- Forced ETH has no credit and cannot be recovered. A receiver that rejects ETH needs a different withdrawal design.

For future production work, define reporting contact details and a disclosure process before making the repository public.
