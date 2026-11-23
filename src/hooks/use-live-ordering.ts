import { useEffect, useState } from "react";
import { LIVE_ORDER_START_MS } from "@/lib/campaign";

/** False until the live-ordering date, then true; flips by itself at that moment. */
export function useLiveOrdering() {
  const [live, setLive] = useState(() => Date.now() >= LIVE_ORDER_START_MS);
  useEffect(() => {
    const wait = LIVE_ORDER_START_MS - Date.now();
    if (wait <= 0) {
      setLive(true);
      return;
    }
    const id = window.setTimeout(() => setLive(true), Math.min(wait, 2 ** 31 - 1));
    return () => window.clearTimeout(id);
  }, []);
  return live;
}
