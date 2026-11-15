const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const engine = require('../nlu/conversa.cjs');
const intencoes = require('../nlu/intencoes.json');
const entidades = require('../nlu/entidades.json');
const { criarTelegram } = require('../nlu/telegram.cjs');

test('60 expressões de treino distintas classificadas nas cinco intenções', () => {
  const vistas = new Set();
  assert.equal(Object.keys(intencoes).length, 5);
  for (const [id, frases] of Object.entries(intencoes)) {
    assert.equal(frases.length, 12);
    for (const frase of frases) {
      const v = engine.normalizar(frase);
      assert.equal(vistas.has(v), false, frase);
      vistas.add(v);
      assert.equal(engine.porRegras(frase, v), id, frase);
    }
  }
});

const captura = (campo, frase) => engine.extrair(campo, frase, engine.normalizar(frase));

test('as cinco entidades reconhecem variações e recusam entradas ambíguas', () => {
  assert.equal(Object.keys(entidades).length, 5);
  assert.equal(captura('evento', 'um alagamento'), 'Enchente');
  assert.equal(captura('evento', 'sem luz'), 'Apagão');
  assert.equal(captura('evento', 'enchente ou terremoto'), null);
  assert.equal(captura('localizacao', 'Referência: Escola Azul'), 'Escola Azul');
  assert.equal(captura('localizacao', 'aqui'), null);
  assert.equal(captura('pessoas', 'duas vítimas'), 2);
  assert.equal(captura('pessoas', 'Não sabemos'), 0);
  assert.equal(captura('pessoas', '1 ou 2'), null);
  assert.equal(captura('pessoas', '-5'), null);
  assert.equal(captura('risco', 'sem risco imediato'), 'sem_imediato');
  assert.equal(captura('risco', 'não, mas tem gente ferida'), null);
  assert.equal(captura('risco', 'pessoas presas'), 'imediato');
  assert.equal(captura('protocolo', 'Qual o código 12?'), 12);
});

const servidor = async (t, fn) => {
  const s = http.createServer(fn);
  await new Promise(r => s.listen(0, '127.0.0.1', r));
  t.after(() => new Promise(r => s.close(r)));
  return 'http://127.0.0.1:' + s.address().port;
};
const corpo = async (req) => {
  const bytes = [];
  for await (const parte of req) bytes.push(parte);
  return Buffer.concat(bytes).toString();
};

test('LLM local: contrato estruturado, limite de autoridade e fallback (servidor simulado)', async t => {
  let retorno = 'registrar_sos';
  let chamadas = 0;
  const url = await servidor(t, async (req, res) => {
    chamadas++;
    const payload = JSON.parse(await corpo(req));
    assert.equal(req.url, '/api/chat');
    assert.equal(payload.stream, false);
    assert.ok(payload.format.properties.intencao.enum.includes('desconhecida'));
    res.end(JSON.stringify({ message: { content: JSON.stringify({ intencao: retorno }) } }));
  });
  const cfg = { modelo: 'fake', ollama: url, llmTimeout: 1000 };
  const entrada = { dono: 'web:teste', acao: 'mensagem', texto: 'Tenho uma ocorrência para informar' };
  const s = engine.novaSessao();
  const a = await engine.conversar(cfg, s, entrada);
  assert.equal(a.motor, 'LLM local');
  assert.equal(a.etapa, 'evento');
  assert.equal(a.pedido, undefined);
  await engine.conversar(cfg, s, { ...entrada, texto: 'Enchente' });
  assert.equal(chamadas, 1, 'LLM não deve preencher dados ou registrar pedidos');
  retorno = 'execute_something';
  const b = await engine.conversar(cfg, engine.novaSessao(), entrada);
  assert.match(b.motor, /indisponível/);
  assert.equal(b.etapa, 'inicio');
});

test('Telegram texto e áudio: polling, download, STT, TTS e upload (APIs simuladas)', async t => {
  const rotas = [];
  const url = await servidor(t, async (req, res) => {
    rotas.push(req.url);
    const b = await corpo(req);
    const responder = result => res.end(JSON.stringify({ ok: true, result }));
    if (req.url.endsWith('getUpdates')) return responder([
      { update_id: 1, message: { chat: { id: 47, type: 'private' }, text: '/sos' } },
      { update_id: 2, message: { chat: { id: 47, type: 'private' }, voice: { file_id: '1', duration: 4 } } },
      { update_id: 3, message: { chat: { id: 48, type: 'group' }, text: '/sos' } }
    ]);
    if (req.url.endsWith('getFile')) return responder({ file_path: 'voice/1.oga' });
    if (req.url.endsWith('1.oga')) return res.end('OGG-DEMO');
    if (req.url.endsWith('transcriptions')) {
      assert.match(b, /OGG-DEMO/);
      assert.match(b, /gpt-transcribe/);
      return res.end(JSON.stringify({ text: 'alagamento' }));
    }
    if (req.url.endsWith('speech')) {
      const data = JSON.parse(b);
      assert.equal(data.response_format, 'mp3');
      return res.end('MP3-DEMO');
    }
    if (req.url.endsWith('sendMessage')) {
      const data = JSON.parse(b);
      assert.equal(data.chat_id, 47);
      assert.equal(data.text, 'Teste');
      return responder({});
    }
    if (req.url.endsWith('sendVoice')) {
      assert.match(b, /MP3-DEMO/);
      assert.match(b, /nexus\.mp3/);
      return responder({});
    }
    res.writeHead(404).end();
  });
  const tg = criarTelegram({ token: 'mock', chaveAudio: 'mock', baseTelegram: url, baseAudio: url });
  const [texto, voz, grupo] = await tg.consultar();
  assert.equal(texto.text, '/sos');
  assert.equal(grupo, undefined);
  assert.equal(await tg.transcrever(voz.voice), 'alagamento');
  await tg.enviarTexto(47, 'Teste');
  await tg.enviarVoz(47, 'Onde aconteceu?');
  await assert.rejects(tg.transcrever({ ...voz.voice, duration: 31 }));
  assert.equal(rotas.length, 7);
});
