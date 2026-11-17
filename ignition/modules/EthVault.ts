import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("EthVaultModule", (m) => {
  const initialOwner = m.getParameter("initialOwner", m.getAccount(0));
  const vault = m.contract("EthVault", [initialOwner]);
  return { vault };
});
