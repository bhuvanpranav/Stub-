// /api/ticket/qr.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { privateKeyToAccount } from "viem/accounts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const ticketId = (req.query.ticketId as string) || (req.query.tokenId as string);
    if (!ticketId) return res.status(400).json({ error: "ticketId required" });

    const rotateSec = Number(process.env.QR_ROTATE_SECONDS || 300); // default 5 min
    const windowNonce = Math.floor(Date.now() / (rotateSec * 1000)); // 5-min windows

    const payload = {
      v: 1,
      ticketId,
      nonce: windowNonce,
      chain: "base-sepolia",
      ts: Date.now(),
    };

    const account = privateKeyToAccount(process.env.SIGNER_PRIVATE_KEY as `0x${string}`);
    const message = JSON.stringify(payload);
    const signature = await account.signMessage({ message });

    const blob = Buffer.from(JSON.stringify({ payload, signature })).toString("base64");
    const qr = `https://quickchart.io/qr?text=${encodeURIComponent(blob)}&size=240`;

    res.json({ qr, data: blob, expiresInSec: rotateSec });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
