// /api/scan/validate.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createPublicClient, http, verifyMessage, getAddress } from "viem";
import { baseSepolia } from "viem/chains";
import erc1155Abi from "./erc1155.abi";
import erc721Abi from "./erc721.abi";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

function decode(b64: string) {
  try { return JSON.parse(Buffer.from(b64, "base64").toString("utf8")); }
  catch { return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");

    const { qrData } = req.body as { qrData: string };
    const parsed = decode(qrData);
    if (!parsed?.payload || !parsed?.signature) {
      return res.status(400).json({ ok: false, reason: "malformed" });
    }

    const { payload, signature } = parsed; // { ticketId, nonce, chain, ts }
    const signerExpected = getAddress(process.env.SIGNER_PUBLIC as `0x${string}`);
    const message = JSON.stringify(payload);

    // ✅ Correct viem signature check (requires address)
    const isValid = await verifyMessage({
      address: signerExpected,
      message,
      signature: signature as `0x${string}`,
    });
    if (!isValid) return res.status(400).json({ ok: false, reason: "bad_sig" });

    // Freshness: ±1 window allowed
    const rotateSec = Number(process.env.QR_ROTATE_SECONDS || 300);
    const nowNonce = Math.floor(Date.now() / (rotateSec * 1000));
    if (Math.abs(Number(payload.nonce) - nowNonce) > 1) {
      return res.status(400).json({ ok: false, reason: "expired" });
    }

    // Find ticket -> get wallet & token id
    const { data: ticket, error } = await supabase
      .from("tickets")
      .select("id, wallet_address, token_id, status")
      .eq("id", payload.ticketId)
      .single();

    if (error || !ticket) return res.status(404).json({ ok: false, reason: "ticket_not_found" });

    // On-chain ownership check
    const client = createPublicClient({ chain: baseSepolia, transport: http(process.env.RPC_URL!) });
    const contract = process.env.CONTRACT_ADDRESS as `0x${string}`;
    const addr = getAddress(ticket.wallet_address as `0x${string}`);
    const standard = (process.env.TOKEN_STANDARD || "erc1155").toLowerCase();

    let owns = false;
    if (standard === "erc1155") {
      const balance = await client.readContract({
        address: contract,
        abi: erc1155Abi as any,
        functionName: "balanceOf",
        args: [addr, BigInt(ticket.token_id)],
      });
      owns = (balance as bigint) > 0n;
    } else {
      const owner = await client.readContract({
        address: contract,
        abi: erc721Abi as any,
        functionName: "ownerOf",
        args: [BigInt(ticket.token_id)],
      });
      owns = "owner".toLowerCase() === addr.toLowerCase();
    }

    if (!owns) return res.status(400).json({ ok: false, reason: "not_owner_onchain" });

    // Prevent duplicates
    if (ticket.status === "used") {
      return res.status(409).json({ ok: false, reason: "duplicate" });
    }
    await supabase
      .from("tickets")
      .update({ status: "used", scanned_at: new Date().toISOString() })
      .eq("id", ticket.id);

    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ ok: false, reason: e.message });
  }
}
