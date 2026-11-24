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
    subtitle: 'Pesquisa rápida para entender a experiência dos passageiros.'
  },
  'screen-login': {
    title: 'Cadastro - Pesquisa de Satisfação',
    subtitle: 'Informe seus dados para iniciar o registro da avaliação.'
  },
  'screen-local': {
    title: 'Local - Pesquisa de Satisfação',
    subtitle: 'Selecione o transporte, a linha e a estação utilizada.'
  },
  'screen-intervalo': {
    title: 'Intervalo médio - Pesquisa de Satisfação',
    subtitle: 'Informe em minutos quanto tempo o transporte demora para passar.'
  },
  'screen-data': {
    title: 'Data e hora - Pesquisa de Satisfação',
    subtitle: 'Informe quando a viagem aconteceu.'
  },
  'screen-avaliacao': {
    title: 'Avaliação - Pesquisa de Satisfação',
    subtitle: 'Dê notas de 0 a 5 para os principais pontos da experiência.'
  },
  'screen-finalizacao': {
    title: 'Finalização - Pesquisa de Satisfação',
    subtitle: 'Deixe um comentário opcional e conclua a pesquisa.'
  },
  'screen-consulta': {
    title: 'Consulta rápida de transporte',
    subtitle: 'Veja a média de intervalo de metrô e trem com base nos relatos dos passageiros.'
  },
  'screen-admin-login': {
    title: 'Login administrador',
    subtitle: 'Acesso restrito para exportar o dashboard das avaliações.'
  },
  'screen-admin-dashboard': {
    title: 'Admin - Dashboard',
    subtitle: 'Área restrita para visualizar dados consolidados e exportar para Excel.'
  }
};

const SCREEN_PROGRESS = {
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
  atualizarOpcoesLinhaConsulta();
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
  const digitos = cpfInput.value.replace(/\D/g, '').slice(0, 11);
  cpfInput.value = digitos
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3}\.\d{3}\.\d{3})(\d{1,2})$/, '$1-$2');
});

function validarCpf(cpf) {
  const digitos = String(cpf).replace(/\D/g, '');
  if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) {
    return false;
  }

  const calcularDigito = (base, pesoInicial) => {
    const soma = base
      .split('')
      .reduce((total, digito, indice) => total + Number(digito) * (pesoInicial - indice), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return (
    calcularDigito(digitos.slice(0, 9), 10) === Number(digitos[9]) &&
    calcularDigito(digitos.slice(0, 10), 11) === Number(digitos[10])
  );
}

document.getElementById('btn-login-continuar').addEventListener('click', () => {
  const nome = document.getElementById('input-nome').value.trim();
  const cpf = cpfInput.value.trim();

  if (nome.length < 3) {
    showDialog('Informe um nome válido.');
    return;
  }
  if (!validarCpf(cpf)) {
    showDialog('Confira o CPF informado. Verifique os 11 dígitos.');
    return;
  }

  AppState.nome = nome;
  AppState.cpf = cpf.replace(/\D/g, '');
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

function preencherDataHoraRelativa(minutosAtras) {
  const viagem = new Date(Date.now() - minutosAtras * 60 * 1000);
  const pad = (valor) => String(valor).padStart(2, '0');
  document.getElementById('input-data').value =
    `${pad(viagem.getDate())}/${pad(viagem.getMonth() + 1)}/${viagem.getFullYear()}`;
  document.getElementById('input-hora').value =
    `${pad(viagem.getHours())}:${pad(viagem.getMinutes())}`;
}

document.getElementById('btn-data-agora').addEventListener('click', () => preencherDataHoraRelativa(0));
document.getElementById('btn-data-15-min').addEventListener('click', () => preencherDataHoraRelativa(15));
document.getElementById('btn-data-30-min').addEventListener('click', () => preencherDataHoraRelativa(30));

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
  const itens = [
    ['Nome', v(AppState.nome)],
    ['Transporte', v(AppState.tipoTransporte)],
    ['Linha', v(AppState.linha)],
    ['Estação', v(AppState.estacao)],
    ['Intervalo', intervaloTxt],
    ['Data/Hora', `${v(AppState.data)} ${v(AppState.hora)}`],
    ['Espera', `${AppState.espera}/5`],
    ['Lotação', `${AppState.lotacao}/5`],
    ['Qualidade', `${AppState.qualidade}/5`]
  ];

  document.getElementById('resumo-avaliacao').replaceChildren(
    ...itens.map(([rotulo, valor]) => {
      const item = document.createElement('div');
      item.className = 'review-item';
      const label = document.createElement('span');
      label.className = 'review-label';
      label.textContent = rotulo;
      const value = document.createElement('strong');
      value.className = 'review-value';
      value.textContent = valor;
      item.append(label, value);
      return item;
    })
  );
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

// Consulta rápida de transporte (Telaconsulta.java)
function formatarBrDecimal(valor) {
  return Number(valor || 0).toFixed(1).replace('.', ',');
}

let consultaRequestId = 0;

function atualizarOpcoesLinhaConsulta() {
  const tipo = document.getElementById('select-consulta-tipo').value;
  const linhasDisponiveis = AppState.transportData.linhasPorTipo;
  const linhas = tipo
    ? (linhasDisponiveis[tipo] || [])
    : Object.values(linhasDisponiveis).flat();
  const selectLinha = document.getElementById('select-consulta-linha');
  const linhaSelecionada = selectLinha.value;
  const opcoes = [...new Set(linhas)];

  selectLinha.innerHTML = [
    '<option value="">Todas</option>',
    ...opcoes.map((linha) => `<option value="${linha}">${linha}</option>`)
  ].join('');
  selectLinha.value = opcoes.includes(linhaSelecionada) ? linhaSelecionada : '';
}

document.getElementById('select-consulta-tipo').addEventListener('change', () => {
  atualizarOpcoesLinhaConsulta();
  carregarConsultaTrem();
});
document.getElementById('select-consulta-linha').addEventListener('change', carregarConsultaTrem);

async function carregarConsultaTrem() {
  const resumoEl = document.getElementById('consulta-resumo');
  const tbody = document.getElementById('tbody-consulta');
  const requestId = ++consultaRequestId;
  const params = new URLSearchParams();
  const tipoTransporte = document.getElementById('select-consulta-tipo').value;
  const linha = document.getElementById('select-consulta-linha').value;
  if (tipoTransporte) params.set('tipoTransporte', tipoTransporte);
  if (linha) params.set('linha', linha);

  resumoEl.textContent = 'Carregando dados...';
  tbody.innerHTML = '';

  try {
    const query = params.toString();
    const res = await fetch(`/api/consulta-trem${query ? `?${query}` : ''}`);
    const json = await res.json();
    if (requestId !== consultaRequestId) return;
    if (!res.ok) {
      throw new Error(json.erro || 'Erro na consulta.');
    }
    const dados = json.dados || [];

    if (!dados.length) {
      resumoEl.textContent = 'Nenhum relato encontrado para os filtros selecionados.';
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
    const periodo = json.escopo === 'ultima_hora' ? 'última hora' : 'histórico disponível';
    resumoEl.textContent =
      `Média geral: ${formatarBrDecimal(mediaGeral)} min · ${totalAvaliacoes} relatos · ${periodo}`;
  } catch (err) {
    if (requestId !== consultaRequestId) return;
    resumoEl.textContent = 'Erro ao consultar o banco.';
    showDialog(`Não foi possível consultar o banco de dados.\n\nErro técnico: ${err.message}`, 'Erro na consulta');
  }
}

document.getElementById('btn-atualizar-consulta').addEventListener('click', carregarConsultaTrem);

// Login Administrador (Telaadminlogin.java)
async function validarLoginAdmin() {
  const email = document.getElementById('input-admin-email').value.trim();
  const senha = document.getElementById('input-admin-senha').value;

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    const json = await res.json();

    if (res.ok && json.token) {
      sessionStorage.setItem('a3-admin-token', json.token);
      document.getElementById('input-admin-senha').value = '';
      goToScreen('screen-admin-dashboard');
      return;
    }

    showDialog(json.erro || 'Email ou senha de administrador inválidos.', 'Acesso negado');
    document.getElementById('input-admin-senha').value = '';
    document.getElementById('input-admin-senha').focus();
  } catch (err) {
    showDialog(`Não foi possível autenticar o administrador.\n\nErro técnico: ${err.message}`, 'Falha no acesso');
  }
}

document.getElementById('btn-admin-entrar').addEventListener('click', validarLoginAdmin);
document.getElementById('input-admin-senha').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') validarLoginAdmin();
});

// Dashboard Admin (Telaadmin.java + ExportadorDashboard.java)
function atualizarKpisDashboard(dados) {
  const totalAvaliacoes = dados.reduce(
    (total, item) => total + Number(item.quantidadeAvaliacoes || 0),
    0
  );
  const somaNotas = dados.reduce((total, item) => {
    const quantidade = Number(item.quantidadeAvaliacoes || 0);
    return total + quantidade * (
      Number(item.mediaEspera || 0) +
      Number(item.mediaLotacao || 0) +
      Number(item.mediaQualidade || 0)
    );
  }, 0);
  const totalIntervalos = dados.reduce((total, item) => {
    const quantidade = Number.isFinite(Number(item.quantidadeIntervalos))
      ? Number(item.quantidadeIntervalos)
      : Number(item.quantidadeAvaliacoes || 0);
    return total + quantidade;
  }, 0);
  const somaIntervalos = dados.reduce((total, item) => {
    const quantidade = Number.isFinite(Number(item.quantidadeIntervalos))
      ? Number(item.quantidadeIntervalos)
      : Number(item.quantidadeAvaliacoes || 0);
    return total + Number(item.mediaIntervalo || 0) * quantidade;
  }, 0);

  document.getElementById('kpi-total').textContent = String(totalAvaliacoes);
  document.getElementById('kpi-nota').textContent = totalAvaliacoes
    ? formatarBrDecimal(somaNotas / (3 * totalAvaliacoes))
    : '—';
  document.getElementById('kpi-espera').textContent = totalIntervalos
    ? formatarBrDecimal(somaIntervalos / totalIntervalos)
    : '—';

  const linhasCriticas = dados.filter((item) => Number(item.quantidadeAvaliacoes) > 0);
  const linhaCritica = [...linhasCriticas].sort((a, b) => {
    const notaA = (Number(a.mediaEspera) + Number(a.mediaLotacao) + Number(a.mediaQualidade)) / 3;
    const notaB = (Number(b.mediaEspera) + Number(b.mediaLotacao) + Number(b.mediaQualidade)) / 3;
    return notaA - notaB || Number(b.mediaIntervalo) - Number(a.mediaIntervalo);
  })[0];

  document.getElementById('kpi-linha-critica').textContent = linhaCritica
    ? `${linhaCritica.tipoTransporte} · ${linhaCritica.linha}`
    : '—';
  document.getElementById('kpi-linha-detalhe').textContent = linhaCritica
    ? `Nota média ${
        formatarBrDecimal(
          (Number(linhaCritica.mediaEspera) +
            Number(linhaCritica.mediaLotacao) +
            Number(linhaCritica.mediaQualidade)) / 3
        )
      } · espera ${formatarBrDecimal(linhaCritica.mediaIntervalo)} min`
    : 'Sem dados para calcular';
}

async function carregarDashboardAdmin() {
  const resumoEl = document.getElementById('admin-resumo');
  const tbody = document.getElementById('tbody-admin');
  resumoEl.textContent = 'Carregando dados...';
  tbody.innerHTML = '';
  const token = sessionStorage.getItem('a3-admin-token');
  if (!token) {
    goToScreen('screen-admin-login');
    showDialog('Entre novamente para acessar o dashboard.', 'Sessão encerrada');
    return;
  }

  try {
    const res = await fetch('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    if (res.status === 401) {
      sessionStorage.removeItem('a3-admin-token');
      goToScreen('screen-admin-login');
      showDialog('Sua sessão administrativa expirou. Entre novamente.', 'Sessão encerrada');
      return;
    }
    if (!res.ok) {
      throw new Error(json.erro || 'Erro no dashboard.');
    }
    const dados = json.dados || [];
    atualizarKpisDashboard(dados);

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

async function exportarDashboardAdmin() {
  const token = sessionStorage.getItem('a3-admin-token');
  if (!token) {
    goToScreen('screen-admin-login');
    showDialog('Entre novamente para exportar o dashboard.', 'Sessão encerrada');
    return;
  }

  try {
    const res = await fetch(`/api/admin/exportar-csv?token=${encodeURIComponent(token)}`);
    if (res.status === 401) {
      sessionStorage.removeItem('a3-admin-token');
      goToScreen('screen-admin-login');
      showDialog('Sua sessão administrativa expirou. Entre novamente.', 'Sessão encerrada');
      return;
    }
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.erro || 'Não foi possível exportar o dashboard.');
    }

    const arquivo = await res.blob();
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement('a');
    const disposicao = res.headers.get('Content-Disposition') || '';
    const nomeArquivo = disposicao.match(/filename="([^"]+)"/i)?.[1] || 'dashboard-avaliacoes.csv';
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    showDialog(`Não foi possível exportar o dashboard.\n\nErro técnico: ${err.message}`, 'Falha na exportação');
  }
}

document.getElementById('btn-admin-sair').addEventListener('click', async () => {
  const token = sessionStorage.getItem('a3-admin-token');
  sessionStorage.removeItem('a3-admin-token');
  goToScreen('screen-tela1');
  if (!token) return;

  try {
    const res = await fetch('/api/admin/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok && res.status !== 401) {
      throw new Error('Não foi possível encerrar a sessão no servidor.');
    }
  } catch (err) {
    showDialog(`A sessão foi encerrada neste navegador, mas não foi possível revogá-la no servidor.\n\n${err.message}`, 'Falha ao sair');
  }
});
document.getElementById('btn-admin-atualizar').addEventListener('click', carregarDashboardAdmin);
document.getElementById('btn-admin-exportar').addEventListener('click', exportarDashboardAdmin);

// Boot
carregarTransportData();
