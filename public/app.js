// Estado global equivalente a AppState.java
const AppState = {
  nome: '',
  cpf: '',
  tipoTransporte: '',
  linha: '',
  estacao: '',
  intervaloMedioMinutos: -1,
  data: '',
  hora: '',
  espera: 3,
  lotacao: 3,
  qualidade: 3,
  comentario: '',
  darkMode: true,
  transportData: {
    selecione: 'Selecione',
    linhasPorTipo: {},
    estacoesPorLinha: {}
  }
};

const SCREEN_META = {
  'screen-tela1': {
    title: 'Início - Pesquisa de Satisfação',
    step: 'Etapa 1 de 7',
    subtitle: 'Pesquisa rápida para entender a experiência dos passageiros.'
  },
  'screen-login': {
    title: 'Cadastro - Pesquisa de Satisfação',
    step: 'Etapa 2 de 7',
    subtitle: 'Informe seus dados para iniciar o registro da avaliação.'
  },
  'screen-local': {
    title: 'Local - Pesquisa de Satisfação',
    step: 'Etapa 3 de 7',
    subtitle: 'Selecione o transporte, a linha e a estação utilizada.'
  },
  'screen-intervalo': {
    title: 'Intervalo médio - Pesquisa de Satisfação',
    step: 'Etapa 4 de 7',
    subtitle: 'Informe em minutos quanto tempo o transporte demora para passar.'
  },
  'screen-data': {
    title: 'Data e hora - Pesquisa de Satisfação',
    step: 'Etapa 5 de 7',
    subtitle: 'Informe quando a viagem aconteceu.'
  },
  'screen-avaliacao': {
    title: 'Avaliação - Pesquisa de Satisfação',
    step: 'Etapa 6 de 7',
    subtitle: 'Dê notas de 0 a 5 para os principais pontos da experiência.'
  },
  'screen-finalizacao': {
    title: 'Finalização - Pesquisa de Satisfação',
    step: 'Etapa 7 de 7',
    subtitle: 'Deixe um comentário opcional e conclua a pesquisa.'
  },
  'screen-consulta': {
    title: 'Consulta rápida - Intervalo do trem',
    step: 'Consulta rápida',
    subtitle: 'Veja a média de intervalo dos trens com base nas avaliações registradas.'
  },
  'screen-admin-login': {
    title: 'Login administrador',
    step: 'Administrador',
    subtitle: 'Acesso restrito para exportar o dashboard das avaliações.'
  },
  'screen-admin-dashboard': {
    title: 'Admin - Dashboard',
    step: 'Dashboard administrativo',
    subtitle: 'Área restrita para visualizar dados consolidados e exportar para Excel.'
  }
};

const SCREEN_PROGRESS = {
  'screen-tela1': 1,
  'screen-login': 2,
  'screen-local': 3,
  'screen-intervalo': 4,
  'screen-data': 5,
  'screen-avaliacao': 6,
  'screen-finalizacao': 7
};

// Diálogo equivalente a JOptionPane.showMessageDialog
function showDialog(message, title = 'Atenção') {
  document.getElementById('dialog-title').textContent = title;
  document.getElementById('dialog-message').textContent = message;
  document.getElementById('dialog-backdrop').classList.remove('hidden');
}

document.getElementById('dialog-ok').addEventListener('click', () => {
  document.getElementById('dialog-backdrop').classList.add('hidden');
});

// Navegação entre telas
function goToScreen(screenId) {
  document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');

  const progresso = SCREEN_PROGRESS[screenId];
  const painelProgresso = document.getElementById('header-progress');
  painelProgresso.hidden = progresso === undefined;
  document.querySelector('.app-card').dataset.layout =
    screenId === 'screen-consulta' || screenId === 'screen-admin-dashboard' ? 'wide' : 'form';

  if (progresso !== undefined) {
    const porcentagem = Math.round((progresso / 7) * 100);
    document.getElementById('header-step').textContent = `Etapa ${progresso} de 7`;
    document.getElementById('progress-value').textContent = `${porcentagem}%`;
    document.getElementById('progress-fill').style.width = `${porcentagem}%`;
    document.getElementById('progress-track').setAttribute('aria-valuenow', String(progresso));
  }

  const meta = SCREEN_META[screenId];
  if (meta) {
    document.title = meta.title;
    document.getElementById('header-subtitle').textContent = meta.subtitle;
  }

  if (screenId === 'screen-intervalo') prepararTelaIntervalo();
  if (screenId === 'screen-data') prepararTelaData();
  if (screenId === 'screen-finalizacao') prepararTelaFinalizacao();
  if (screenId === 'screen-consulta') carregarConsultaTrem();
  if (screenId === 'screen-admin-dashboard') carregarDashboardAdmin();
}

document.querySelectorAll('[data-go]').forEach((btn) => {
  btn.addEventListener('click', () => goToScreen(btn.dataset.go));
});

function aplicarTema() {
  document.documentElement.setAttribute('data-theme', AppState.darkMode ? 'dark' : 'light');
  document.getElementById('hero-logo').src = AppState.darkMode
    ? 'assets/logo-a3-mobilidade.png'
    : 'assets/logo-a3-mobilidade-fundo-escuro.png';
  document.querySelector('.theme-icon').textContent = AppState.darkMode ? '☀' : '☾';
  document.querySelector('.theme-label').textContent = AppState.darkMode ? 'Tema claro' : 'Tema escuro';
  document.getElementById('btn-toggle-theme').setAttribute(
    'aria-label',
    `Ativar tema ${AppState.darkMode ? 'claro' : 'escuro'}`
  );
}

// Alternância de tema claro/escuro (AppTheme.java)
document.getElementById('btn-toggle-theme').addEventListener('click', () => {
  AppState.darkMode = !AppState.darkMode;
  aplicarTema();
});
aplicarTema();

// Inicializar TransportData do servidor e atualizar status Supabase
async function carregarTransportData() {
  const res = await fetch('/api/transport-data');
  AppState.transportData = await res.json();

  const dbBadge = document.getElementById('db-status-badge');
  if (AppState.transportData.supabaseConectado) {
    dbBadge.textContent = 'Supabase: Conectado';
    dbBadge.classList.add('online');
  } else {
    dbBadge.textContent = 'Supabase: Configure o .env';
    dbBadge.classList.remove('online');
  }

  const tipoSelect = document.getElementById('select-tipo');
  const tipos = Object.keys(AppState.transportData.linhasPorTipo);
  tipoSelect.innerHTML = [AppState.transportData.selecione, ...tipos]
    .map((item) => `<option value="${item}">${item}</option>`)
    .join('');

  atualizarLinhas();
}

function atualizarLinhas() {
  const tipo = document.getElementById('select-tipo').value;
  const linhas = AppState.transportData.linhasPorTipo[tipo] || [];
  const linhaSelect = document.getElementById('select-linha');
  linhaSelect.innerHTML = [AppState.transportData.selecione, ...linhas]
    .map((item) => `<option value="${item}">${item}</option>`)
    .join('');
  atualizarEstacoes();
}

function atualizarEstacoes() {
  const linha = document.getElementById('select-linha').value;
  const estacoes = AppState.transportData.estacoesPorLinha[linha] || [];
  const estacaoSelect = document.getElementById('select-estacao');
  estacaoSelect.innerHTML = [AppState.transportData.selecione, ...estacoes]
    .map((item) => `<option value="${item}">${item}</option>`)
    .join('');
}

document.getElementById('select-tipo').addEventListener('change', atualizarLinhas);
document.getElementById('select-linha').addEventListener('change', atualizarEstacoes);

// Tela 1
document.getElementById('btn-iniciar-avaliacao').addEventListener('click', () => goToScreen('screen-login'));
document.getElementById('btn-abrir-consulta').addEventListener('click', () => goToScreen('screen-consulta'));
document.getElementById('btn-abrir-admin-login').addEventListener('click', () => goToScreen('screen-admin-login'));

// Tela Login (Nome + CPF somente números, 11 dígitos)
const cpfInput = document.getElementById('input-cpf');
cpfInput.addEventListener('input', () => {
  cpfInput.value = cpfInput.value.replace(/\D/g, '').slice(0, 11);
});

document.getElementById('btn-login-continuar').addEventListener('click', () => {
  const nome = document.getElementById('input-nome').value.trim();
  const cpf = cpfInput.value.trim();

  if (nome.length < 3) {
    showDialog('Informe um nome válido.');
    return;
  }
  if (cpf.length !== 11) {
    showDialog('Informe um CPF com 11 números.');
    return;
  }

  AppState.nome = nome;
  AppState.cpf = cpf;
  goToScreen('screen-local');
});

// Tela Local
document.getElementById('btn-local-continuar').addEventListener('click', () => {
  const sel = AppState.transportData.selecione;
  const tipo = document.getElementById('select-tipo').value;
  const linha = document.getElementById('select-linha').value;
  const estacao = document.getElementById('select-estacao').value;

  if (tipo === sel || linha === sel || estacao === sel) {
    showDialog('Selecione transporte, linha e estação.');
    return;
  }

  AppState.tipoTransporte = tipo;
  AppState.linha = linha;
  AppState.estacao = estacao;
  goToScreen('screen-intervalo');
});

// Tela Intervalo
const intervaloInput = document.getElementById('input-intervalo');
intervaloInput.addEventListener('input', () => {
  intervaloInput.value = intervaloInput.value.replace(/\D/g, '');
});

async function prepararTelaIntervalo() {
  document.getElementById('lbl-int-transporte').textContent = AppState.tipoTransporte || '-';
  document.getElementById('lbl-int-linha').textContent = AppState.linha || '-';
  document.getElementById('lbl-int-estacao').textContent = AppState.estacao || '-';

  const params = new URLSearchParams({
    tipoTransporte: AppState.tipoTransporte,
    linha: AppState.linha
  });
  const res = await fetch(`/api/intervalo-estimado?${params.toString()}`);
  const data = await res.json();
  document.getElementById('lbl-int-estimativa').textContent = data.texto;

  if (AppState.intervaloMedioMinutos > 0) {
    intervaloInput.value = String(AppState.intervaloMedioMinutos);
  }
}

document.getElementById('btn-intervalo-continuar').addEventListener('click', () => {
  const texto = intervaloInput.value.trim();
  if (!texto) {
    showDialog('Informe o tempo em minutos.');
    intervaloInput.focus();
    return;
  }
  const minutos = Number.parseInt(texto, 10);
  if (Number.isNaN(minutos) || minutos <= 0) {
    showDialog('O tempo precisa ser maior que zero.');
    intervaloInput.focus();
    return;
  }

  AppState.intervaloMedioMinutos = minutos;
  goToScreen('screen-data');
});

// Tela Data
function prepararTelaData() {
  const dataEl = document.getElementById('input-data');
  const horaEl = document.getElementById('input-hora');
  const agora = new Date();
  const pad = (n) => String(n).padStart(2, '0');

  if (!dataEl.value) {
    dataEl.value = `${pad(agora.getDate())}/${pad(agora.getMonth() + 1)}/${agora.getFullYear()}`;
  }
  if (!horaEl.value) {
    horaEl.value = `${pad(agora.getHours())}:${pad(agora.getMinutes())}`;
  }
}

document.getElementById('btn-data-continuar').addEventListener('click', () => {
  const data = document.getElementById('input-data').value.trim();
  const hora = document.getElementById('input-hora').value.trim();

  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
    showDialog('Informe a data no formato dd/mm/aaaa.');
    return;
  }
  if (!/^\d{2}:\d{2}$/.test(hora)) {
    showDialog('Informe a hora no formato hh:mm.');
    return;
  }

  AppState.data = data;
  AppState.hora = hora;
  goToScreen('screen-avaliacao');
});

function atualizarIndicadorAvaliacao(campo) {
  const valor = Number(document.getElementById(`slider-${campo}`).value);
  const statusEl = document.getElementById(`status-${campo}`);
  const status = valor <= 1
    ? { texto: 'Ruim', nivel: 'poor' }
    : valor <= 3
      ? { texto: 'Regular', nivel: 'regular' }
      : valor === 4
        ? { texto: 'Bom', nivel: 'good' }
        : { texto: 'Excelente', nivel: 'excellent' };

  document.getElementById(`val-${campo}`).textContent = String(valor);
  statusEl.textContent = status.texto;
  statusEl.dataset.level = status.nivel;
  document.getElementById(`slider-${campo}`).setAttribute(
    'aria-valuetext',
    `${valor} de 5, ${status.texto}`
  );
}

// Tela Avaliação (Sliders 0 a 5)
['espera', 'lotacao', 'qualidade'].forEach((campo) => {
  const slider = document.getElementById(`slider-${campo}`);
  slider.addEventListener('input', () => {
    atualizarIndicadorAvaliacao(campo);
  });
  atualizarIndicadorAvaliacao(campo);
});

document.getElementById('btn-avaliacao-continuar').addEventListener('click', () => {
  AppState.espera = Number(document.getElementById('slider-espera').value);
  AppState.lotacao = Number(document.getElementById('slider-lotacao').value);
  AppState.qualidade = Number(document.getElementById('slider-qualidade').value);
  goToScreen('screen-finalizacao');
});

// Tela 2 (Finalização + Resumo)
function prepararTelaFinalizacao() {
  const v = (val) => (!val || !String(val).trim() ? '-' : val);
  const intervaloTxt =
    AppState.intervaloMedioMinutos > 0 ? `${AppState.intervaloMedioMinutos} minutos` : '-';

  document.getElementById('resumo-avaliacao').value = [
    'Resumo da avaliação',
    `Nome: ${v(AppState.nome)}`,
    `Transporte: ${v(AppState.tipoTransporte)}`,
    `Linha: ${v(AppState.linha)}`,
    `Estação: ${v(AppState.estacao)}`,
    `Intervalo médio estimado: ${intervaloTxt}`,
    `Data/Hora: ${v(AppState.data)} ${v(AppState.hora)}`,
    `Tempo de espera: ${AppState.espera}/5`,
    `Lotação: ${AppState.lotacao}/5`,
    `Qualidade geral: ${AppState.qualidade}/5`
  ].join('\n');
}

function limparEstado() {
  AppState.nome = '';
  AppState.cpf = '';
  AppState.tipoTransporte = '';
  AppState.linha = '';
  AppState.estacao = '';
  AppState.intervaloMedioMinutos = -1;
  AppState.data = '';
  AppState.hora = '';
  AppState.espera = 3;
  AppState.lotacao = 3;
  AppState.qualidade = 3;
  AppState.comentario = '';

  document.getElementById('input-nome').value = '';
  document.getElementById('input-cpf').value = '';
  document.getElementById('select-tipo').value = AppState.transportData.selecione;
  atualizarLinhas();
  document.getElementById('input-intervalo').value = '';
  document.getElementById('input-data').value = '';
  document.getElementById('input-hora').value = '';
  document.getElementById('input-comentario').value = '';

  ['espera', 'lotacao', 'qualidade'].forEach((campo) => {
    document.getElementById(`slider-${campo}`).value = '3';
    atualizarIndicadorAvaliacao(campo);
  });
}

document.getElementById('btn-concluir').addEventListener('click', async () => {
  AppState.comentario = document.getElementById('input-comentario').value.trim();

  try {
    const res = await fetch('/api/avaliacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: AppState.nome,
        cpf: AppState.cpf,
        tipoTransporte: AppState.tipoTransporte,
        linha: AppState.linha,
        estacao: AppState.estacao,
        dataViagem: AppState.data,
        horaViagem: AppState.hora,
        intervaloMedioMinutos: AppState.intervaloMedioMinutos,
        notaEspera: AppState.espera,
        notaLotacao: AppState.lotacao,
        notaQualidade: AppState.qualidade,
        comentario: AppState.comentario
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.erro || 'Erro ao salvar.');
    }

    showDialog('Pesquisa salva no Supabase com sucesso!', 'Concluído');
    limparEstado();
    goToScreen('screen-tela1');
  } catch (err) {
    showDialog(`Não foi possível salvar no banco de dados.\n\nErro técnico: ${err.message}`, 'Erro ao salvar');
  }
});

// Consulta rápida do trem (Telaconsulta.java)
function formatarBrDecimal(valor) {
  return Number(valor || 0).toFixed(1).replace('.', ',');
}

async function carregarConsultaTrem() {
  const resumoEl = document.getElementById('consulta-resumo');
  const tbody = document.getElementById('tbody-consulta');
  resumoEl.textContent = 'Carregando dados...';
  tbody.innerHTML = '';

  try {
    const res = await fetch('/api/consulta-trem');
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.erro || 'Erro na consulta.');
    }
    const dados = json.dados || [];

    if (!dados.length) {
      resumoEl.textContent =
        'Nenhuma avaliação de trem encontrada no banco. Faça pelo menos uma avaliação de Trem e salve antes de consultar.';
      return;
    }

    let totalAvaliacoes = 0;
    let somaPonderada = 0;

    for (const r of dados) {
      totalAvaliacoes += r.quantidadeAvaliacoes;
      somaPonderada += r.mediaIntervalo * r.quantidadeAvaliacoes;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.tipoTransporte}</td>
        <td>${r.linha}</td>
        <td>${r.estacao}</td>
        <td><span class="metric-badge">${formatarBrDecimal(r.mediaIntervalo)} min</span></td>
        <td><span class="count-badge">${r.quantidadeAvaliacoes}</span></td>
        <td>${r.ultimaAvaliacao || '-'}</td>
      `;
      tbody.appendChild(tr);
    }

    const mediaGeral = somaPonderada / totalAvaliacoes;
    resumoEl.textContent = `Média geral dos dados encontrados: ${formatarBrDecimal(mediaGeral)} minutos | Avaliações usadas: ${totalAvaliacoes}`;
  } catch (err) {
    resumoEl.textContent = 'Erro ao consultar o banco.';
    showDialog(`Não foi possível consultar o banco de dados.\n\nErro técnico: ${err.message}`, 'Erro na consulta');
  }
}

document.getElementById('btn-atualizar-consulta').addEventListener('click', carregarConsultaTrem);

// Login Administrador (Telaadminlogin.java)
async function validarLoginAdmin() {
  const email = document.getElementById('input-admin-email').value.trim();
  const senha = document.getElementById('input-admin-senha').value;

  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha })
  });

  if (res.ok) {
    document.getElementById('input-admin-senha').value = '';
    goToScreen('screen-admin-dashboard');
    return;
  }

  showDialog('Email ou senha de administrador inválidos.', 'Acesso negado');
  document.getElementById('input-admin-senha').value = '';
  document.getElementById('input-admin-senha').focus();
}

document.getElementById('btn-admin-entrar').addEventListener('click', validarLoginAdmin);
document.getElementById('input-admin-senha').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') validarLoginAdmin();
});

// Dashboard Admin (Telaadmin.java + ExportadorDashboard.java)
async function carregarDashboardAdmin() {
  const resumoEl = document.getElementById('admin-resumo');
  const tbody = document.getElementById('tbody-admin');
  resumoEl.textContent = 'Carregando dados...';
  tbody.innerHTML = '';

  try {
    const res = await fetch('/api/admin/dashboard');
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.erro || 'Erro no dashboard.');
    }
    const dados = json.dados || [];

    if (!dados.length) {
      resumoEl.textContent = 'Nenhuma avaliação encontrada no banco.';
      return;
    }

    let total = 0;
    for (const r of dados) {
      total += r.quantidadeAvaliacoes;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.tipoTransporte}</td>
        <td>${r.linha}</td>
        <td>${r.estacao}</td>
        <td><span class="metric-badge">${formatarBrDecimal(r.mediaIntervalo)} min</span></td>
        <td><span class="metric-badge">${formatarBrDecimal(r.mediaEspera)}</span></td>
        <td><span class="metric-badge">${formatarBrDecimal(r.mediaLotacao)}</span></td>
        <td><span class="metric-badge">${formatarBrDecimal(r.mediaQualidade)}</span></td>
        <td><span class="count-badge">${r.quantidadeAvaliacoes}</span></td>
      `;
      tbody.appendChild(tr);
    }

    resumoEl.textContent = `Total de avaliações usadas no dashboard: ${total}`;
  } catch (err) {
    resumoEl.textContent = 'Erro ao consultar o banco.';
    showDialog(`Não foi possível consultar o banco de dados.\n\nErro técnico: ${err.message}`, 'Erro no dashboard');
  }
}

document.getElementById('btn-admin-sair').addEventListener('click', () => goToScreen('screen-tela1'));
document.getElementById('btn-admin-atualizar').addEventListener('click', carregarDashboardAdmin);
document.getElementById('btn-admin-exportar').addEventListener('click', () => {
  window.location.href = '/api/admin/exportar-csv';
});

// Boot
carregarTransportData();
