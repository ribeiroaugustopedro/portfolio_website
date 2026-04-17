export const translations = {
    pt: {
        hero: {
            titlePre: 'Transformando Dados Brutos em',
            titleHighlight: 'Inteligência de Negócios',
            description: 'Olá, sou <strong>Pedro Augusto Ribeiro</strong>, especialista em Dados dedicado à construção de pipelines ETL escaláveis e ecossistemas de BI de alto impacto.',
            ctaWork: 'Ver Projetos',
            ctaPlayground: 'Acessar Playground',
            resumeButton: 'Baixar Currículo',
            contactTitle: 'Entre em Contato'
        },
        navbar: {
            home: 'Início',
            work: 'Trabalho',
            projects: 'Projetos',
            about: 'Sobre',
            playground: 'Playground',
            themeTooltip: 'Alternar Tema',
            langTooltip: 'Alterar Idioma'
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
            summary: 'Engenheiro de Analytics Sênior com sólida expertise em arquitetura de dados, governança de BI e soluções analíticas de ponta a ponta. Especialista em Databricks, SQL e Python, utilizo o framework Medallion e Delta Lake para construir ecossistemas robustos de Business Intelligence. Atuo como ponte estratégica entre os objetivos de negócio e a engenharia, traduzindo processos complexos em modelos escaláveis e sistemas de suporte à decisão. Experiente em liderar iniciativas de padronização, estabelecer governança de KPIs e apoiar a tomada de decisão em nível executivo.',
            experiences: [
                {
                    role: 'Engenheiro de Analytics Sênior',
                    company: 'Leve Saúde',
                    period: 'Jul 2023 – Presente',
                    description: [
                        'Promovido de estagiário a sênior em curto prazo, tornando-se referência técnica e estratégica fundamental para as áreas de dados e analytics.',
                        'Liderou a reestruturação de mais de 50 dashboards no Power BI, eliminando dependências manuais (Excel/CSV) e reduzindo o esforço de manutenção em mais de 50%.',
                        'Padronizou a definição de KPIs entre diversos departamentos, aumentando a consistência e a confiabilidade dos relatórios executivos.',
                        'Projetou e implementou soluções de BI de ponta a ponta utilizando SQL e Python, garantindo total rastreabilidade e integridade dos dados.',
                        'Construiu Data Marts em SQL para áreas críticas como Vendas, Financeiro, Clínicas, CX, Cadastro e Sinistro.',
                        'Co-desenvolveu o Data Warehouse em Databricks, convertendo lógicas legadas de Oracle em modelos de dados escaláveis e de fácil manutenção.',
                        'Definiu regras de negócio e documentação técnica nas camadas Silver e Gold, contribuindo para a padronização de processos ELT e validação de pipelines.',
                        'Automatizou fluxos de trabalho complexos com Python, reduzindo drasticamente o esforço manual e o risco operacional.',
                        'Otimizou processos de ingestão e acesso a dados via AWS, aumentando a disponibilidade e reduzindo a latência das consultas.',
                        'Integrou recursos analíticos baseados em IA aos fluxos de trabalho, permitindo a geração inteligente de consultas e automação interna.',
                        'Atuou como ponte estratégica entre as áreas de negócio e engenharia, fornecendo suporte direto a Diretores, VPs e stakeholders C-level.',
                        'Liderou processos críticos de reporte, como comissões de vendas e revisões executivas de KPIs.',
                        'Mentorou analistas e promoveu as melhores práticas de governança, padronização de nomenclaturas e documentação.'
                    ]
                },
                {
                    role: 'Analista de Dados Júnior',
                    company: 'Neurovida',
                    period: 'Fev 2023 – Jul 2023',
                    description: [
                        'Traduziu regras de negócio complexas do setor de saúde para modelos de dados estruturados utilizando Excel.',
                        'Projetou frameworks de validação que garantiram a consistência de dados entre serviços, profissionais e planos de saúde.',
                        'Apoiou a estruturação e padronização de conjuntos de dados clínicos.'
                    ]
                },
                {
                    role: 'Assessor de Análise de Dados',
                    company: 'SETRANS-RJ',
                    period: 'Fev 2022 – Jan 2023',
                    description: [
                        'Desenvolveu dashboards e relatórios analíticos para os sistemas de metrô, trem, ônibus e barcas.',
                        'Liderou o redesenho do Boletim de Mobilidade Urbana, padronizando dados de múltiplas fontes (Excel/CSV).',
                        'Entregou insights analíticos estratégicos, incluindo o impacto da COVID-19 na mobilidade urbana.',
                        'Otimizou o workflow de reporte através de processos estruturados de transformação de dados.'
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
                clear: 'Limpar Saída'
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
                restarted: 'Kernel reiniciado. Pronto.',
                executedSuccess: 'Executado com sucesso (sem output).'
            },
            readmeContent: `# Analytics Playground Profissional

Bem-vindo ao meu ambiente integrado de Engenharia e Análise de Dados. Este workspace foi otimizado para simular um ecossistema real de **Data Warehouse (Modern Data Stack)**.

### Organização do Workspace
O explorador de arquivos agora segue padrões de engenharia:
- **queries/**: Protótipos de lógica analítica e transformações SQL.
- **data_science/**: Modelagem preditiva e visualizações avançadas.
- **engineering/**: Auditoria de tabelas e processamento geoespacial.

### Novos Recursos Integrados
- **Plotly & Folium**: Renderização de gráficos interativos e mapas geoespaciais diretamente no terminal.
- **MotherDuck Connection**: O IDE emula um motor DuckDB (Wasm) com suporte a inspeção de catálogos e esquemas.
- **Deep Metadata**: Clique nas colunas no painel **CATALOG** para visualizar estatísticas de distribuição.

### Execução Rápida
- Selecione qualquer arquivo e use \`Ctrl + Enter\` para executar.
- Experimente o arquivo \`engineering/warehouse_audit.py\` para uma visão completa da infraestrutura.

---
**Objetivo:** Demonstrar a ponte entre Engenharia de Dados bruta e Analytics de alto impacto.
`
        },
        footer: {
            rights: '&copy; 2026 {NAME}. Construído com Vite.'
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
            home: 'Home',
            work: 'Work',
            projects: 'Projects',
            about: 'About',
            playground: 'Playground',
            themeTooltip: 'Toggle Light/Dark Mode',
            langTooltip: 'Switch Language'
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
                restarted: 'Kernel restarted. Ready.',
                executedSuccess: 'Executed successfully (no output).'
            },
            readmeContent: `# Professional Analytics Playground

Welcome to my integrated Data Engineering and Analytics environment. This workspace is optimized to simulate a real **Data Warehouse (Modern Data Stack)** ecosystem.

### Workspace Organization
The file explorer now follows professional engineering standards:
- **queries/**: Prototypes for analytical logic and SQL transformations.
- **data_science/**: Predictive modeling and advanced visualizations.
- **engineering/**: Table auditing and geospatial processing.

### Integrated Capabilities
- **Plotly & Folium**: Interactive charts and geospatial maps rendered directly in the terminal.
- **MotherDuck Simulation**: The IDE runs a local DuckDB engine (Wasm) with support for catalog and schema auditing.
- **Deep Metadata**: Click on columns in the **CATALOG** panel to view distribution and cardinality stats.

### Quick Execution
- Select any file and press \`Ctrl + Enter\` to run.
- Try \`engineering/warehouse_audit.py\` for a full infrastructure inspection.

---
**Goal:** Demonstrate the bridge between raw Data Engineering and high-impact Analytics.
`
        },
        footer: {
            rights: '&copy; 2026 {NAME}. Built with Vite.'
        }
    }
};
