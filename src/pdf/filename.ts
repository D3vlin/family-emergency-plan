const COMBINING_DIACRITICS = /[̀-ͯ]/g;

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .replace(/[/\\]/g, "-")
    .replace(/\.\.+/g, "-")
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildPdfFilename(planName: string): string {
  const slug = slugify(planName);
  if (!slug) return "plan.pdf";
  const hasPrefix = slug === "plan" || slug.startsWith("plan-");
  return hasPrefix ? `${slug}.pdf` : `plan-${slug}.pdf`;
}
