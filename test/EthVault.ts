import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { getAddress, parseEther } from "viem";

describe("EthVault", async () => {
  const { viem, networkHelpers } = await network.create();
  async function fixture() {
    const [owner, alice, bob] = await viem.getWalletClients();
    const publicClient = await viem.getPublicClient();
    const vault = await viem.deployContract("EthVault", [owner.account.address]);
    return { vault, owner, alice, bob, publicClient };
  }

  it("credits deposits and emits an event", async () => {
    const { vault, alice } = await networkHelpers.loadFixture(fixture);
    const amount = parseEther("1");
    await viem.assertions.emitWithArgs(vault.write.deposit([], { account: alice.account, value: amount }), vault, "Deposited", [getAddress(alice.account.address), amount]);
    assert.equal(await vault.read.balances([alice.account.address]), amount);
    assert.equal(await vault.read.totalDeposits(), amount);
  });

  it("credits ETH sent directly to receive()", async () => {
    const { vault, alice } = await networkHelpers.loadFixture(fixture);
    await alice.sendTransaction({ to: vault.address, value: 123n });
    assert.equal(await vault.read.balances([alice.account.address]), 123n);
    assert.equal(await vault.read.totalDeposits(), 123n);
  });

  it("withdraws only the caller's balance and preserves other deposits", async () => {
    const { vault, alice, bob, publicClient } = await networkHelpers.loadFixture(fixture);
    await vault.write.deposit([], { account: alice.account, value: 100n });
    await vault.write.deposit([], { account: bob.account, value: 200n });
    await viem.assertions.emitWithArgs(vault.write.withdraw([40n], { account: alice.account }), vault, "Withdrawn", [getAddress(alice.account.address), 40n]);
    assert.equal(await vault.read.balances([alice.account.address]), 60n);
    assert.equal(await vault.read.balances([bob.account.address]), 200n);
    assert.equal(await vault.read.totalDeposits(), 260n);
    assert.equal(await publicClient.getBalance({ address: vault.address }), 260n);
  });

  it("rejects zero amounts and over-withdrawals", async () => {
    const { vault, alice, owner } = await networkHelpers.loadFixture(fixture);
    await viem.assertions.revertWithCustomError(vault.write.deposit([], { value: 0n }), vault, "ZeroAmount");
    await viem.assertions.revertWithCustomError(vault.write.withdraw([0n]), vault, "ZeroAmount");
    await vault.write.deposit([], { account: alice.account, value: 10n });
    await viem.assertions.revertWithCustomError(vault.write.withdraw([11n], { account: alice.account }), vault, "InsufficientBalance");
    await viem.assertions.revertWithCustomError(vault.write.withdraw([1n], { account: owner.account }), vault, "InsufficientBalance");
  });

  it("restricts pause controls to the owner", async () => {
    const { vault, alice } = await networkHelpers.loadFixture(fixture);
    await viem.assertions.revertWithCustomError(vault.write.pause([], { account: alice.account }), vault, "OwnableUnauthorizedAccount");
    await vault.write.pause();
    await viem.assertions.revertWithCustomError(vault.write.unpause([], { account: alice.account }), vault, "OwnableUnauthorizedAccount");
  });

  it("blocks deposits while paused but keeps withdrawals open", async () => {
    const { vault, alice } = await networkHelpers.loadFixture(fixture);
    await vault.write.deposit([], { account: alice.account, value: 10n });
    await vault.write.pause();
    await viem.assertions.revertWithCustomError(vault.write.deposit([], { value: 1n }), vault, "EnforcedPause");
    await viem.assertions.revertWithCustomError(alice.sendTransaction({ to: vault.address, value: 1n }), vault, "EnforcedPause");
    await vault.write.withdraw([10n], { account: alice.account });
    assert.equal(await vault.read.totalDeposits(), 0n);
    await vault.write.unpause();
    await vault.write.deposit([], { value: 1n });
  });

  it("requires the pending owner to accept ownership", async () => {
    const { vault, owner, alice, bob } = await networkHelpers.loadFixture(fixture);
    await vault.write.transferOwnership([alice.account.address]);
    assert.equal(await vault.read.owner(), getAddress(owner.account.address));
    await viem.assertions.revertWithCustomError(vault.write.acceptOwnership([], { account: bob.account }), vault, "OwnableUnauthorizedAccount");
    await vault.write.acceptOwnership([], { account: alice.account });
    assert.equal(await vault.read.owner(), getAddress(alice.account.address));
    await viem.assertions.revertWithCustomError(vault.write.pause([], { account: owner.account }), vault, "OwnableUnauthorizedAccount");
    await vault.write.pause([], { account: alice.account });
  });

  it("restores balances when a receiver rejects ETH", async () => {
    const { vault, publicClient } = await networkHelpers.loadFixture(fixture);
    const receiver = await viem.deployContract("VaultReceiver", [vault.address]);
    await receiver.write.deposit([], { value: 10n });
    await viem.assertions.revertWithCustomError(receiver.write.withdraw([10n, true, false]), vault, "TransferFailed");
    assert.equal(await vault.read.balances([receiver.address]), 10n);
    assert.equal(await vault.read.totalDeposits(), 10n);
    assert.equal(await publicClient.getBalance({ address: vault.address }), 10n);
  });

  it("prevents reentrant withdrawals even when the attacker has remaining credit", async () => {
    const { vault, alice, publicClient } = await networkHelpers.loadFixture(fixture);
    const receiver = await viem.deployContract("VaultReceiver", [vault.address]);
    await vault.write.deposit([], { account: alice.account, value: 100n });
    await receiver.write.deposit([], { value: 20n });
    await receiver.write.withdraw([10n, false, true]);
    assert.equal(await receiver.read.reentrySucceeded(), false);
    assert.equal(await vault.read.balances([receiver.address]), 10n);
    assert.equal(await vault.read.totalDeposits(), 110n);
    assert.equal(await publicClient.getBalance({ address: vault.address }), 110n);
  });
});
