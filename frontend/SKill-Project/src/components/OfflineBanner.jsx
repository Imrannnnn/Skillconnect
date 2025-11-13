import { useEffect, useState } from "react";
import { NetBus } from "../api/axios.js";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsub = NetBus.subscribe((s) => {
      if (typeof s?.offline === "boolean") setOffline(s.offline);
    });
    return unsub;
  }, []);

  if (!offline) return null;

  return (
    <div className="w-full bg-rose-600 text-white text-sm text-center py-2">
      Backend offline. Trying to reconnect…
    </div>
  );
}
