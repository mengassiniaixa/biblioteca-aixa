import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-paper-edge bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 py-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:px-6">
        <p>
          <span className="font-semibold text-ink">Sistema de biblioteca</span>{" "}
          · Proyecto académico de Aixa Mengassini.
        </p>
        <a
          href="https://github.com/mengassiniaixa/biblioteca-aixa"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-paper-mid hover:text-ink"
        >
          <Github size={14} /> Ver en GitHub
        </a>
      </div>
    </footer>
  );
}
