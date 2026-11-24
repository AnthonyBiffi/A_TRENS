// Equivalente a A3.java + API REST integrada ao Supabase
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { verificarConexaoSupabase, isSupabaseConectado } from './config/supabase.js';
import { SELECIONE, LINHAS_POR_TIPO, ESTACOES_POR_LINHA } from './data/transportData.js';
import { calcularMinutos, montarTextoEstimativa } from './services/intervaloMedioService.js';
import { AvaliacaoDAO } from './dao/avaliacaoDAO.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Credenciais oficiais de Telaadminlogin.java
const EMAIL_ADMIN = 'admin@saojudas.com';
const SENHA_ADMIN = '12345678';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Status da conexão Supabase e dados base de transporte (TransportData.java)
app.get('/api/transport-data', (_req, res) => {
  res.json({
    selecione: SELECIONE,
    linhasPorTipo: LINHAS_POR_TIPO,
    estacoesPorLinha: ESTACOES_POR_LINHA,
    supabaseConectado: isSupabaseConectado()
  });
});

// Estimativa de intervalo médio (IntervaloMedioService.java)
app.get('/api/intervalo-estimado', (req, res) => {
  const { tipoTransporte, linha } = req.query;
  const minutos = calcularMinutos(String(tipoTransporte || ''), String(linha || ''));
  const texto = montarTextoEstimativa(String(tipoTransporte || ''), String(linha || ''));
  res.json({ minutos, texto });
});

// Salvar avaliação completa no Supabase (Tela_2.java -> AvaliacaoDAO.salvarEstadoAtual)
app.post('/api/avaliacoes', async (req, res) => {
  try {
    const salvo = await AvaliacaoDAO.salvarAvaliacao(req.body);
    res.status(201).json({
      mensagem: 'Pesquisa salva no banco de dados com sucesso!',
      registro: salvo
    });
  } catch (err) {
    res.status(400).json({
      erro: err.message || 'Não foi possível salvar a avaliação.'
    });
  }
});

// Consulta rápida do trem (Telaconsulta.java -> AvaliacaoDAO.consultarIntervaloTremUltimaHora)
app.get('/api/consulta-trem', async (_req, res) => {
  try {
    const resultado = await AvaliacaoDAO.consultarIntervaloTremUltimaHora();
    res.json(resultado);
  } catch (err) {
    res.status(500).json({
      erro: 'Não foi possível consultar os dados: ' + err.message
    });
  }
});

// Login administrador (Telaadminlogin.java)
app.post('/api/admin/login', (req, res) => {
  const email = String(req.body?.email || '').trim();
  const senha = String(req.body?.senha || '');

  if (email.toLowerCase() === EMAIL_ADMIN && senha === SENHA_ADMIN) {
    return res.json({ autenticado: true, email: EMAIL_ADMIN });
  }

  return res.status(401).json({
    autenticado: false,
    erro: 'Email ou senha de administrador inválidos.'
  });
});

// Dashboard consolidado do administrador (Telaadmin.java)
app.get('/api/admin/dashboard', async (_req, res) => {
  try {
    const dados = await AvaliacaoDAO.consultarResumoDashboard();
    res.json({ dados });
  } catch (err) {
    res.status(500).json({
      erro: 'Não foi possível consultar o dashboard: ' + err.message
    });
  }
});

// Exportação CSV do dashboard (ExportadorDashboard.java)
app.get('/api/admin/exportar-csv', async (_req, res) => {
  try {
    const { nomeArquivo, conteudo } = await AvaliacaoDAO.gerarCsvDashboard();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.send(conteudo);
  } catch (err) {
    res.status(500).json({
      erro: 'Não foi possível exportar o CSV: ' + err.message
    });
  }
});

app.listen(PORT, async () => {
  await verificarConexaoSupabase();
  console.log(`[Sistema A3] Servidor rodando em http://localhost:${PORT}`);
});
