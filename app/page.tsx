import CafeMap from "@/components/CafeMap";

export default function HomePage() {
  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "28px 18px 42px",
      }}
    >
      <header
        style={{
          marginBottom: 18,
          padding: "22px 22px 18px",
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.22)",
          background:
            "linear-gradient(130deg, rgba(255,255,255,0.26), rgba(255,255,255,0.08))",
          backdropFilter: "blur(24px) saturate(140%)",
          WebkitBackdropFilter: "blur(24px) saturate(140%)",
          boxShadow:
            "0 24px 42px rgba(6, 11, 26, 0.45), inset 0 1px 0 rgba(255,255,255,0.3)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "clamp(1.6rem, 3vw, 2.5rem)" }}>
          Belgrade Cafés — Liquid Glass Demo
        </h1>
        <p style={{ margin: "8px 0 0", opacity: 0.9 }}>
          Explore nearby cafés with a frosted, glassy interface.
        </p>
      </header>
      <CafeMap />
    </main>
  );
}
