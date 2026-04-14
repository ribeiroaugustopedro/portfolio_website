export const files = {
  'README.md': {
    name: 'README.md',
    language: 'markdown',
    content: `# README - [PT] Bem-vindo / [EN] Welcome

---

## 🇧🇷 [PT-BR] Português

Esta é uma plataforma de engenharia de dados e análise integrada, projetada para simular fluxos de trabalho profissionais com foco em ecossistemas de dados modernos.

### Núcleo de Desenvolvimento (Workspace)
O Workspace permite a gestão e edição de múltiplos arquivos em tempo real:
- **Scripts Python:** Desenvolva lógica de processamento de dados usando bibliotecas padrão.
- **Consultas SQL:** Escreva e teste sintaxe SQL diretamente no ambiente.
- **Documentação e Estilo:** Edite arquivos Markdown, HTML e CSS para organizar seus projetos.

#### Execução Dinâmica
Ao pressionar o botão **RUN**, o IDE detecta automaticamente o tipo de arquivo:
- **Python (Pyodide):** O código é executado localmente via WebAssembly, permitindo testes de lógica de forma isolada.
- **SQL (High Fidelity):** Simula a execução de consultas sobre o data warehouse **MotherDuck**, retornando resultados baseados em metadados reais.
- **Arquivos Estáticos:** Para arquivos como HTML/CSS, o IDE atua como um editor de texto com destaque de sintaxe (sem execução direta).

### Explorador de Catálogo (Data Intelligence)
A barra lateral de **Catalog** oferece uma visão técnica do Warehouse:
- **Hierarquia MotherDuck:** Navegue pela estrutura de Banco de Dados > Esquema > Tabelas.
- **Inteligência de Colunas:** Visualize tipos de dados e a contagem de registros não nulos.
- **Estatísticas Avançadas:** Clique em uma coluna para auditar cardinalidade, amostragem de valores e análise de nulos.

---

## 🇺🇸 [EN-US] English

This is an integrated data engineering and analytics platform designed to simulate professional workflows with a focus on modern data ecosystems.

### Development Core (Workspace)
The Workspace allows you to manage and edit multiple files in real-time:
- **Python Scripts:** Develop data processing logic using standard libraries.
- **SQL Queries:** Write and test SQL syntax directly within the environment.
- **Documentation & Styling:** Edit Markdown, HTML, and CSS files to organize your projects.

#### Dynamic Execution
By pressing the **RUN** button, the IDE automatically detects the file type:
- **Python (Pyodide):** Code is executed locally in the browser via WebAssembly, enabling isolated logic testing.
- **SQL (High Fidelity):** Simulates query execution over the **MotherDuck** data warehouse, returning results based on real metadata.
- **Static Files:** For files like HTML/CSS, the IDE acts as a professional code editor with syntax highlighting (no direct execution).

### Catalog Explorer (Data Intelligence)
The **Catalog** sidebar provides a deep technical view of the Warehouse:
- **MotherDuck Hierarchy:** Natively navigate through the Database > Schema > Tables structure.
- **Column Intelligence:** View data types and precise non-null counts.
- **Advanced Statistics Panel:** Click a column to reveal critical audit details like cardinality, data sampling, and null analysis.`
  }
};
