// tools/makeWallet.mjs
import { Wallet } from "ethers";

const wallet = Wallet.createRandom();
console.log("✅ New wallet generated:");
console.log("PRIVATE_KEY =", wallet.privateKey);
console.log("PUBLIC_ADDRESS =", wallet.address);
console.log("MNEMONIC (optional backup) =", wallet.mnemonic?.phrase);
