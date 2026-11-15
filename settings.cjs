const path = require('node:path');
const engine = require('./nlu/conversa.cjs');
const { criarTelegram } = require('./nlu/telegram.cjs');
const p = process.env;
const cfg = {
  gateway: 'http://127.0.0.1:' + (p.NEXUS_JAVA_PORT || '8787'),
  ollama: 'http://127.0.0.1:11434',
  modelo: p.NEXUS_OLLAMA_MODEL || '',
  llmTimeout: Number(p.NEXUS_LLM_TIMEOUT) || 10000
};

module.exports = {
  uiHost: '127.0.0.1',
  uiPort: Number(p.NEXUS_WEB_PORT) || 1880,
  userDir: path.join(__dirname, '.nexus-data', 'node-red'),
  flowFile: path.join(__dirname, 'flow.json'),
  httpAdminRoot: '/editor',
  httpStatic: [{ path: path.join(__dirname, 'web'), root: '/nexus/' }],
  functionGlobalContext: {
    nexusEngine: engine, nexusConfig: cfg,
    nexusTelegram: criarTelegram({ token: p.TELEGRAM_BOT_TOKEN, chaveAudio: p.OPENAI_API_KEY,
      modeloStt: p.NEXUS_STT_MODEL, modeloTts: p.NEXUS_TTS_MODEL })
  },
  logging: { console: { level: 'info', metrics: false, audit: false } }
};
