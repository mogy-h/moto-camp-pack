"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// タブに戻ったときに、他の人の変更を取りにいく（docs/schema.md「リアルタイム更新」）。画面には何も出さない
function RefreshOnTabReturn() {
  const router = useRouter();

  useEffect(() => {
    function handleReturn() {
      // visibilitychange はタブが隠れたときにも呼ばれるので、見えているときだけ取りにいく
      if (document.visibilityState === "visible") router.refresh();
    }

    document.addEventListener("visibilitychange", handleReturn);
    window.addEventListener("focus", handleReturn);

    // 画面から消えるときに、登録を解除する
    return () => {
      document.removeEventListener("visibilitychange", handleReturn);
      window.removeEventListener("focus", handleReturn);
    };
  }, [router]);

  return null;
}

export { RefreshOnTabReturn };
