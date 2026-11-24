# Sistema A3 — Pesquisa de Satisfação do Transporte Público (Node.js + Supabase)

Projeto convertido da versão final (`A3 - final.zip`) para **Node.js + Express + Supabase (PostgreSQL)** no backend e **HTML5 + CSS3 + JavaScript** no frontend, pronto para rodar no **VS Code**.

## Estrutura do Projeto

- `sql/supabase_schema.sql` — Script SQL (PostgreSQL) para criar a tabela `avaliacoes`, índices e políticas RLS no **Supabase**.
- `src/config/supabase.js` — Cliente oficial `@supabase/supabase-js` configurado via `.env`.
- `src/data/transportData.js` — Tipos de transporte (`Metrô`, `Trem`), linhas e estações de São Paulo (`TransportData.java`).
- `src/services/intervaloMedioService.js` — Cálculo de estimativa de intervalo médio por linha (`IntervaloMedioService.java`).
- `src/dao/avaliacaoDAO.js` — Inserção no Supabase, consulta rápida do trem (última hora com fallback para histórico geral), consolidação do dashboard e exportação CSV (`AvaliacaoDAO.java` + `ExportadorDashboard.java`).
- `src/server.js` — Servidor HTTP e API REST (`A3.java`).
- `public/index.html`, `public/styles.css`, `public/app.js` — Todas as telas (`Tela_1`, `Telalogin`, `Telalocal`, `Telaintervalo`, `Teladata`, `Telaavaliacao`, `Tela_2`, `Telaconsulta`, `Telaadminlogin`, `Telaadmin`), tema claro/escuro (`AppTheme.java`) e estado global (`AppState.java`).
- `public/assets/` — Logos A3 Mobilidade usados no cabeçalho e na tela inicial, além de ícones do navegador e dispositivos Apple.

## Como configurar e rodar no VS Code

1. **Crie a tabela no Supabase:**
   - Acesse o painel do seu projeto no [Supabase](https://supabase.com/dashboard).
   - Abra **SQL Editor** -> **New query**.
   - Cole o conteúdo de `sql/supabase_schema.sql` e clique em **Run**.

2. **Configure as chaves no `.env`:**
   - No painel do Supabase, vá em **Project Settings** -> **API**.
   - Copie a **Project URL** e a chave **Publishable** (ou a antiga **anon public**). Não use uma chave **Secret** ou `service_role` neste app.
   - Cole no arquivo `.env` na raiz do projeto:
     ```env
     PORT=3000
     SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
     SUPABASE_KEY=eyJhbGciOi...
     ```

3. **Instale as dependências e inicie:**
   ```bash
   pnpm install
   pnpm start
   ```
   *(ou `npm install` e `npm start`)*

4. Acesse no navegador: **http://localhost:3000**

## Credenciais da Área do Administrador

- **E-mail:** `admin@saojudas.com`
- **Senha:** `12345678`
