import { Link } from "wouter";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#050706" }}
    >
      <div className="text-center">
        <h1 style={{ fontSize: "48px", fontWeight: 700, color: "#B6FF00", margin: 0 }}>404</h1>
        <p style={{ color: "#c2caad", fontSize: "16px", marginTop: "12px" }}>Página não encontrada</p>
        <Link href="/">
          <a
            className="inline-block mt-6 px-5 py-2.5 rounded-lg font-bold"
            style={{ background: "#B6FF00", color: "#050706", textDecoration: "none", fontSize: "14px" }}
          >
            Voltar ao Início
          </a>
        </Link>
      </div>
    </div>
  );
}
