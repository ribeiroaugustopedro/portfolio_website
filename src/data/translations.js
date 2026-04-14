export const translations = {
    pt: {
        hero: {
            titlePre: 'Transformando Dados Brutos em',
            titleHighlight: 'Inteligência de Negócios',
            description: 'Olá, sou <strong>Pedro Augusto Ribeiro</strong>, um Profissional de Dados Multidisciplinar especializado na construção de pipelines ETL escaláveis e ecossistemas de BI de alto impacto.',
            ctaWork: 'Ver Meus Trabalhos',
            ctaPlayground: 'Testar Playground',
            resumeButton: 'Baixar Currículo',
            contactTitle: 'Entre em Contato'
        },
        navbar: {
            work: 'Trabalhos',
            projects: 'Projetos',
            about: 'Sobre',
            playground: 'Playground',
            themeTooltip: 'Alternar Modo Claro/Escuro',
            langTooltip: 'Alterar Idioma'
        },
        highlights: {
            title: 'Destaques'
        },
        projects: {
            title: 'Todos os Projetos',
            viewProject: 'Ver Projeto'
        },
        resume: {
            title: 'Currículo & Habilidades',
            downloadResume: 'Baixar Currículo Completo',
            summaryTitle: 'Resumo Profissional',
            experienceTitle: 'Experiência Profissional',
            educationTitle: 'Formação Acadêmica',
            skillsTitle: 'Habilidades Técnicas',
            certificationsTitle: 'Certificações',
            languagesTitle: 'Idiomas',
            summary: 'Engenheiro de Analytics Sênior com sólida expertise no desenvolvimento de plataformas de dados, governança de BI e soluções analíticas de ponta a ponta. Especializado no design de arquiteturas de dados escaláveis usando Databricks, SQL e Python, utilizando o framework medallion (bronze/silver/gold) e Delta Lake para construir ecossistemas robustos de business intelligence. Atua como ponte entre negócios e engenharia, traduzindo processos de negócio complexos em modelos de dados escaláveis e sistemas de suporte à decisão. Experiente em liderar iniciativas de padronização de BI, estabelecer governança de KPIs e apoiar a tomada de decisão em nível executivo.',
            experiences: [
                {
                    role: 'Engenheiro de Analytics Sênior',
                    company: 'Leve Saúde',
                    period: 'Jul 2023 – Presente',
                    description: [
                        'Promovido rapidamente de estagiário a cargo sênior, tornando-se referência técnica e estratégica chave em dados e analytics.',
                        'Liderou a reestruturação de mais de 50 dashboards Power BI, eliminando dependências de Excel/CSV e reduzindo o esforço de manutenção em mais de 50%.',
                        'Padronizou as definições de KPIs em múltiplos departamentos, melhorando a consistência e confiabilidade nos relatórios executivos.',
                        'Projetou e implementou soluções de BI de ponta a ponta usando SQL e Python, garantindo rastreabilidade e consistência dos dados.',
                        'Construiu e manteve data marts baseados em SQL suportando áreas de negócio fundamentais, incluindo Vendas, Financeiro, Clínicas, CX, Cadastro e Sinistro.',
                        'Co-desenvolveu um data warehouse baseado em Databricks, traduzindo lógicas legadas Oracle em modelos de dados escaláveis e sustentáveis.',
                        'Definiu regras de negócio e documentação nas camadas silver e gold, contribuindo para a padronização de ELT e validação de pipelines.',
                        'Automatizou fluxos de trabalho complexos usando Python, reduzindo significativamente o esforço manual e o risco operacional.',
                        'Melhorou a ingestão e acessibilidade de dados usando AWS (S3, Glue, Athena), aumentando a disponibilidade e reduzindo a latência de consultas.',
                        'Apoiou a integração de analytics baseados em IA nos fluxos de trabalho, permitindo geração inteligente de queries e automação interna.',
                        'Atuou como ponte entre as equipes de negócio e engenharia, apoiando Diretores, VPs e stakeholders de nível C-level.',
                        'Liderou processos críticos de reporte, incluindo comissões de vendas e revisões executivas de KPIs.',
                        'Mentorou analistas e promoveu as melhores práticas em governança de dados, convenções de nomenclatura e documentação.'
                    ]
                },
                {
                    role: 'Analista de Dados Júnior',
                    company: 'Neurovida',
                    period: 'Fev 2023 – Jul 2023',
                    description: [
                        'Traduziu regras de negócio complexas do setor de saúde em modelos de dados estruturados utilizando Excel.',
                        'Projetou frameworks de validação garantindo a consistência entre serviços, profissionais e planos de saúde.',
                        'Apoiou a estruturação e padronização de conjuntos de dados clínicos.'
                    ]
                },
                {
                    role: 'Assessor de Análise de Dados',
                    company: 'SETRANS-RJ',
                    period: 'Fev 2022 – Jan 2023',
                    description: [
                        'Desenvolveu dashboards e relatórios analíticos abrangendo os sistemas de metrô, trem, ônibus e barcas.',
                        'Liderou o redesenho do Boletim de Mobilidade Metropolitana, padronizando conjuntos de dados multi-fontes (Excel/CSV).',
                        'Entregou insights analíticos, incluindo análises de impacto da COVID-19 na mobilidade.',
                        'Melhorou os fluxos de trabalho de reporte por meio de processos estruturados de transformação de dados.'
                    ]
                },
                {
                    role: 'Estagiário de Suporte de TI',
                    company: 'Rei do Queijo',
                    period: 'Jan 2019 – Mar 2019',
                    description: [
                        'Implementou a infraestrutura de TI necessária para suportar operações de telemarketing.'
                    ]
                },
                {
                    role: 'Estagiário de CAD',
                    company: 'CASFS',
                    period: 'Fev 2018 – Mai 2018',
                    description: [
                        'Desenvolveu desenhos arquitetônicos e documentação urbana utilizando AutoCAD.'
                    ]
                }
            ],
            education: [
                {
                    degree: 'Engenharia de Produção',
                    school: 'IBMR',
                    period: '2020 – 2024'
                }
            ],
            skillCategories: [
                { name: 'Engenharia e Arquitetura', items: ['Databricks', 'SQL', 'Python', 'DuckDB', 'MotherDuck', 'Medallion Architecture'] },
                { name: 'Processamento e ETL', items: ['PySpark', 'Pandas', 'Polars', 'ETL/ELT', 'Data Marts'] },
                { name: 'Analytics e BI', items: ['Power BI', 'Excel', 'DAX', 'KPIs'] },
                { name: 'Nuvem e Infraestrutura', items: ['AWS', 'Azure', 'S3', 'Glue', 'Athena'] },
                { name: 'Automação e IA', items: ['Web Scraping', 'NLP', 'LLM'] },
                { name: 'Versionamento e Colaboração', items: ['GitHub', 'GitLab', 'Code Commit'] }
            ],
            certifications: [
                'Cientista de Dados 4.0 | Data Science Academy',
                'Lean Six Sigma Green Belt | FM2S',
                'Modelagem de Dados | CEPERJ',
                'Análise e Visualização de Dados | Alura',
                'Excel Avançado | Hashtag Treinamentos'
            ],
            languages: [
                'Português | Nativo',
                'Inglês | Avançado',
                'Espanhol | Intermediário'
            ]
        },
        playground: {
            title: 'Playground Interativo',
            launchButton: 'Launch IDE',
            windowTitle: 'pedro_augusto_ribeiro — playground',
            tooltips: {
                close: 'Fechar Playground',
                collapse: 'Minimizar',
                fullscreen: 'Tela Cheia',
                workspace: 'Espaço de Trabalho',
                catalog: 'Catálogo',
                newFile: 'Novo Arquivo',
                newFolder: 'Nova Pasta',
                refresh: 'Atualizar',
                collapseAll: 'Recolher Tudo',
                run: 'Executar (Ctrl+Enter)',
                restart: 'Reiniciar Kernel',
                clear: 'Limpar Output'
            },
            sidebars: {
                workspace: 'WORKSPACE',
                catalog: 'CATALOG'
            },
            terminal: {
                title: 'OUTPUT',
                ready: 'Pronto.',
                running: 'Executando...',
                restarting: 'Reiniciando kernel...',
                restarted: '✓ Kernel reiniciado. Pronto.',
                executedSuccess: 'Executado com sucesso (sem output).'
            },
            readmeContent: `# Bem-vindo ao Playground IDE

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
- **Estatísticas Avançadas:** Clique em uma coluna para auditar cardinalidade, amostragem de valores e análise de nulos.`
        },
        footer: {
            rights: '&copy; 2026 {NAME}. Construído com Vite & Three.js.'
        }
    },
    en: {
        hero: {
            titlePre: 'Turning Raw Data Into',
            titleHighlight: 'Business Intelligence',
            description: 'Hi, I am <strong>Pedro Augusto Ribeiro</strong>, a Multidisciplinary Data Professional specialized in building scalable ETL pipelines and high-impact BI ecosystems.',
            ctaWork: 'View My Work',
            ctaPlayground: 'Try Playground',
            resumeButton: 'Download Resume',
            contactTitle: 'Get In Touch'
        },
        navbar: {
            work: 'Work',
            projects: 'Projects',
            about: 'About',
            playground: 'Playground',
            themeTooltip: 'Toggle Light/Dark Mode',
            langTooltip: 'Switch Language'
        },
        highlights: {
            title: 'Selected Work'
        },
        projects: {
            title: 'All Projects',
            viewProject: 'View Project'
        },
        resume: {
            title: 'Resume & Skills',
            downloadResume: 'Download Full Resume',
            summaryTitle: 'Professional Summary',
            experienceTitle: 'Work Experience',
            educationTitle: 'Education',
            skillsTitle: 'Technical Skills',
            certificationsTitle: 'Certifications',
            languagesTitle: 'Languages',
            summary: 'Senior Analytics Engineer with strong expertise in data platform development, BI governance, and end-to-end analytics solutions. Specialized in designing scalable data architectures using Databricks, SQL, and Python, leveraging medallion frameworks (bronze/silver/gold) and Delta Lake to build robust business intelligence ecosystems. Acts as a bridge between business and engineering, translating complex business processes into scalable data models and decision-support systems. Experienced in leading BI standardization initiatives, establishing KPI governance, and supporting executive-level decision-making.',
            experiences: [
                {
                    role: 'Senior Analytics Engineer',
                    company: 'Leve Saúde',
                    period: 'Jul 2023 – Present',
                    description: [
                        'Rapidly promoted from intern to senior role, becoming a key technical and strategic reference in data and analytics.',
                        'Led the restructuring of 50+ Power BI dashboards, eliminating Excel/CSV dependencies and reducing maintenance effort by over 50%.',
                        'Standardized KPI definitions across multiple departments, improving consistency and reliability in executive reporting.',
                        'Designed and implemented end-to-end BI solutions using SQL and Python, ensuring data traceability and consistency.',
                        'Built and maintained SQL-based data marts supporting core business areas including Sales, Finance, Clinics, CX, Registration, and Claims.',
                        'Co-developed a Databricks-based data warehouse, translating legacy Oracle logic into scalable and maintainable data models.',
                        'Defined business rules and documentation across silver and gold layers, contributing to ELT standardization and pipeline validation.',
                        'Automated complex workflows using Python, significantly reducing manual effort and operational risk.',
                        'Improved data ingestion and accessibility using AWS (S3, Glue, Athena), increasing data availability and reducing query latency.',
                        'Supported integration of AI-driven analytics into workflows, enabling intelligent query generation and internal automation.',
                        'Acted as a bridge between business and engineering teams, supporting Directors, VPs, and C-level stakeholders.',
                        'Led critical reporting processes, including sales commissions and executive KPI reviews.',
                        'Mentored analysts and promoted best practices in data governance, naming conventions, and documentation.'
                    ]
                },
                {
                    role: 'Junior Data Analyst',
                    company: 'Neurovida',
                    period: 'Feb 2023 – Jul 2023',
                    description: [
                        'Translated complex healthcare business rules into structured data models using Excel.',
                        'Designed validation frameworks ensuring consistency across services, professionals, and insurance plans.',
                        'Supported structuring and standardization of clinical datasets.'
                    ]
                },
                {
                    role: 'Data Analysis Advisor',
                    company: 'SETRANS-RJ',
                    period: 'Feb 2022 – Jan 2023',
                    description: [
                        'Developed dashboards and analytical reports covering metro, train, bus, and ferry systems.',
                        'Led the redesign of the Metropolitan Mobility Bulletin, standardizing multi-source datasets (Excel/CSV).',
                        'Delivered analytical insights, including COVID-19 impact analysis.',
                        'Improved reporting workflows through structured data transformation processes.'
                    ]
                },
                {
                    role: 'IT Support Intern',
                    company: 'Rei do Queijo',
                    period: 'Jan 2019 – Mar 2019',
                    description: [
                        'Implemented infrastructure supporting telemarketing operations.'
                    ]
                },
                {
                    role: 'CAD Intern',
                    company: 'CASFS',
                    period: 'Feb 2018 – May 2018',
                    description: [
                        'Developed architectural drawings and urban documentation using AutoCAD.'
                    ]
                }
            ],
            education: [
                {
                    degree: 'Production Engineering',
                    school: 'IBMR',
                    period: '2020 – 2024'
                }
            ],
            skillCategories: [
                { name: 'Engineering & Architecture', items: ['Databricks', 'SQL', 'Python', 'DuckDB', 'MotherDuck', 'Medallion Architecture'] },
                { name: 'Processing & ETL', items: ['PySpark', 'Pandas', 'Polars', 'ETL/ELT', 'Data Marts'] },
                { name: 'Analytics & BI', items: ['Power BI', 'Excel', 'DAX', 'KPIs'] },
                { name: 'Cloud & Infrastructure', items: ['AWS', 'Azure', 'S3', 'Glue', 'Athena'] },
                { name: 'Automation & AI', items: ['Web Scraping', 'NLP', 'LLM'] },
                { name: 'Versioning & Collaboration', items: ['GitHub', 'GitLab', 'Code Commit'] }
            ],
            certifications: [
                'Data Science 4.0 | Data Science Academy',
                'Lean Six Sigma Green Belt | FM2S',
                'Database Modeling | CEPERJ',
                'Data Analysis & Visualization | Alura',
                'Advanced Excel | Hashtag Treinamentos'
            ],
            languages: [
                'Portuguese | Native',
                'English | Advanced',
                'Spanish | Intermediate'
            ]
        },
        playground: {
            title: 'Interactive Playground',
            launchButton: 'Launch IDE',
            windowTitle: 'pedro_augusto_ribeiro — playground',
            tooltips: {
                close: 'Close Playground',
                collapse: 'Minimize',
                fullscreen: 'Full Screen',
                workspace: 'Workspace',
                catalog: 'Catalog',
                newFile: 'New File',
                newFolder: 'New Folder',
                refresh: 'Refresh',
                collapseAll: 'Collapse All',
                run: 'Run (Ctrl+Enter)',
                restart: 'Restart Kernel',
                clear: 'Clear Output'
            },
            sidebars: {
                workspace: 'WORKSPACE',
                catalog: 'CATALOG'
            },
            terminal: {
                title: 'OUTPUT',
                ready: 'Ready.',
                running: 'Running...',
                restarting: 'Restarting kernel...',
                restarted: '✓ Kernel restarted. Ready.',
                executedSuccess: 'Executed successfully (no output).'
            },
            readmeContent: `# Welcome to the Playground IDE

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
        },
        footer: {
            rights: '&copy; 2026 {NAME}. Built with Vite & Three.js.'
        }
    }
};
