const { test } = require('node:test');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const http = require('node:http');

const root = path.resolve(__dirname, '..');
const pausa = ms => new Promise(r => setTimeout(r, ms));
const portaLivre = async () => {
  const server = net.createServer();
  await new Promise((r, no) => server.listen(0, '127.0.0.1', r).once('error', no));
  const porta = server.address().port;
  await new Promise(r => server.close(r));
  return porta;
};

test('Java + Node-RED + HTTP: validação, sessão, cancelamento, fila e reinício', { timeout: 38000 }, async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'nexus-integ-'));
  const build = path.join(dir, 'build');
  const store = path.join(dir, 'pedidos');
  const portaJava = await portaLivre();
  const portaNode = await portaLivre();
  const filhos = new Set();
  const logs = [];
  const java = process.env.NEXUS_JAVA || 'java';
  const iniciar = (bin, params, env = {}) => {
    const p = spawn(bin, params, { cwd: root, env: { ...process.env, ...env } });
    p.stdout.on('data', d => logs.push(String(d)));
    p.stderr.on('data', d => logs.push(String(d)));
    p.once('error', e => logs.push(String(e)));
    p.once('close', () => filhos.delete(p));
    filhos.add(p);
    return p;
  };
  const parar = async p => {
    if (p.exitCode !== null || p.signalCode !== null) return;
    await new Promise(r => { p.once('close', r); p.kill(); });
  };
  t.after(async () => { for (const p of filhos) await parar(p); await fs.rm(dir, { recursive: true, force: true }); });
  await fs.mkdir(build);
  const arquivos = (await fs.readdir(path.join(root, 'src'))).filter(n => n.endsWith('.java')).map(n => 'src/' + n);
  const c = iniciar(java, ['-m', 'jdk.compiler/com.sun.tools.javac.Main', '-encoding', 'UTF-8', '-d', build, ...arquivos]);
  assert.equal(await new Promise(r => c.once('close', r)), 0, logs.join(''));
  const iniciarJava = () => iniciar(java, ['-cp', build, 'GatewayNexus', String(portaJava), store]);
  const j = iniciarJava();
  let proximas = [];
  const enviados = [];
  const audio = http.createServer(async (req, res) => {
    const dados = [];
    for await (const parte of req) dados.push(parte);
    const body = Buffer.concat(dados).toString();
    const ok = result => res.end(JSON.stringify({ ok: true, result }));
    if (req.url.endsWith('/getUpdates')) { const result = proximas; proximas = []; return ok(result); }
    if (req.url.endsWith('/getFile')) return ok({ file_path: 'voice/teste.oga' });
    if (req.url.endsWith('/teste.oga')) return res.end('audio de teste');
    if (req.url.endsWith('/transcriptions')) return res.end(JSON.stringify({ text: 'alagamento' }));
    if (req.url.endsWith('/speech')) return res.end('voz de teste');
    if (req.url.endsWith('/sendMessage')) { enviados.push(JSON.parse(body).text); return ok({}); }
    if (req.url.endsWith('/sendVoice')) { enviados.push(body); return ok({}); }
    res.writeHead(404).end();
  });
  await new Promise(r => audio.listen(0, '127.0.0.1', r));
  t.after(() => new Promise(r => audio.close(r)));
  const urlMock = 'http://127.0.0.1:' + audio.address().port;
  const cfg = path.join(dir, 'settings.cjs');
  await fs.writeFile(cfg, 'const cfg = require(' + JSON.stringify(path.join(root, 'settings.cjs')) +
    '); cfg.userDir = ' + JSON.stringify(path.join(dir, 'nodered')) +
    '; cfg.functionGlobalContext.nexusTelegram = require(' + JSON.stringify(path.join(root, 'nlu/telegram.cjs')) +
    ').criarTelegram(' + JSON.stringify({ token: 'mock', chaveAudio: 'mock', baseTelegram: urlMock, baseAudio: urlMock }) +
    '); module.exports = cfg;');
  iniciar(process.execPath, [require.resolve('node-red/red.js'), '--settings', cfg], {
    NEXUS_JAVA_PORT: String(portaJava), NEXUS_WEB_PORT: String(portaNode),
    TELEGRAM_BOT_TOKEN: '', NEXUS_OLLAMA_MODEL: '', OPENAI_API_KEY: ''
  });
  const web = 'http://127.0.0.1:' + portaNode;
  const gateway = 'http://127.0.0.1:' + portaJava;
  const aguardar = async url => {
    for (let i = 0; i < 60; i++) {
      try { const r = await fetch(url, { signal: AbortSignal.timeout(250) }); if (r.ok) return r; } catch {}
      await pausa(120);
    }
    assert.fail('Não iniciou: ' + url + '\n' + logs.join(''));
  };
  const w = await aguardar(web + '/nexus/');
  assert.match(await w.text(), /Conversa com NEXUS/);
  await aguardar(gateway + '/health');
  const id = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const outro = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
  const enviar = async (texto, sessionId = id, acao = 'mensagem', rotaAtiva = false) => {
    const r = await fetch(web + '/api/nexus/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, acao, texto, rotaAtiva }) });
    assert.equal(r.status, 200, logs.join(''));
    return r.json();
  };
  const invalido = await fetch(web + '/api/nexus/chat', { method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: 'x', acao: 'mensagem', texto: '' }) });
  assert.equal(invalido.status, 400);
  assert.equal((await enviar('Registrar SOS')).etapa, 'evento');
  assert.equal((await enviar('Cancelar rascunho')).etapa, 'inicio');
  assert.equal((await enviar('', id, 'boas-vindas')).pedido, null);

  assert.equal((await enviar('Preciso de resgate')).etapa, 'evento');
  assert.equal((await enviar('alagamento')).etapa, 'localizacao');
  assert.equal((await enviar('Como funciona sem internet?')).etapa, 'localizacao');
  assert.equal((await enviar('Praça das Testes, 17')).etapa, 'pessoas');
  assert.equal((await enviar('-5')).etapa, 'pessoas');
  assert.equal((await enviar('duas vítimas')).etapa, 'risco');
  const revisao = await enviar('pessoas presas');
  assert.equal(revisao.etapa, 'confirmar');
  assert.match(revisao.resposta, /Praça das Testes, 17/);
  assert.match(revisao.resposta, /Pessoas: 2/);
  assert.equal((await enviar('Confirmar registro', outro)).pedido, undefined);
  assert.equal((await enviar('sim')).etapa, 'confirmar', 'não confirmar implicitamente');
  const salvo = await enviar('Confirmar registro');
  assert.match(salvo.resposta, /A central não recebeu/);
  assert.equal(salvo.pedido.recebido, false);
  assert.equal(salvo.pedido.prioridade, 'Urgente');
  assert.equal((await enviar('Consultar meu pedido', outro)).pedido, null);
  assert.equal((await enviar('Consultar protocolo ' + salvo.pedido.protocolo, outro)).pedido, null);
  assert.equal((await enviar('', id, 'retransmitir')).pedido.recebido, false);
  await parar(j);
  iniciarJava();
  await aguardar(gateway + '/health');
  const consultado = await enviar('Consultar meu pedido');
  assert.deepEqual(consultado.pedido, salvo.pedido);
  const entregue = await enviar('', id, 'retransmitir', true);
  assert.match(entregue.resposta, /Nenhuma equipe foi acionada/);
  assert.equal(entregue.pedido.recebido, true);
  assert.equal((await enviar('', id, 'retransmitir', true)).pedido.protocolo, salvo.pedido.protocolo);
  assert.equal((await enviar('', id, 'boas-vindas')).pedido.recebido, true);
  assert.equal((await fs.readdir(store)).length, 1);

  // Exercita os próprios nós do Node-RED, com APIs externas simuladas.
  const tchat = { id: 123, type: 'private' };
  const aguardarEnvio = async (n, trecho) => {
    for (let i = 0; i < 45; i++) {
      if (enviados[n]) return assert.match(enviados[n], trecho);
      await pausa(110);
    }
    assert.fail('Telegram simulado não respondeu: ' + trecho + '\n' + logs.join(''));
  };
  proximas.push({ update_id: 1, message: { chat: tchat, text: '/sos' } });
  await aguardarEnvio(0, /O que aconteceu/);
  proximas.push({ update_id: 2, message: { chat: tchat, voice: { file_id: 'id', duration: 2 } } });
  await aguardarEnvio(1, /Onde você está/);
  await aguardarEnvio(2, /voz de teste/);
});
