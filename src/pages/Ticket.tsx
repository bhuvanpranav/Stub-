import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function Ticket() {
  const { ticketId } = useParams();
  const [qr, setQr] = useState("");

  async function refresh() {
    const r = await fetch(`/api/ticket/qr?tokenId=${ticketId}`, { cache: "no-store" });
    const { qr } = await r.json();
    setQr(qr);
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 9000);
    return () => clearInterval(id);
  }, [ticketId]);

  return (
    <div style={{ maxWidth: 380, margin: "24px auto", textAlign: "center" }}>
      <h2>Stub+ Ticket</h2>
      <img src={qr} alt="QR" style={{ width: 220, borderRadius: 12 }} />
      <p style={{ opacity: .7, fontSize: 12 }}>QR refreshes every few seconds.</p>
    </div>
  );
}
