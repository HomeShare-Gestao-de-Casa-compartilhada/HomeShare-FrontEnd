/* HomeShare - front-end (JS puro, sem build). Cada rota chamada aqui existe no back-end. */
const API = window.HOMESHARE_API, LS = localStorage;
const S = { token: LS.token || null, user: JSON.parse(LS.user || 'null'), casas: [], casa: null, tab: {}, membros: [] };
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dt = v => new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const dia = v => new Date(v + 'T00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
const hoje = () => new Date().toISOString().slice(0, 10);
const cid = () => S.casa.id, base = () => `/api/casas/${cid()}`, lider = () => S.casa?.souLider;
// Convite vindo do link (?convite=CODIGO): guarda para sobreviver ao login/cadastro.
const _cv = new URLSearchParams(location.search).get('convite');
if (_cv) { sessionStorage.convite = _cv.trim().toUpperCase(); history.replaceState(null, '', location.pathname + location.hash); }
const tab = (k, d) => S.tab[k] || d;
const empty = t => `<p class="empty">${t}</p>`;

function toast(m, er) { const t = $('#toast'); t.textContent = m; t.className = er ? 'er' : ''; t.style.display = 'block'; clearTimeout(toast.h); toast.h = setTimeout(() => t.style.display = 'none', 3800); }

async function api(m, p, b) {
  const r = await fetch(API + p, { method: m, headers: { 'Content-Type': 'application/json', ...(S.token && { Authorization: 'Bearer ' + S.token }) }, body: b === undefined ? undefined : JSON.stringify(b) });
  if (r.status === 204) return null;
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 && S.token && !p.startsWith('/api/auth')) { logout(); }
    throw new Error(j.erros ? Object.values(j.erros).join(' · ') : j.detail || 'Erro ' + r.status);
  }
  return j;
}
const logout = () => { delete LS.token; delete LS.user; S.token = null; S.casa = null; location.hash = ''; render(); };

/* ---------- formulários (modal) ---------- */
const inp = (n, l, t = 'text', v = '', x = '') => `<label>${l}<input name="${n}" type="${t}" value="${esc(v)}" ${x}></label>`;
const txt = (n, l, v = '', x = '') => `<label>${l}<textarea name="${n}" rows="3" ${x}>${esc(v)}</textarea></label>`;
const sel = (n, l, o, v) => `<label>${l}<select name="${n}">${o.map(([a, b]) => `<option value="${esc(a)}" ${String(a) === String(v) ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select></label>`;
function ask(title, body, submit, ok = 'Salvar') {
  const d = document.createElement('dialog');
  d.innerHTML = `<form><h3>${title}</h3>${body}<div class="row end"><button type="button" class="btn ghost">Cancelar</button><button class="btn">${ok}</button></div></form>`;
  document.body.append(d); d.showModal();
  d.querySelector('[type=button]').onclick = () => d.remove();
  d.addEventListener('close', () => d.remove());
  d.querySelector('form').onsubmit = async e => {
    e.preventDefault();
    try { await submit(Object.fromEntries(new FormData(e.target))); d.remove(); render(); } catch (x) { toast(x.message, 1); }
  };
}
const run = (fn, msg) => async () => { try { await fn(); if (msg) toast(msg); await render(); } catch (x) { toast(x.message, 1); } };
const sure = (q, fn, msg) => { if (confirm(q)) run(fn, msg)(); };

/* ---------- dados ---------- */
async function loadCasas() {
  S.casas = await api('GET', '/api/casas');
  S.casa = S.casas.find(c => c.id == LS.casaId) || S.casas[0] || null;
  if (S.casa) LS.casaId = S.casa.id;
}
const loadMembros = async () => (S.membros = await api('GET', base() + '/membros'));
const membroOpts = () => S.membros.map(m => [m.membroId, m.nome]);

/* ---------- casca ---------- */
const LOGO = `<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 2 11.5h3V21h5.5v-6h3v6H19v-9.5h3z"/></svg>`;
function shell(body, nav = true) {
  const t = location.hash.split('/')[1] || 'inicio';
  const opts = S.casas.map(c => `<option value="${c.id}" ${S.casa?.id === c.id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('') + '<option value="novo">+ Entrar ou criar casa</option>';
  return `<header><div class="wrap"><span class="logo">${LOGO}HomeShare</span><div class="grow">${S.casa && nav ? `<select data-c="casa" aria-label="Casa">${opts}</select>` : ''}</div>
    <button class="icon" data-a="tema" title="Alternar tema" aria-label="Alternar tema">◐</button><button class="icon" data-a="sair" title="Sair da conta" aria-label="Sair da conta">⎋</button></div></header>
    <main class="wrap">${body}</main>${nav ? `<nav class="bottom">${[['inicio', 'Início'], ['tarefas', 'Tarefas'], ['agenda', 'Agenda'], ['casa', 'Casa']].map(([h, n]) => `<a href="#/${h}" class="${t === h ? 'on' : ''}">${n}</a>`).join('')}</nav>` : ''}`;
}
const tabs = (k, items, d) => `<div class="tabs">${items.map(([v, n]) => `<button data-a="tab" data-k="${k}" data-v="${v}" class="${tab(k, d) === v ? 'on' : ''}">${n}</button>`).join('')}</div>`;
const gestorBtn = (a, t, x = '') => lider() ? `<button class="btn sm gestor-btn" data-a="${a}" ${x}>${t}</button> ` : '';

/* ---------- autenticação (telas 1 e 2) ---------- */
function authView() {
  const q = new URLSearchParams(location.search), tk = q.get('token'), t = S.tab.auth || (tk ? 'confirmar' : 'entrar');
  const tbs = tabs('auth', [['entrar', 'Entrar'], ['criar', 'Criar conta'], ['confirmar', 'Confirmar e-mail']], 'entrar');
  const f = {
    entrar: `<form data-f="login">${inp('email', 'E-mail', 'email', '', 'required')}${inp('senha', 'Senha', 'password', '', 'required')}<button class="btn">Entrar</button></form>`,
    criar: `<form data-f="register">${inp('nome', 'Nome', 'text', '', 'required maxlength=100')}${inp('email', 'E-mail', 'email', '', 'required')}${inp('senha', 'Senha (8 a 72 caracteres)', 'password', '', 'required minlength=8 maxlength=72')}<button class="btn">Criar conta</button></form>`,
    confirmar: `<p class="sub">Enviamos um código para o seu e-mail. Cole-o abaixo (vale 15 minutos).</p><form data-f="confirm">${inp('token', 'Código de confirmação', 'text', tk || '', 'required')}<button class="btn">Confirmar cadastro</button></form>`
  }[t];
  return shell(`<h2>Bem-vindo ao HomeShare</h2>${sessionStorage.convite ? '<div class="card gestor">Você recebeu um convite para entrar em uma casa. Entre ou crie sua conta para aceitar.</div>' : ''}<p class="sub">Tarefas, contas e avisos da casa compartilhada.</p>${tbs}<div class="card">${f}</div>`, false);
}
async function conviteView() {
  const code = sessionStorage.convite;
  let p;
  try { p = await api('GET', '/api/convites/' + code); } catch (x) {
    delete sessionStorage.convite;
    return shell(`<h2>Convite inválido</h2><p class="sub">Este convite não existe. Peça um novo link ao líder da casa.</p><button class="btn" data-a="cv-recusar">Voltar</button>`, false);
  }
  return shell(`<h2>Convite para uma casa</h2><div class="card"><h3>${esc(p.casaNome)}</h3><p class="sub">${p.valido ? 'Válido até ' + dt(p.validade) : 'Este convite expirou, foi cancelado ou já foi usado.'}</p>
    <div class="row">${p.valido ? '<button class="btn" data-a="cv-aceitar">Entrar na casa</button>' : ''}<button class="btn ghost" data-a="cv-recusar">${p.valido ? 'Agora não' : 'Voltar'}</button></div></div>`, false);
}
async function convidar(horas) {
  const c = await api('POST', base() + '/convites', { validadeHoras: +horas });
  const wa = 'https://wa.me/?text=' + encodeURIComponent('Entre na nossa casa no HomeShare: ' + c.link);
  ask('Convite criado', `<p class="sub">Válido até ${dt(c.validade)}. Uso único: cada link serve para uma pessoa.</p><label>Link<input readonly value="${esc(c.link)}" onfocus="this.select()"></label><p><a href="${wa}" target="_blank" rel="noopener">Enviar pelo WhatsApp</a></p>`,
    async () => { await navigator.clipboard.writeText(c.link); toast('Link copiado'); }, 'Copiar link');
}
async function casasView() {
  const convite = new URLSearchParams(location.search).get('convite') || '';
  const lista = S.casas.map(c => `<div class="item"><div class="grow t">${esc(c.nome)} ${c.souLider ? '<span class="tag">GESTOR</span>' : ''}</div><button class="btn sm ghost" data-a="usar" data-id="${c.id}">Abrir</button></div>`).join('');
  return shell(`<h2>Sua casa</h2>${lista ? `<div class="card">${lista}</div>` : ''}
    <div class="card"><h3>Entrar com convite</h3><form data-f="entrar-convite">${inp('codigo', 'Código ou link do convite', 'text', convite, 'required')}<button class="btn">Entrar na casa</button></form></div>
    <div class="card"><h3>Criar uma casa nova</h3><p class="sub">Quem cria a casa vira o líder.</p><form data-f="criar-casa">${inp('nome', 'Nome da casa', 'text', '', 'required maxlength=100')}<button class="btn">Criar casa</button></form></div>`, !!S.casa && false);
}

/* ---------- início (tela 3) ---------- */
function tarefaRow(t, todas) {
  const meu = t.responsavel.id === S.casa.meuMembroId, pode = t.status === 'PENDENTE' && (meu || lider());
  return `<div class="item ${t.status !== 'PENDENTE' ? 'done' : ''}"><input type="checkbox" data-c="concluir" data-id="${t.id}" ${t.status === 'CONCLUIDA' ? 'checked' : ''} ${pode ? '' : 'disabled'} aria-label="Concluir">
    <div class="grow"><div class="t">${esc(t.titulo)}</div><div class="sub">${dt(t.prazo)}${todas || t.concluidoPor ? ' · ' + esc(t.responsavel.nome) : ''}${t.concluidoPor ? ' · feita por ' + esc(t.concluidoPor.nome) + ' em ' + dt(t.dataConclusao) : ''}</div></div>
    ${t.atrasada ? '<span class="chip late">atrasada</span>' : ''}<span class="chip ${t.prioridade}">${t.prioridade}</span>
    ${lider() && t.status === 'PENDENTE' ? `<button class="icon" data-a="tarefa-edit" data-id="${t.id}" aria-label="Editar">✎</button><button class="icon" data-a="tarefa-del" data-id="${t.id}" aria-label="Apagar">✕</button>` : ''}</div>`;
}
async function inicioView() {
  const mes = hoje().slice(0, 7);
  const [ts, ev, av, gs] = await Promise.all([api('GET', base() + '/tarefas/minhas'), api('GET', base() + '/eventos?de=' + hoje()), api('GET', base() + '/avisos'), api('GET', base() + '/gastos?mes=' + mes)]);
  const tot = gs.reduce((a, g) => a + g.valorTotal, 0), pg = gs.reduce((a, g) => a + g.totalPago, 0);
  return shell(`<h2>Olá, ${esc(S.user.nome.split(' ')[0])}</h2>
   <div class="card"><h3>Minhas próximas tarefas</h3>${ts.slice(0, 4).map(t => tarefaRow(t)).join('') || empty('Nenhuma tarefa pendente.')}</div>
   <div class="card"><h3>Próximo evento</h3>${ev[0] ? `<div class="t">${esc(ev[0].titulo)}</div><div class="sub">${dia(ev[0].data)} às ${ev[0].horario.slice(0, 5)}</div>` : empty('Sem eventos marcados.')}</div>
   <div class="card"><h3>Último aviso</h3>${av[0] ? `<div>${esc(av[0].recado)}</div><div class="sub">${esc(av[0].autor.nome)} · ${dt(av[0].dataPublicacao)}</div>` : empty('Sem avisos.')}</div>
   <div class="card"><h3>Gastos fixos do mês</h3>${gs.length ? `<div class="bar"><i style="width:${tot ? pg / tot * 100 : 0}%"></i></div><div class="sub">${brl(pg)} pagos de ${brl(tot)}</div>` : empty('Nenhum gasto lançado.')}</div>`);
}

/* ---------- tarefas (telas 4, 5, 6) ---------- */
async function tarefasView() {
  const t = tab('tf', 'minhas'); let corpo;
  if (t === 'minhas') {
    const [p, c] = await Promise.all([api('GET', base() + '/tarefas/minhas'), api('GET', base() + '/tarefas/minhas?status=CONCLUIDA')]);
    corpo = [...p, ...c].map(x => tarefaRow(x)).join('') || empty('Você não tem tarefas.');
  } else if (t === 'todas') {
    corpo = (await api('GET', base() + '/tarefas')).map(x => tarefaRow(x, 1)).join('') || empty('Nenhuma tarefa pendente.');
  } else {
    const h = await api('GET', base() + '/tarefas/historico?pagina=' + (S.tab.pg || 0) + '&tamanho=20');
    corpo = h.conteudo.map(x => tarefaRow(x, 1)).join('') || empty('Ainda não há tarefas concluídas.');
    corpo += `<div class="row end">${h.pagina > 0 ? '<button class="btn sm ghost" data-a="pg" data-v="-1">Anterior</button>' : ''}${h.pagina + 1 < h.totalPaginas ? '<button class="btn sm ghost" data-a="pg" data-v="1">Próxima</button>' : ''}</div>`;
  }
  return shell(`<div class="row"><h2 class="grow">Tarefas</h2>${gestorBtn('tarefa-new', 'Nova tarefa')}</div>${tabs('tf', [['minhas', 'Minhas'], ...(lider() ? [['todas', 'Todas']] : []), ['hist', 'Histórico']], 'minhas')}<div class="card">${corpo}</div>`);
}
async function tarefaForm(id) {
  await loadMembros();
  const t = id ? (await api('GET', base() + '/tarefas')).find(x => x.id == id) : {};
  ask(id ? 'Editar tarefa' : 'Nova tarefa',
    inp('titulo', 'Título', 'text', t.titulo, 'required maxlength=100') + txt('descricao', 'Descrição', t.descricao, 'maxlength=500') +
    sel('responsavelId', 'Responsável', membroOpts(), t.responsavel?.id || S.casa.meuMembroId) +
    inp('prazo', 'Prazo', 'datetime-local', t.prazo?.slice(0, 16), 'required') + sel('prioridade', 'Prioridade', ['URGENTE', 'NORMAL', 'TRANQUILA'].map(x => [x, x]), t.prioridade || 'NORMAL'),
    o => api(id ? 'PUT' : 'POST', base() + '/tarefas' + (id ? '/' + id : ''), { ...o, responsavelId: +o.responsavelId }));
}

/* ---------- agenda: eventos e reservas (telas 7, 8, 9) ---------- */
async function agendaView() {
  const t = tab('ag', 'eventos'); let corpo;
  if (t === 'eventos') {
    const ev = await api('GET', base() + '/eventos');
    corpo = ev.map(e => `<div class="item ${e.data < hoje() ? 'done' : ''}"><div class="grow"><div class="t">${esc(e.titulo)}</div><div class="sub">${dia(e.data)} às ${e.horario.slice(0, 5)} · ${esc(e.descricao)}</div></div>
      ${lider() ? `<button class="icon" data-a="ev-edit" data-id="${e.id}" aria-label="Editar">✎</button><button class="icon" data-a="ev-del" data-id="${e.id}" aria-label="Apagar">✕</button>` : ''}</div>`).join('') || empty('Nenhum evento no calendário.');
  } else {
    const [es, rs] = await Promise.all([api('GET', base() + '/espacos'), api('GET', base() + '/reservas')]);
    S.espacos = es;
    corpo = `<div class="row wrapx" style="margin-bottom:8px"><button class="btn sm" data-a="res-new">Reservar</button>${gestorBtn('esp-new', 'Novo espaço')}</div>` +
      (lider() ? es.map(e => `<span class="chip">${esc(e.nome)} <button class="icon" style="padding:0 4px" data-a="esp-del" data-id="${e.id}" aria-label="Remover espaço">✕</button></span> `).join('') : '') +
      rs.map(r => `<div class="item"><div class="grow"><div class="t">${esc(r.espacoNome)}</div><div class="sub">${dt(r.inicio)} até ${dt(r.fim)} · ${esc(r.reservadoPor.nome)}</div></div>
      ${r.reservadoPor.id === S.casa.meuMembroId || lider() ? `<button class="btn sm ghost" data-a="res-del" data-id="${r.id}">Cancelar</button>` : ''}</div>`).join('') || empty('Nenhuma reserva ativa.');
  }
  return shell(`<div class="row"><h2 class="grow">Agenda</h2>${t === 'eventos' ? gestorBtn('ev-new', 'Novo evento') : ''}</div>${tabs('ag', [['eventos', 'Eventos'], ['reservas', 'Reservas']], 'eventos')}<div class="card">${corpo}</div>`);
}
async function eventoForm(id) {
  const e = id ? (await api('GET', base() + '/eventos')).find(x => x.id == id) : {};
  ask(id ? 'Editar evento' : 'Novo evento', inp('titulo', 'Título', 'text', e.titulo, 'required maxlength=100') + inp('data', 'Data', 'date', e.data, 'required') + inp('horario', 'Horário', 'time', e.horario?.slice(0, 5), 'required') + txt('descricao', 'Descrição', e.descricao, 'required maxlength=500'),
    o => api(id ? 'PUT' : 'POST', base() + '/eventos' + (id ? '/' + id : ''), o));
}

/* ---------- casa (tela 10) e subtelas ---------- */
async function casaView() {
  const ms = await loadMembros();
  return shell(`<div class="card"><h2 style="margin-top:0">${esc(S.casa.nome)} ${lider() ? '<span class="tag">GESTOR</span>' : ''}</h2><div class="sub">${ms.length} moradores · líder: ${esc(S.casa.liderNome)}</div>${gestorBtn('casa-rename', 'Renomear')}</div>
   ${lider() ? '<div class="card gestor"><h3>Convidar alguém <span class="tag">GESTOR</span></h3><p class="sub">Gere um link de uso único e envie pelo WhatsApp.</p><button class="btn" data-a="cv-gerar">Gerar link de convite</button></div>' : ''}
   <div class="card">${[['avisos', 'Quadro de avisos e regras'], ['gastos', 'Gastos fixos'], ['contatos', 'Contatos importantes'], ['moradores', 'Moradores e convites'], ['compras', 'Lista de compras']].map(([h, n]) => `<a class="link" href="#/${h}">${n}<span>›</span></a>`).join('')}</div>
   <div class="card"><button class="btn danger" data-a="casa-sair">Sair da casa</button>${lider() ? '<p class="sub">Ao sair, o morador mais antigo assume a liderança. Se preferir, passe a liderança antes em Moradores.</p>' : ''}</div>`);
}
const voltar = '<p><a href="#/casa">‹ Casa</a></p>';
async function avisosView() {
  const t = tab('av', 'avisos'); let corpo;
  if (t === 'avisos') corpo = (await api('GET', base() + '/avisos')).map(a => `<div class="item"><div class="grow">${esc(a.recado)}<div class="sub">${esc(a.autor.nome)} · ${dt(a.dataPublicacao)}</div></div>${lider() ? `<button class="icon" data-a="av-del" data-id="${a.id}" aria-label="Apagar">✕</button>` : ''}</div>`).join('') || empty('Sem avisos.');
  else corpo = (await api('GET', base() + '/regras')).map(r => `<div class="item"><div class="grow"><div class="t">${esc(r.titulo)}</div><div class="sub">${esc(r.texto)}</div></div>${lider() ? `<button class="icon" data-a="rg-edit" data-id="${r.id}">✎</button><button class="icon" data-a="rg-del" data-id="${r.id}">✕</button>` : ''}</div>`).join('') || empty('Sem regras cadastradas.');
  return shell(`${voltar}<div class="row"><h2 class="grow">Avisos e regras</h2>${gestorBtn(t === 'avisos' ? 'av-new' : 'rg-new', t === 'avisos' ? 'Novo aviso' : 'Nova regra')}</div>${tabs('av', [['avisos', 'Avisos'], ['regras', 'Regras']], 'avisos')}<div class="card">${corpo}</div>`);
}
async function gastosView() {
  const mes = S.tab.mes || hoje().slice(0, 7);
  const gs = await api('GET', base() + '/gastos?mes=' + mes), tot = gs.reduce((a, g) => a + g.valorTotal, 0), pg = gs.reduce((a, g) => a + g.totalPago, 0);
  const corpo = gs.map(g => `<div class="card"><div class="row"><div class="grow t">${esc(g.descricao)} <span class="sub">${brl(g.valorTotal)}</span></div>${lider() ? `<button class="icon" data-a="gt-del" data-id="${g.id}" aria-label="Apagar">✕</button>` : ''}</div>
    ${g.parcelas.map(p => `<div class="item"><input type="checkbox" data-c="pagar" data-id="${p.id}" ${p.pago ? 'checked' : ''} ${p.membro.id === S.casa.meuMembroId || lider() ? '' : 'disabled'} aria-label="Pago"><div class="grow">${esc(p.membro.nome)}</div><span class="sub">${brl(p.valor)}</span></div>`).join('')}</div>`).join('') || empty('Nenhum gasto neste mês.');
  return shell(`${voltar}<div class="row"><h2 class="grow">Gastos fixos</h2>${gestorBtn('gt-new', 'Novo gasto')}</div><input type="month" value="${mes}" data-c="mes" aria-label="Mês">
    <div class="card"><div class="bar"><i style="width:${tot ? pg / tot * 100 : 0}%"></i></div><div class="sub">${brl(pg)} pagos de ${brl(tot)}</div></div>${corpo}`);
}
async function contatosView() {
  const cs = await api('GET', base() + '/contatos');
  return shell(`${voltar}<div class="row"><h2 class="grow">Contatos importantes</h2>${gestorBtn('ct-new', 'Novo contato')}</div><div class="card">${cs.map(c => `<div class="item"><div class="grow"><div class="t">${esc(c.nome)}</div><div class="sub">${esc(c.funcao)} · ${esc(c.telefone)}</div></div><a class="btn sm" href="tel:${esc(c.telefone.replace(/[^\d+]/g, ''))}">Ligar</a>${lider() ? `<button class="icon" data-a="ct-edit" data-id="${c.id}">✎</button><button class="icon" data-a="ct-del" data-id="${c.id}">✕</button>` : ''}</div>`).join('') || empty('Nenhum contato cadastrado.')}</div>`);
}
async function moradoresView() {
  const ms = await loadMembros(), cv = lider() ? await api('GET', base() + '/convites') : [];
  return shell(`${voltar}<h2>Moradores</h2><div class="card">${ms.map(m => `<div class="item"><div class="grow t">${esc(m.nome)} ${m.lider ? '<span class="tag">Líder</span>' : ''}</div>${lider() && !m.lider ? `<button class="btn sm ghost" data-a="mem-lider" data-id="${m.membroId}">Tornar líder</button><button class="btn sm danger" data-a="mem-del" data-id="${m.membroId}">Remover</button>` : ''}</div>`).join('')}${lider() ? '' : ''}</div>
   ${lider() ? `<div class="card gestor"><div class="row"><h3 class="grow">Convites <span class="tag">GESTOR</span></h3><button class="btn sm" data-a="cv-new">Gerar convite</button></div>
   ${cv.filter(c => c.valido).map(c => `<div class="item"><div class="grow"><code>${c.codigo}</code><div class="sub">vale até ${dt(c.validade)}</div></div><button class="btn sm ghost" data-a="cv-copy" data-id="${esc(c.link)}">Copiar link</button><button class="btn sm danger" data-a="cv-del" data-id="${c.id}">Cancelar</button></div>`).join('') || empty('Nenhum convite ativo.')}</div>` : ''}`);
}
async function comprasView() {
  const it = await api('GET', base() + '/itens'), li = x => `<div class="item ${x.status === 'COMPRADO' ? 'done' : ''}"><input type="checkbox" data-c="comprar" data-id="${x.id}" ${x.status === 'COMPRADO' ? 'checked disabled' : ''}><div class="grow"><div class="t">${esc(x.nome)}${x.quantidade ? ' (' + x.quantidade + ')' : ''}</div><div class="sub">${x.status === 'COMPRADO' ? 'comprado por ' + esc(x.compradoPor.nome) : 'pedido por ' + esc(x.adicionadoPor.nome)}</div></div>${x.adicionadoPor.id === S.casa.meuMembroId || lider() ? `<button class="icon" data-a="it-del" data-id="${x.id}" aria-label="Remover">✕</button>` : ''}</div>`;
  const f = it.filter(x => x.status === 'FALTANDO'), c = it.filter(x => x.status === 'COMPRADO');
  return shell(`${voltar}<h2>Lista de compras</h2><form data-f="item" class="row"><input name="nome" placeholder="O que está acabando?" required maxlength="100"><button class="btn">Adicionar</button></form>
   <h3 style="margin-top:16px">Faltando</h3><div class="card">${f.map(li).join('') || empty('Nada faltando.')}</div><h3>Já comprados</h3><div class="card">${c.map(li).join('') || empty('Nenhum item comprado.')}</div>`);
}

/* ---------- ações (botões) ---------- */
const ACT = {
  tema: () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; LS.theme = t; },
  sair: () => logout(),
  tab: (d) => { S.tab[d.k] = d.v; S.tab.pg = 0; render(); },
  pg: (d) => { S.tab.pg = Math.max(0, (S.tab.pg || 0) + +d.v); render(); },
  usar: (d) => { LS.casaId = d.id; location.hash = '#/inicio'; boot(); },
  'tarefa-new': () => tarefaForm(), 'tarefa-edit': d => tarefaForm(d.id),
  'tarefa-del': d => sure('Apagar esta tarefa?', () => api('DELETE', `${base()}/tarefas/${d.id}`), 'Tarefa apagada'),
  'ev-new': () => eventoForm(), 'ev-edit': d => eventoForm(d.id),
  'ev-del': d => sure('Apagar este evento?', () => api('DELETE', `${base()}/eventos/${d.id}`), 'Evento apagado'),
  'esp-new': () => ask('Novo espaço', inp('nome', 'Nome', 'text', '', 'required maxlength=100') + sel('tipo', 'Tipo', ['LAVANDERIA', 'CHURRASQUEIRA', 'SALA', 'OUTRO'].map(x => [x, x]), 'SALA'), o => api('POST', base() + '/espacos', o)),
  'esp-del': d => sure('Remover este espaço?', () => api('DELETE', `${base()}/espacos/${d.id}`), 'Espaço removido'),
  'res-new': () => ask('Reservar espaço', sel('espaco', 'Espaço', (S.espacos || []).map(e => [e.id, e.nome])) + inp('inicio', 'Início', 'datetime-local', '', 'required') + inp('fim', 'Fim', 'datetime-local', '', 'required'),
    o => api('POST', `${base()}/espacos/${o.espaco}/reservas`, { inicio: o.inicio, fim: o.fim }), 'Reservar'),
  'res-del': d => sure('Cancelar esta reserva?', () => api('DELETE', `${base()}/reservas/${d.id}`), 'Reserva cancelada'),
  'casa-rename': () => ask('Renomear casa', inp('nome', 'Nome', 'text', S.casa.nome, 'required maxlength=100'), async o => { await api('PUT', base(), o); await loadCasas(); }),
  'casa-sair': () => sure('Sair desta casa?', async () => { await api('POST', base() + '/sair'); delete LS.casaId; await loadCasas(); location.hash = S.casa ? '#/inicio' : '#/casas'; }, 'Você saiu da casa'),
  'av-new': () => ask('Novo aviso', txt('recado', 'Recado', '', 'required maxlength=500'), o => api('POST', base() + '/avisos', o), 'Publicar'),
  'av-del': d => sure('Apagar este aviso?', () => api('DELETE', `${base()}/avisos/${d.id}`)),
  'rg-new': () => regraForm(), 'rg-edit': d => regraForm(d.id),
  'rg-del': d => sure('Apagar esta regra?', () => api('DELETE', `${base()}/regras/${d.id}`)),
  'ct-new': () => contatoForm(), 'ct-edit': d => contatoForm(d.id),
  'ct-del': d => sure('Apagar este contato?', () => api('DELETE', `${base()}/contatos/${d.id}`)),
  'gt-new': async () => { await loadMembros(); ask('Novo gasto', inp('descricao', 'Descrição', 'text', '', 'required maxlength=150') + inp('valorTotal', 'Valor total (R$)', 'number', '', 'required min=0.01 step=0.01') + inp('mes', 'Mês', 'month', hoje().slice(0, 7), 'required') +
    `<label class="row"><input type="checkbox" name="igual" checked> Dividir igualmente entre os moradores</label><p class="sub">Ou preencha o valor de cada um (a soma deve bater com o total):</p>${S.membros.map(m => inp('p' + m.membroId, m.nome, 'number', '', 'min=0 step=0.01')).join('')}`,
    o => api('POST', base() + '/gastos', { descricao: o.descricao, valorTotal: +o.valorTotal, mesReferencia: o.mes + '-01', parcelas: o.igual ? null : S.membros.filter(m => o['p' + m.membroId] !== '').map(m => ({ membroId: m.membroId, valor: +o['p' + m.membroId] })) })); },
  'gt-del': d => sure('Apagar este gasto?', () => api('DELETE', `${base()}/gastos/${d.id}`)),
  'mem-lider': d => sure('Passar a liderança para este morador?', async () => { await api('PUT', base() + '/lideranca', { novoLiderMembroId: +d.id }); await loadCasas(); }, 'Liderança transferida'),
  'mem-del': d => sure('Remover este morador da casa?', () => api('DELETE', `${base()}/membros/${d.id}`), 'Morador removido'),
  'cv-new': () => ask('Gerar convite', sel('validadeHoras', 'Validade', [[24, '24 horas'], [48, '2 dias'], [168, '7 dias']], 48), o => convidar(o.validadeHoras), 'Gerar'),
  'cv-gerar': run(() => convidar(48)),
  'cv-aceitar': run(async () => {
    const code = sessionStorage.convite;
    try { const c = await api('POST', `/api/convites/${code}/entrar`); LS.casaId = c.id; location.hash = '#/inicio'; await loadCasas(); } finally { delete sessionStorage.convite; }
  }, 'Você entrou na casa!'),
  'cv-recusar': () => { delete sessionStorage.convite; render(); },
  'cv-copy': d => navigator.clipboard.writeText(d.id).then(() => toast('Link copiado')),
  'cv-del': d => sure('Cancelar este convite?', () => api('DELETE', `${base()}/convites/${d.id}`)),
  'it-del': d => sure('Remover este item?', () => api('DELETE', `${base()}/itens/${d.id}`))
};
const regraForm = async id => { const r = id ? (await api('GET', base() + '/regras')).find(x => x.id == id) : {}; ask(id ? 'Editar regra' : 'Nova regra', inp('titulo', 'Título', 'text', r.titulo, 'required maxlength=100') + txt('texto', 'Texto', r.texto, 'required maxlength=1000'), o => api(id ? 'PUT' : 'POST', base() + '/regras' + (id ? '/' + id : ''), o)); };
const contatoForm = async id => { const c = id ? (await api('GET', base() + '/contatos')).find(x => x.id == id) : {}; ask(id ? 'Editar contato' : 'Novo contato', inp('nome', 'Nome', 'text', c.nome, 'required maxlength=100') + inp('funcao', 'Função (ex.: encanador)', 'text', c.funcao, 'required maxlength=60') + inp('telefone', 'Telefone', 'tel', c.telefone, 'required maxlength=20'), o => api(id ? 'PUT' : 'POST', base() + '/contatos' + (id ? '/' + id : ''), o)); };

const CHG = {
  casa: async el => { if (el.value === 'novo') { location.hash = '#/casas'; return; } LS.casaId = el.value; await boot(); },
  concluir: el => run(() => api('POST', `${base()}/tarefas/${el.dataset.id}/concluir`), 'Tarefa concluída')(),
  pagar: el => run(() => api('PATCH', `${base()}/gastos/parcelas/${el.dataset.id}/pagamento`, { pago: el.checked }))(),
  comprar: el => run(() => api('POST', `${base()}/itens/${el.dataset.id}/comprar`), 'Item comprado')(),
  mes: el => { S.tab.mes = el.value; render(); }
};
const FORMS = {
  login: async o => { const r = await api('POST', '/api/auth/login', o); S.token = LS.token = r.accessToken; S.user = r.usuario; LS.user = JSON.stringify(r.usuario); await boot(); },
  register: async o => { const r = await api('POST', '/api/auth/register', o); toast(r.mensagem); S.tab.auth = 'confirmar'; render(); },
  confirm: async o => { await api('POST', '/api/auth/confirm', o); toast('Conta criada! Agora é só entrar.'); history.replaceState(null, '', location.pathname); S.tab.auth = 'entrar'; render(); },
  'entrar-convite': async o => {
    const code = o.codigo.trim().split(/[=/]/).pop(), p = await api('GET', '/api/convites/' + code);
    if (!p.valido) throw new Error('Este convite expirou ou já foi usado.');
    if (!confirm(`Entrar na casa "${p.casaNome}"?`)) return;
    const c = await api('POST', `/api/convites/${code}/entrar`); LS.casaId = c.id; history.replaceState(null, '', location.pathname); location.hash = '#/inicio'; await boot();
  },
  'criar-casa': async o => { const c = await api('POST', '/api/casas', o); LS.casaId = c.id; location.hash = '#/inicio'; await boot(); },
  item: async (o, f) => { await api('POST', base() + '/itens', o); f.reset(); }
};

/* ---------- eventos globais e roteador ---------- */
document.addEventListener('click', e => { const a = e.target.closest('[data-a]'); if (a && ACT[a.dataset.a]) ACT[a.dataset.a](a.dataset, a); });
document.addEventListener('change', e => { const c = e.target.dataset?.c; if (c && CHG[c]) CHG[c](e.target); });
document.addEventListener('submit', async e => {
  const k = e.target.dataset?.f; if (!k) return; e.preventDefault();
  try { await FORMS[k](Object.fromEntries(new FormData(e.target)), e.target); render(); } catch (x) { toast(x.message, 1); }
});
window.addEventListener('hashchange', render);

const ROTAS = { inicio: inicioView, tarefas: tarefasView, agenda: agendaView, casa: casaView, avisos: avisosView, gastos: gastosView, contatos: contatosView, moradores: moradoresView, compras: comprasView, casas: casasView };
async function render() {
  const app = $('#app');
  try {
    if (!S.token) { app.innerHTML = authView(); return; }
    if (sessionStorage.convite) { app.innerHTML = await conviteView(); return; }
    let r = location.hash.split('/')[1] || 'inicio';
    if (!S.casa) r = 'casas';
    app.innerHTML = await (ROTAS[r] || inicioView)();
  } catch (x) { toast(x.message, 1); if (S.token) app.innerHTML = shell(empty('Não foi possível carregar. ' + esc(x.message)), !!S.casa); }
}
async function boot() { if (S.token) await loadCasas(); render(); }
boot();
