export const techColors = {
  // Primary requested colors
  'SQL': '#0EA5E9',        // Sky Blue
  'Excel': '#22C55E',      // Green
  'Power BI': '#EAB308',   // Yellow
  'Streamlit': '#F97316',  // Orange
  'Databricks': '#EF4444', // Red
  'Python': '#A855F7',     // Purple

  // MotherDuck & DuckDB (Beige/Yellow variants)
  'DuckDB': '#FFEE58',     // Lemon Yellow
  'MotherDuck': '#FDE68A', // Beige-Yellow

  // Diverse secondary colors to avoid repetition
  'AWS': '#FF9900',        // AWS Orange
  'AWS Glue': '#FF6F00',   // Darker AWS Orange
  'S3': '#F87171',         // Soft Red
  'Athena': '#06B6D4',     // Cyan
  'Glue': '#FFB74D',       // Light Amber
  'Azure': '#3B82F6',      // Blue
  'ETL/ELT': '#F472B6',    // Pink
  'Data Marts': '#C026D3', // Darker Fuchsia
  'PySpark': '#F43F5E',    // Rose (Distinct from Databricks Red)
  'Polars': '#94A3B8',     // Lighter Slate
  'Pandas': '#60A5FA',     // Lighter Blue
  'Folium': '#14B8A6',     // Teal
  'NLP': '#4ADE80',        // Light Green
  'LLM': '#A78BFA',        // Soft Purple
  'DAX': '#CA8A04',        // Deep Gold (Distinct from Power BI)
  'GitHub': '#CBD5E1',     // Light Slate
  'GitLab': '#E24329',     // GitLab Red-Orange
  'Code Commit': '#4F46E5',// Indigo
  'Web Scraping': '#78716C',// Stone
  'Selenium': '#00B400',   // Forest Green
  'JavaScript': '#F7DF1E', // JS Yellow
  'React.js': '#61DAFB',    // React Blue
  'Three.js': '#6366F1',    // Indigo-Blue
  'Pyodide': '#3776AB',     // Python Blue
  'Word': '#42A5F5',        // Lighter Word Blue
  'PowerPoint': '#D24726',  // PowerPoint Orange-Red
  'Web Architecture': '#10B981', // Emerald
  'System Architecture': '#8B5CF6',// Violet
  'Medallion Architecture': '#D946EF', // Fuchsia
  'UI/UX': '#4F46E5',      // Indigo
  'Data Analysis': '#0891B2', // Cyan-Blue
  'KPIs': '#EC4899',       // Pink-Red
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
