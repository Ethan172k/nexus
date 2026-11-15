const el = (id) => document.getElementById(id);
const etapas = { evento: '1 de 4 · Tipo de emergência', localizacao: '2 de 4 · Onde aconteceu',
  pessoas: '3 de 4 · Pessoas afetadas', risco: '4 de 4 · Risco imediato',
  confirmar: 'Revisão · Confira os dados', protocolo: 'Consulta de protocolo' };
const botoes = el('sugestoes');
const lista = el('mensagens');
const campo = el('texto');
let ocupado = false;

function identificador() {
  const chave = 'nexus-demo-session-v1';
  const gerar = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), x => x.toString(16).padStart(2, '0')).join('');
  try {
    const salvo = localStorage.getItem(chave);
    if (salvo && /^[a-f0-9]{32}$/.test(salvo)) return salvo;
    const id = gerar();
    localStorage.setItem(chave, id);
    return id;
  } catch { return gerar(); }
}
const sessionId = identificador();

function mostrar(tipo, texto) {
  const item = document.createElement('div');
  item.className = 'message ' + tipo;
  const nome = document.createElement('small');
  nome.textContent = tipo === 'user' ? 'Você' : 'NEXUS';
  const corpo = document.createElement('div');
  corpo.className = 'bubble';
  corpo.textContent = texto;
  item.append(nome, corpo);
  lista.append(item);
  while (lista.children.length > 80) lista.firstElementChild.remove();
  lista.scrollTop = lista.scrollHeight;
}

function opcoes(valores) {
  botoes.replaceChildren();
  for (const [i, valor] of valores.entries()) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.textContent = valor;
    if (i === 0 && ['Registrar SOS', 'Confirmar registro'].includes(valor)) botao.dataset.primary = '';
    botao.addEventListener('click', () => enviar('mensagem', valor));
    botoes.append(botao);
  }
}

function painel(p) {
  el('protocolo').textContent = 'Protocolo ' + p.protocolo + ' · ' + (p.recebido ? 'Recebido na simulação' : 'Aguardando retransmissão');
  el('salvo').dataset.feito = '';
  el('salvo').setAttribute('aria-label', 'Etapa concluída: salvo no dispositivo');
  el('recebido').toggleAttribute('data-feito', p.recebido);
  el('recebido').setAttribute('aria-label', p.recebido ? 'Etapa concluída: recebido pela central simulada' : 'Etapa pendente: a central simulada não recebeu');
}

async function enviar(acao, texto) {
  if (ocupado) return;
  ocupado = true;
  el('enviar').disabled = true;
  el('retransmitir').disabled = true;
  for (const b of botoes.children) b.disabled = true;
  el('erro').hidden = true;
  el('indicador').textContent = 'Processando…';
  if (acao === 'mensagem') mostrar('user', texto);
  if (acao === 'retransmitir') mostrar('user', 'Testar retransmissão · ' + (el('rota').checked ? 'rota disponível' : 'sem rota'));
  try {
    const r = await fetch('../api/nexus/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(25000), body: JSON.stringify({ acao, texto, sessionId, rotaAtiva: el('rota').checked })
    });
    const msg = await r.json();
    if (!r.ok) throw Error(msg.erro || 'Serviço local indisponível');
    mostrar('bot', msg.resposta);
    opcoes(msg.sugestoes);
    el('motor').textContent = 'Interpretação · ' + msg.motor;
    const etapa = etapas[msg.etapa];
    el('etapa').textContent = etapa || '';
    el('etapa').hidden = !etapa;
    if (msg.pedido) painel(msg.pedido);
  } catch {
    el('erro').textContent = 'Não consegui falar com o servidor local. Confirme que o NEXUS está rodando e tente novamente.';
    el('erro').hidden = false;
    if (acao === 'boas-vindas') mostrar('bot', 'O serviço local do NEXUS não respondeu.');
    if (acao === 'mensagem' && !campo.value) campo.value = texto;
  } finally {
    ocupado = false;
    el('enviar').disabled = false;
    el('retransmitir').disabled = false;
    for (const b of botoes.children) b.disabled = false;
    el('indicador').textContent = '';
    if (acao === 'mensagem' && !(document.activeElement instanceof HTMLInputElement)) campo.focus({ preventScroll: true });
  }
}

el('compositor').addEventListener('submit', (evento) => {
  evento.preventDefault();
  const texto = campo.value.trim();
  if (!texto || ocupado) return;
  campo.value = '';
  enviar('mensagem', texto);
});
el('retransmitir').addEventListener('click', () => enviar('retransmitir'));
enviar('boas-vindas');
