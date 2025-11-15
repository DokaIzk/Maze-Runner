import type { Signer } from "/wasm/linera_web.js";
import type { EthereumWalletConnector } from "@dynamic-labs/ethereum";
import { isEthereumWallet } from "@dynamic-labs/ethereum";

export class DynamicSigner implements Signer {
  private dynamicWallet: EthereumWalletConnector;

  constructor(dynamicWallet: EthereumWalletConnector) {
    this.dynamicWallet = dynamicWallet;
  }

  async address(): Promise<string> {
    const addr = await this.dynamicWallet.getAddress();
    if (!addr) throw new Error("No address available");
    return addr;
  }

  async containsKey(owner: string): Promise<boolean> {
    const walletAddress = await this.dynamicWallet.getAddress();
    if (!walletAddress) return false;
    return owner.toLowerCase() === walletAddress.toLowerCase();
  }

  async sign(owner: string, value: Uint8Array): Promise<string> {
    // const address: `0x${string}` = owner as `0x${string}`;
    const primaryWallet = await this.dynamicWallet.getAddress();

    if (!primaryWallet || !owner) {
      throw new Error("No primary wallet found");
    }

    if (owner.toLowerCase() !== primaryWallet.toLowerCase()) {
      throw new Error("Owner does not match primary wallet");
    }

    try {
      const msgHex: `0x${string}` = `0x${uint8ArrayToHex(value)}`;

      // Use personal_sign directly to avoid double-hashing
      // if (!isEthereumWallet(this.dynamicWallet)) throw new Error("Not an Ethereum wallet");
      // const walletClient = await this.dynamicWallet.getWalletClient();
      // const signature = await walletClient.request({
      //   method: "personal_sign",
      //   params: [msgHex, address],
      // });

      const signature = await this.dynamicWallet.signMessage(msgHex);

      if (!signature) throw new Error("Failed to sign message");
      return signature;
    } catch (error: any) {
      console.error("Failed to sign message:", error);
      throw new Error(
        `Dynamic signature request failed: ${error?.message || error}`
      );
    }
  }
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b: number) => b.toString(16).padStart(2, "0"))
    .join("");
}