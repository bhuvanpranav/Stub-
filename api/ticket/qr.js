import { privateKeyToAccount } from "viem/accounts";
export default async function handler(req, res) {
    try {
        const ticketId = req.query.ticketId;
        if (!ticketId)
            return res.status(400).json({ error: "ticketId required" });
        const rotateSec = Number(process.env.QR_ROTATE_SECONDS || 300);
        const nonce = Math.floor(Date.now() / (rotateSec * 1000));
        const payload = { v: 1, ticketId, nonce, chain: "base", ts: Date.now() };
        const account = privateKeyToAccount(process.env.SIGNER_PRIVATE_KEY);
        const signature = await account.signMessage({ message: JSON.stringify(payload) });
        const blob = Buffer.from(JSON.stringify({ payload, signature })).toString("base64");
        const qr = `https://quickchart.io/qr?text=${encodeURIComponent(blob)}&size=240`;
        res.json({ qr, data: blob, expiresInSec: rotateSec });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
