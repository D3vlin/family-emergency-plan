export const THEME = {
  colors: {
    primary: "#16424A",
    accent: "#F2A71B",
    success: "#2ECC71",
    error: "#E74C3C",
    background: "#F7F9FA",
    text: "#1F2D2F",
  },
  fontFamily: "Inter, system-ui, sans-serif",
  fontFamilyDisplay: "'Fraunces', Georgia, serif",
  spacing: [4, 8, 16, 24, 32] as const,
} as const;

export const Z_INDEX = {
  content: 0,
  progressBar: 10,
  citationFooter: 20,
  modalBackdrop: 30,
  modalContent: 40,
  globalControls: 50,
} as const;
