@import "tailwindcss";

html,
body,
#root {
  height: 100%;
}

body {
  font-family:
    "Vazirmatn",
    ui-sans-serif,
    system-ui,
    -apple-system,
    "Segoe UI",
    Tahoma,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f8fafc;
  color: #0f172a;
}

/* Persian digits everywhere via font-feature where supported */
.tabular-nums {
  font-variant-numeric: tabular-nums;
}

/* Print-only elements: hidden on screen, shown when printing */
.print-only {
  display: none;
}

@media print {
  @page {
    size: A4;
    margin: 18mm 18mm 22mm 18mm;

    @bottom-left {
      content: "صفحه " counter(page) " از " counter(pages);
      font-family: "Vazirmatn", Tahoma, sans-serif;
      font-size: 9pt;
      color: #6b7280;
    }
  }

  .print-only {
    display: block !important;
  }

  .print-header {
    font-size: 9.5pt;
    color: #4b5563;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 6pt;
    margin-bottom: 14pt;
    letter-spacing: 0.02em;
  }

  .print-disclaimer {
    margin-top: 18pt;
    padding-top: 10pt;
    border-top: 1px solid #e5e7eb;
    font-size: 9pt;
    line-height: 1.8;
    color: #6b7280;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .print-disclaimer-title {
    font-size: 9pt;
    font-weight: 700;
    color: #4b5563;
    letter-spacing: 0.04em;
    margin-bottom: 4pt;
  }

  .print-disclaimer p {
    margin: 0;
  }

  html,
  body {
    background: #ffffff !important;
    color: #1f2937 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    font-size: 11pt;
    line-height: 1.9;
  }

  .no-print,
  button {
    display: none !important;
  }

  h1,
  h2,
  h3 {
    color: #111827 !important;
    font-weight: 700 !important;
  }

  * {
    box-shadow: none !important;
    text-shadow: none !important;
  }

  section,
  [class*="rounded-"] {
    box-shadow: none !important;
    border: 1px solid #e5e7eb !important;
  }
}
