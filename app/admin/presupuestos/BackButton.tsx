"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      style={{
        minHeight: "40px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px 14px",
        border: "1px solid rgba(38, 40, 42, 0.14)",
        borderRadius: "10px",
        background: "rgba(255, 253, 248, 0.96)",
        color: "var(--foreground)",
        font: "inherit",
        fontSize: "0.86rem",
        fontWeight: 800,
        cursor: "pointer",
        boxShadow: "0 5px 16px rgba(38, 40, 42, 0.07)",
      }}
    >
      ← Atrás
    </button>
  );
}
