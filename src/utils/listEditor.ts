export function newId(): string {
  return Math.random().toString(36).slice(2);
}

export function getAddDisabledTitle(isEditorOpen: boolean, isAtLimit: boolean, limitLabel: string): string | undefined {
  if (isEditorOpen) return "Guardá o cancelá la edición actual antes de continuar.";
  if (isAtLimit) return `Llegaste al límite de ${limitLabel}`;
  return undefined;
}
