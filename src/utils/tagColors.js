export const techColors = {
  // Primary requested colors
  'SQL': '#0EA5E9',        // Sky Blue
  'Excel': '#22C55E',      // Green
  'Power BI': '#EAB308',   // Yellow
  'Streamlit': '#F97316',  // Orange
  'Databricks': '#EF4444', // Red
  'Python': '#A855F7',     // Purple

  // Diverse secondary colors to avoid repetition
  'AWS': '#14B8A6',        // Teal
  'AWS Glue': '#14B8A6',   
  'S3': '#06B6D4',         // Cyan
  'Athena': '#06B6D4',
  'Glue': '#14B8A6',
  'ETL': '#D946EF',        // Fuchsia
  'Data Marts': '#C026D3', // Darker Fuchsia
  'PySpark': '#F43F5E',    // Rose
  'Polars': '#6366F1',     // Indigo
  'Pandas': '#EC4899',     // Pink
  'Folium': '#8B5CF6',     // Violet
  'NLP': '#F87171',        // Soft Red (Careful with Databricks)
  'LLM': '#FB923C',        // Soft Orange (Careful with Streamlit)
  'DAX': '#CA8A04',        // Deep Yellow
  'GitHub': '#64748B',     // Slate
  'GitLab': '#475569',     // Dark Slate
  'Code Commit': '#3B82F6',// Blue
  'Web Scraping': '#57534E',// Stone
  'Selenium': '#78716C',   // Stone
  'default': '#94a3b8'
};

export function getTagStyle(tag) {
  const color = techColors[tag] || techColors.default;
  return {
    color: color,
    border: `1px solid ${color}44`,
    background: `${color}10`,
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '0.75rem',
    fontWeight: '600',
    fontFamily: 'var(--font-mono)'
  };
}
