const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const raiz = path.resolve(__dirname, '..');
process.chdir(raiz);
const build = path.join(raiz, '.nexus-data', 'build');
const data = path.join(raiz, '.nexus-data', 'sos');
fs.mkdirSync(build, { recursive: true });
const nomes = fs.readdirSync('src').filter(n => n.endsWith('.java')).map(n => path.join('src', n));
const porta = process.env.NEXUS_JAVA_PORT || '8787';
const bin = process.env.NEXUS_JAVA || 'java';
const filhos = new Set();
const iniciar = (comando, args) => {
  const processo = spawn(comando, args, { stdio: 'inherit' });
  filhos.add(processo);
  processo.on('exit', () => filhos.delete(processo));
  return processo;
};
function encerrar(codigo) {
  for (const f of filhos) f.kill();
  process.exitCode = codigo;
}
process.on('SIGINT', () => encerrar(0));
process.on('SIGTERM', () => encerrar(0));
const compilacao = iniciar(bin, ['-m', 'jdk.compiler/com.sun.tools.javac.Main', '-encoding', 'UTF-8', '-d', build, ...nomes]);
compilacao.on('error', () => {
  console.error('Java não encontrado. Instale um JDK 17 ou 21 e confirme java -version.');
  encerrar(1);
});
compilacao.on('close', async (codigo) => {
  if (codigo !== 0) { encerrar(1); return; }
  const java = iniciar(bin, ['-cp', build, 'GatewayNexus', porta, data]);
  let javaSaiu = false;
  java.on('exit', () => { javaSaiu = true; encerrar(process.exitCode ?? 1); });
  java.on('error', () => { javaSaiu = true; encerrar(1); });
  for (let i = 0; i < 40 && !javaSaiu; i++) {
    try {
      const resposta = await fetch('http://127.0.0.1:' + porta + '/health', { signal: AbortSignal.timeout(300) });
      if (resposta.ok && !javaSaiu) {
        const nr = iniciar(process.execPath, [require.resolve('node-red/red.js'), '--settings', 'settings.cjs']);
        nr.on('exit', c => encerrar(c ?? 0));
        nr.on('error', () => encerrar(1));
        console.log('Webchat: http://127.0.0.1:' + (process.env.NEXUS_WEB_PORT || 1880) + '/nexus/');
        return;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 150));
  }
  if (!javaSaiu) console.error('O gateway Java não respondeu.');
  encerrar(1);
});
