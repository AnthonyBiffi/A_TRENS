// Equivalente a AvaliacaoDAO.java + ExportadorDashboard.java usando Supabase
import fs from 'fs';
import path from 'path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'url';
import { supabase } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FALLBACK_FILE = path.join(__dirname, '../../data/avaliacoes_fallback.json');

function lerFallback() {
  try {
    if (!fs.existsSync(FALLBACK_FILE)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function gravarFallback(lista) {
  fs.mkdirSync(path.dirname(FALLBACK_FILE), { recursive: true });
  fs.writeFileSync(FALLBACK_FILE, JSON.stringify(lista, null, 2), 'utf-8');
}

function limparTexto(valor) {
  return valor == null ? '' : String(valor).trim();
}

function converterDataParaISO(dataBr) {
  const texto = limparTexto(dataBr);
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!match) {
    throw new Error('Data inválida. Use o formato dd/mm/aaaa.');
  }
  const [, dia, mes, ano] = match;
  return `${ano}-${mes}-${dia}`;
}

function converterHoraParaSQL(horaBr) {
  const texto = limparTexto(horaBr);
  if (!/^\d{2}:\d{2}$/.test(texto)) {
    throw new Error('Hora inválida. Use o formato hh:mm.');
  }
  return `${texto}:00`;
}

export function formatarDecimal(valor) {
  return Number(valor || 0).toFixed(1).replace('.', ',');
}

function formatarTimestampLegivel(isoStr) {
  if (!isoStr) return '-';
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return String(isoStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatarDataHoraBr(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatarDataHoraArquivo(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

export const AvaliacaoDAO = {
  async salvarAvaliacao({
    nome,
    cpf,
    tipoTransporte,
    linha,
    estacao,
    dataViagem,
    horaViagem,
    intervaloMedioMinutos,
    notaEspera,
    notaLotacao,
    notaQualidade,
    comentario
  }) {
    const dataIso = converterDataParaISO(dataViagem);
    const horaSql = converterHoraParaSQL(horaViagem);
    const cpfApenasDigitos = limparTexto(cpf).replace(/\D/g, '');
    const cpfAnonimizado = createHash('sha256')
      .update(cpfApenasDigitos)
      .digest('hex')
      .slice(0, 20);

    const payload = {
      nome: limparTexto(nome),
      cpf: cpfAnonimizado,
      tipo_transporte: limparTexto(tipoTransporte),
      linha: limparTexto(linha),
      estacao: limparTexto(estacao),
      data_viagem: dataIso,
      hora_viagem: horaSql,
      intervalo_medio_minutos: Number(intervaloMedioMinutos),
      nota_espera: Number(notaEspera),
      nota_lotacao: Number(notaLotacao),
      nota_qualidade: Number(notaQualidade),
      comentario: limparTexto(comentario) || null
    };

    if (supabase) {
      const { error } = await supabase
        .from('avaliacoes')
        .insert([payload]);

      if (error) {
        throw new Error(`Erro Supabase: ${error.message}`);
      }
      return { origem: 'supabase' };
    }

    // Fallback local caso o .env ainda não tenha sido preenchido
    const lista = lerFallback();
    const novo = {
      id: lista.length + 1,
      ...payload,
      criado_em: new Date().toISOString()
    };
    lista.push(novo);
    gravarFallback(lista);
    return { origem: 'fallback-local', ...novo };
  },

  async consultarIntervaloTremUltimaHora({ tipoTransporte = '', linha = '' } = {}) {
    const tipoFiltro = limparTexto(tipoTransporte);
    const linhaFiltro = limparTexto(linha);
    let registros = [];

    if (supabase) {
      let query = supabase
        .from('avaliacoes')
        .select('tipo_transporte, linha, estacao, intervalo_medio_minutos, criado_em')
        .not('intervalo_medio_minutos', 'is', null)
        .gt('intervalo_medio_minutos', 0)
        .order('criado_em', { ascending: false });

      if (tipoFiltro) query = query.eq('tipo_transporte', tipoFiltro);
      if (linhaFiltro) query = query.eq('linha', linhaFiltro);

      const { data, error } = await query;
      if (error) {
        throw new Error(`Erro Supabase: ${error.message}`);
      }
      registros = data || [];
    } else {
      registros = lerFallback().filter(
        (r) => r.intervalo_medio_minutos != null && Number(r.intervalo_medio_minutos) > 0
      );
      if (tipoFiltro) {
        registros = registros.filter(
          (r) => limparTexto(r.tipo_transporte).toLocaleLowerCase() === tipoFiltro.toLocaleLowerCase()
        );
      }
      if (linhaFiltro) {
        registros = registros.filter(
          (r) => limparTexto(r.linha).toLocaleLowerCase() === linhaFiltro.toLocaleLowerCase()
        );
      }
    }

    const agora = Date.now();
    const umaHoraMs = 60 * 60 * 1000;
    const daUltimaHora = registros.filter((r) => {
      const ts = Date.parse(String(r.criado_em));
      return !Number.isNaN(ts) && ts <= agora && agora - ts <= umaHoraMs;
    });

    const base = daUltimaHora.length > 0 ? daUltimaHora : registros;
    const escopo = daUltimaHora.length > 0 ? 'ultima_hora' : 'historico_geral';

    const grupos = new Map();
    for (const r of base) {
      const chave = `${r.tipo_transporte}||${r.linha}||${r.estacao}`;
      if (!grupos.has(chave)) {
        grupos.set(chave, {
          tipoTransporte: r.tipo_transporte,
          linha: r.linha,
          estacao: r.estacao,
          somaIntervalo: 0,
          quantidadeAvaliacoes: 0,
          ultimaAvaliacaoRaw: r.criado_em || ''
        });
      }
      const g = grupos.get(chave);
      g.somaIntervalo += Number(r.intervalo_medio_minutos);
      g.quantidadeAvaliacoes += 1;
      if (String(r.criado_em || '') > String(g.ultimaAvaliacaoRaw)) {
        g.ultimaAvaliacaoRaw = r.criado_em;
      }
    }

    const dados = Array.from(grupos.values())
      .map((g) => ({
        tipoTransporte: g.tipoTransporte,
        linha: g.linha,
        estacao: g.estacao,
        mediaIntervalo: g.somaIntervalo / g.quantidadeAvaliacoes,
        quantidadeAvaliacoes: g.quantidadeAvaliacoes,
        ultimaAvaliacao: formatarTimestampLegivel(g.ultimaAvaliacaoRaw)
      }))
      .sort((a, b) => b.mediaIntervalo - a.mediaIntervalo || b.quantidadeAvaliacoes - a.quantidadeAvaliacoes);

    return { escopo, dados };
  },

  async consultarResumoDashboard() {
    let registros = [];

    if (supabase) {
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('tipo_transporte, linha, estacao, intervalo_medio_minutos, nota_espera, nota_lotacao, nota_qualidade');

      if (error) {
        throw new Error(`Erro Supabase: ${error.message}`);
      }
      registros = data || [];
    } else {
      registros = lerFallback();
    }

    const grupos = new Map();
    for (const r of registros) {
      const chave = `${r.tipo_transporte}||${r.linha}||${r.estacao}`;
      if (!grupos.has(chave)) {
        grupos.set(chave, {
          tipoTransporte: r.tipo_transporte,
          linha: r.linha,
          estacao: r.estacao,
          somaIntervalo: 0,
          qtdIntervalo: 0,
          somaEspera: 0,
          somaLotacao: 0,
          somaQualidade: 0,
          quantidadeAvaliacoes: 0
        });
      }
      const g = grupos.get(chave);
      if (r.intervalo_medio_minutos != null) {
        g.somaIntervalo += Number(r.intervalo_medio_minutos);
        g.qtdIntervalo += 1;
      }
      g.somaEspera += Number(r.nota_espera || 0);
      g.somaLotacao += Number(r.nota_lotacao || 0);
      g.somaQualidade += Number(r.nota_qualidade || 0);
      g.quantidadeAvaliacoes += 1;
    }

    return Array.from(grupos.values())
      .map((g) => ({
        tipoTransporte: g.tipoTransporte,
        linha: g.linha,
        estacao: g.estacao,
        mediaIntervalo: g.qtdIntervalo ? g.somaIntervalo / g.qtdIntervalo : 0,
        quantidadeIntervalos: g.qtdIntervalo,
        mediaEspera: g.somaEspera / g.quantidadeAvaliacoes,
        mediaLotacao: g.somaLotacao / g.quantidadeAvaliacoes,
        mediaQualidade: g.somaQualidade / g.quantidadeAvaliacoes,
        quantidadeAvaliacoes: g.quantidadeAvaliacoes
      }))
      .sort((a, b) =>
        `${a.tipoTransporte}|${a.linha}|${a.estacao}`.localeCompare(
          `${b.tipoTransporte}|${b.linha}|${b.estacao}`,
          'pt-BR'
        )
      );
  },

  async gerarCsvDashboard() {
    const dados = await this.consultarResumoDashboard();
    const csvField = (valor) => {
      if (valor == null) return '';
      const limpo = String(valor).replace(/"/g, '""');
      if (limpo.includes(';') || limpo.includes('\n') || limpo.includes('"')) {
        return `"${limpo}"`;
      }
      return limpo;
    };

    const linhas = [
      'Dashboard de avaliacoes de transporte',
      `Gerado em;${formatarDataHoraBr(new Date())}`,
      '',
      'Transporte;Linha;Estacao;Media intervalo minutos;Media nota espera;Media nota lotacao;Media nota qualidade;Quantidade avaliacoes'
    ];

    for (const r of dados) {
      linhas.push(
        [
          csvField(r.tipoTransporte),
          csvField(r.linha),
          csvField(r.estacao),
          formatarDecimal(r.mediaIntervalo),
          formatarDecimal(r.mediaEspera),
          formatarDecimal(r.mediaLotacao),
          formatarDecimal(r.mediaQualidade),
          r.quantidadeAvaliacoes
        ].join(';')
      );
    }

    const nomeArquivo = `dashboard_avaliacoes_transporte_${formatarDataHoraArquivo(new Date())}.csv`;
    return {
      nomeArquivo,
      conteudo: '\uFEFF' + linhas.join('\n') + '\n'
    };
  }
};
