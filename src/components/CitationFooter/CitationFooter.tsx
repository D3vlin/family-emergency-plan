import { Z_INDEX } from "@constants/theme";

export default function CitationFooter() {
  return (
    <footer
      className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-background px-4 py-2 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400"
      style={{ zIndex: Z_INDEX.citationFooter }}
    >
      <p>
        Basado en el{" "}
        <a
          href="https://portal.gestiondelriesgo.gov.co/simulacro/Documents/FORMATO-PLAN-FAMILIAR.pdf"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Formato Plan Familiar
        </a>{" "}
        de la UNGRD.
      </p>
    </footer>
  );
}
