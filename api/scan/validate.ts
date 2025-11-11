import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createPublicClient, http, verifyMessage, getAddress } from "viem";
import { baseSepolia } from "viem/chains"; // switch to 'base' for mainnet
import type { Abi } from "viem";
import erc1155Abi from "./erc1155.abi";
import erc721Abi from "./erc721.abi";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

function decode(s: string) {
  try { return JSON.parse(Buffer.from(s, "base64").toString("utf8")); }
  catch { return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");
    const { qrData } = req.body as { qrData: string };
    const parsed = decode(qrData);
    if (!parsed?.payload || !parsed?.signature) return res.status(400).json({ ok:false, reason:"malformed" });

    const { payload, signature } = parsed;
    const signerExpected = getAddress(process.env.SIGNER_PUBLIC as `0x${string}`);
    const isValid = await verifyMessage({ address: signerExpected, message: JSON.stringify(payload), signature: signature as `0x${string}` });
    if (!isValid) return res.status(400).json({ ok:false, reason:"bad_sig" });

    const rotateSec = Number(process.env.QR_ROTATE_SECONDS || 300);
    const nowNonce = Math.floor(Date.now() / (rotateSec * 1000));
    if (Math.abs(Number(payload.nonce) - nowNonce) > 1) return res.status(400).json({ ok:false, reason:"expired" });

    const { data: tkt } = await supabase
      .from("tickets").select("id,status,wallet_address,token_id")
      .eq("id", payload.ticketId).single();
    if (!tkt) return res.status(404).json({ ok:false, reason:"ticket_not_found" });

    if (tkt.wallet_address && tkt.token_id != null) {
      const client = createPublicClient({ chain: baseSepolia, transport: http(process.env.RPC_URL!) });
      const contract = process.env.CONTRACT_ADDRESS as `0x${string}`;
      const addr = getAddress(tkt.wallet_address as `0x${string}`);
      const standard = (process.env.TOKEN_STANDARD || "erc1155").toLowerCase();

      if (standard === "erc1155") {
   const bal = (await (client as any).readContract({
  address: contract as `0x${string}`,
  abi: erc1155Abi as Abi,
  functionName: "balanceOf",
  args: [addr as `0x${string}`, BigInt(tkt.token_id!)],
})) as bigint;

if (bal <= 0n) return res.status(400).json({ ok:false, reason:"not_owner_onchain" });
      } else {
   const owner = (await (client as any).readContract({
  address: contract as `0x${string}`,
  abi: erc721Abi as Abi,
  functionName: "ownerOf",
  args: [BigInt(tkt.token_id!)],
})) as `0x${string}`;

if (owner.toLowerCase() !== addr.toLowerCase()) {
  return res.status(400).json({ ok:false, reason:"not_owner_onchain" });
}
      }
    }

    if (tkt.status === "used") return res.status(409).json({ ok:false, reason:"duplicate" });
    await supabase.from("tickets").update({ status:"used", scanned_at: new Date().toISOString() }).eq("id", tkt.id);
    await supabase.from("scans").insert({ ticket_id: tkt.id, result: "ok", nonce_seen: payload.nonce });

    return res.json({ ok:true });
  } catch (e: any) {
    return res.status(500).json({ ok:false, reason: e.message });
  }
}
