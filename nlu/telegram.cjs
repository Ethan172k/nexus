const validar = (r) => { if (!r.ok) throw Error('serviço externo indisponível'); return r; };

function criarTelegram({ token, chaveAudio, baseTelegram = 'https://api.telegram.org',
  baseAudio = 'https://api.openai.com/v1', modeloStt = 'gpt-transcribe', modeloTts = 'gpt-4o-mini-tts' }) {
  let ultimaAtualizacao = 0;
  let consultando = false;
  const chamada = async (metodo, dados) => {
    const form = dados instanceof FormData;
    const r = await fetch(baseTelegram + '/bot' + token + '/' + metodo, {
      method: 'POST', body: form ? dados : JSON.stringify(dados),
      headers: form ? undefined : { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(12000)
    });
    const json = await validar(r).json();
    if (!json.ok) throw Error('Telegram não confirmou a operação');
    return json.result;
  };
  async function consultar() {
    if (!token || consultando) return [];
    consultando = true;
    try {
      const updates = await chamada('getUpdates', {
        offset: ultimaAtualizacao, timeout: 0, limit: 10, allowed_updates: ['message']
      });
      for (const u of updates) ultimaAtualizacao = Math.max(ultimaAtualizacao, u.update_id + 1);
      return updates.map(u => u.message).filter(m => m?.chat?.type === 'private' && (m.text || m.voice));
    } finally { consultando = false; }
  }
  async function transcrever(voz) {
    if (!chaveAudio) throw Error('áudio não configurado');
    if (voz.duration > 30 || voz.file_size > 2_000_000) throw Error('áudio excede limite');
    const arq = await chamada('getFile', { file_id: voz.file_id });
    if (!arq.file_path || arq.file_size > 2_000_000) throw Error('arquivo indisponível');
    const caminho = arq.file_path.split('/').map(encodeURIComponent).join('/');
    const r = await fetch(baseTelegram + '/file/bot' + token + '/' + caminho, { signal: AbortSignal.timeout(10000) });
    const bytes = await validar(r).arrayBuffer();
    if (bytes.byteLength > 2_000_000) throw Error('áudio excede limite');
    const form = new FormData();
    form.append('file', new Blob([bytes], { type: 'audio/ogg' }), 'mensagem.ogg');
    form.append('model', modeloStt);
    form.append('language', 'pt');
    const resp = await fetch(baseAudio + '/audio/transcriptions', {
      method: 'POST', headers: { Authorization: 'Bearer ' + chaveAudio }, body: form, signal: AbortSignal.timeout(20000)
    });
    const { text } = await validar(resp).json();
    if (typeof text !== 'string' || !text.trim()) throw Error('áudio sem transcrição');
    return text.trim();
  }
  async function enviarTexto(chat, text) {
    await chamada('sendMessage', { chat_id: chat, text });
  }
  async function enviarVoz(chat, text) {
    if (!chaveAudio) return;
    const r = await fetch(baseAudio + '/audio/speech', {
      method: 'POST', signal: AbortSignal.timeout(20000),
      headers: { Authorization: 'Bearer ' + chaveAudio, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modeloTts, voice: 'alloy', input: text, response_format: 'mp3' })
    });
    const form = new FormData();
    form.append('chat_id', String(chat));
    form.append('voice', new Blob([await validar(r).arrayBuffer()], { type: 'audio/mpeg' }), 'nexus.mp3');
    await chamada('sendVoice', form);
  }
  return { consultar, transcrever, enviarTexto, enviarVoz };
}

module.exports = { criarTelegram };
