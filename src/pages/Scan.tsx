import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

export default function Scan() {
  const [msg, setMsg] = useState("Point camera at the ticket QR…");
  const [ok, setOk] = useState<boolean | null>(null);
  const qrRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const elementId = "reader";
    const html5QrCode = new Html5Qrcode(elementId);
    qrRef.current = html5QrCode;

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    const onSuccess = async (decodedText: string) => {
      try {
        const res = await fetch("/api/scan/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrData: decodedText }),
        });
        const data = await res.json();
        setOk(data.ok);
        setMsg(data.ok ? "✅ Valid ticket" : `❌ ${data.reason || "Invalid"}`);
      } catch {
        setOk(false);
        setMsg("❌ Network error");
      }
    };

    const onError = (_errMsg: string) => {
      // optional: console.debug(_errMsg);
    };

    // run start() with try/await instead of .catch()
    (async () => {
      try {
        await html5QrCode.start({ facingMode: "environment" }, config, onSuccess, onError);
      } catch {
        setOk(false);
        setMsg("❌ Camera permission denied or unavailable");
      }
    })();

    // cleanup without chaining .catch()
    return () => {
      const inst = qrRef.current;
      if (!inst) return;

      const state = (inst.getState?.() as Html5QrcodeScannerState | undefined);
      const stopThenClear = async () => {
        try {
          // stop only if scanning/paused; clear view afterward
          if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
            await (inst.stop() as unknown as Promise<void>);
          }
          await (inst.clear() as unknown as Promise<void>);
        } catch {
          /* ignore */
        }
      };
      void stopThenClear();
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", padding: 16, color: "white", background: ok == null ? "#0f172a" : ok ? "#16a34a" : "#dc2626" }}>
      <h2>Stub+ Scanner</h2>
      <div id="reader" style={{ marginTop: 16, background: "rgba(0,0,0,.3)", height: 320 }} />
      <p style={{ marginTop: 16, fontSize: 18 }}>{msg}</p>
    </div>
  );
}
