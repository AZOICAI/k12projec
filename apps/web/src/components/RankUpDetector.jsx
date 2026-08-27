"use client";

import { useEffect, useState } from "react";
import { checkRankUp, updateStoredRank } from "@/lib/xp";
import RankUpPopup from "@/components/RankUpPopup";

export default function RankUpDetector() {
  const [rankUp, setRankUp] = useState(null);

  useEffect(() => {
    void updateStoredRank();
    checkRankUp().then((r) => {
      if (r) setRankUp(r);
    });
  }, []);

  return rankUp ? <RankUpPopup rank={rankUp} onDismiss={() => setRankUp(null)} /> : null;
}