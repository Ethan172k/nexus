# NEXUS | Assistente de emergência

Protótipo da Global Solution 2026/2 (CitizenTech), disciplina Artificial Intelligence & Chatbot. O NEXUS coleta um pedido de socorro em uma conversa e distingue duas coisas que não podem ser confundidas: **registrado localmente** e **recebido pela central simulada**. Não aciona equipes de resgate. Use somente dados fictícios.

## Entregas da FIAP

O NEXUS é um único projeto, com anexos separados por disciplina no Portal do Aluno. Este repositório mantém o código e as fontes revisáveis, não os pacotes com identificação acadêmica.

| Frente | Fontes e referências |
|---|---|
| Artificial Intelligence & Chatbot | [Fluxo Node-RED](flow.json), [WebChat](web/) e instruções abaixo. |
| Building Relational Database | [Cenário, regras e modelo relacional proposto](docs/banco/README.md). O runtime ainda usa arquivos locais. |
| Domain Driven Design Using Java | [Código Java](src/). O ZIP e o PDF próprios são preparados para o Portal. |
| Computational Thinking Using Python | Material separado recebido pelo grupo; não representado nesta versão do Git. |
| Front-End Design Engineering | [Base WebChat](web/). Não representa o site completo de sete páginas. |
| Software Engineering and Business Model | [Documento funcional, backlog e fontes dos casos de uso](docs/engenharia/README.md). |

## 1. Rode o Webchat no computador

**Pré-requisitos:** Node.js 22.13+ (ou 24) e Java JDK 17 ou 21. No primeiro uso, a instalação dos pacotes precisa de internet.

1. Extraia todo o ZIP e abra a pasta `NEXUS_Chatbot_FIAP` no VS Code.
2. No terminal do VS Code, rode:

   ```bash
   npm ci
   npm start
   ```

3. Abra **http://127.0.0.1:1880/nexus/**. Deixe o terminal aberto.
4. Para ver os nós da integração, abra **http://127.0.0.1:1880/editor/**. O fluxo já vem carregado de `flow.json`. Não importe outra cópia sobre o fluxo já rodando.
5. Para encerrar, pressione Ctrl+C. Para testar, rode `npm test` em outro terminal.

Se o professor preferir a importação manual, use o menu **Import** do Node-RED para abrir `flow.json` em uma instância de teste. Para que os nós respondam, essa instância precisa usar o `settings.cjs` incluído e ter o gateway Java em funcionamento. O caminho de execução acima configura ambos automaticamente.

### Experimente sem internet

1. Com o projeto já rodando, desligue o Wi-Fi e desconecte a rede externa. O endereço `127.0.0.1` continua no mesmo computador. Não use o seletor “Offline” das ferramentas do navegador, que pode bloquear inclusive o acesso a endereços locais.
2. No chat, selecione **Registrar SOS** e responda **alagamento**, **Praça das Palmeiras, 17 (local fictício)**, **duas pessoas** e **Sim**. Confira o resumo e clique **Confirmar registro**.
3. Anote o protocolo. O painel indica **Aguardando retransmissão**. Com o relé desligado, **Testar retransmissão** mantém o pedido pendente.
4. Marque **Rota disponível** e clique em **Testar retransmissão** novamente. O mesmo protocolo passa a **Recebido pela central simulada**. Nenhum pacote foi transmitido por rádio, Bluetooth ou Wi-Fi Direct.
5. Se quiser demonstrar persistência, reinicie o programa e abra a mesma URL no mesmo navegador. O protocolo reaparece. Também é possível consultar **Consultar protocolo 1**, substituindo 1 pelo número exibido.

### Ative e demonstre o LLM local

O fluxo funciona com regras mesmo sem modelo. Para demonstrar o requisito de LLM da FIAP:

1. Instale o [Ollama](https://ollama.com/download) e deixe-o rodando.
2. Antes da demonstração, baixe um modelo com `ollama pull qwen2.5:1.5b`. Opcionalmente, aqueça o modelo com `ollama run qwen2.5:1.5b "Olá"`.
3. Duplique `.env.example` para `.env` e mantenha `NEXUS_OLLAMA_MODEL=qwen2.5:1.5b`. Reinicie com `npm start`.
4. No início de uma conversa, escreva algo que não esteja no catálogo, como **Tenho uma ocorrência para informar**. Confira se a interface mostra **LLM local**. A classificação de uma frase não é garantida. Ensaie antes do vídeo. Se aparecer “regras locais · LLM indisponível”, verifique se o Ollama está rodando e se o modelo está baixado. Em um computador mais lento, ajuste `NEXUS_LLM_TIMEOUT=15000`.

O modelo recebe a frase de abertura não reconhecida, os rótulos de intenção e alguns exemplos. Não recebe o contexto estruturado, não escolhe a prioridade, não responde com instruções livres e não confirma nem transmite pedidos. A classificação é validada contra uma lista de intenções. O resumo e o registro são determinísticos.

## 2. Configure Telegram com texto e áudio

1. Crie um bot de teste no [@BotFather](https://t.me/BotFather). Use um bot sem webhook ou outro programa concorrendo pelo mesmo token. O Node-RED usa polling, sem expor o computador à internet.
2. Na sua cópia local de `.env`, preencha `TELEGRAM_BOT_TOKEN` e `OPENAI_API_KEY`. O primeiro habilita texto. O segundo habilita fala para texto (STT) e texto para fala (TTS), por serviço externo com acesso e faturamento próprios. Não inclua tokens ou a chave no ZIP, GitHub ou vídeo.
3. Reinicie o NEXUS conectado à internet. Abra uma conversa privada com o bot, envie **/start** e espere a resposta. Envie **/sos** em texto. Na pergunta seguinte, envie uma mensagem de voz de poucos segundos dizendo **alagamento**. Aguarde a próxima pergunta escrita e falada.
4. Complete o roteiro com dados fictícios. Na revisão, digite **Confirmar registro**. O bot não aceita confirmação por áudio para evitar que um erro de transcrição grave o pedido. O Telegram usa a mesma fila Java, mas tem contexto e protocolos separados do navegador. A retransmissão é um controle da demo Web, não uma função do bot.

O fluxo não grava áudio localmente. O STT envia o áudio ao provedor. A resposta falada só lê a etapa seguinte e não repete a localização informada. Se o áudio falhar, o bot mantém a opção de texto. As respostas faladas do bot são geradas por IA. Isso não substitui a narração humana do vídeo da disciplina.

**Limite do offline:** o Webchat funciona sem internet enquanto Node-RED e Java rodam no mesmo computador. O protótipo não tem app móvel independente, malha física, envio ao serviço público, GPS ou triagem clínica. O Telegram e seu áudio precisam de internet.

## 3. Como o código funciona

| Responsabilidade | Arquivo ou componente |
|---|---|
| Interface responsiva de texto e painel de status | `web/index.html`, `web/nexus.css`, `web/nexus.js` |
| Orquestração HTTP, Telegram, STT e TTS | `flow.json`, `settings.cjs` e `nlu/telegram.cjs` |
| Interpretação, etapas e resumo | `nlu/conversa.cjs` |
| Cinco intenções e 60 frases | `nlu/intencoes.json` |
| Cinco entidades com sinônimos | `nlu/entidades.json` |
| Protótipo Java original do Octavio | Oito classes preservadas em `src/`, incluindo `Main.java` |
| Ponte real para a fila Java | `src/GatewayNexus.java`, que instancia `PedidoSOS`, `RedeMesh`, `Dispositivo` e `Central` |
| Testes automatizados e de integração | `test/` |

**Contexto:** a variável `sessoesNexus` no Node-RED guarda `etapa`, `dados` e `protocolo` por canal e sessão. O rascunho expira após 30 minutos de inatividade e também some se o Node-RED reiniciar. Só um pedido confirmado é gravado em disco, na pasta `.nexus-data/sos`. O identificador do navegador permite recuperar seus pedidos no mesmo navegador após reiniciar. Os arquivos são locais e sem criptografia. Os dados fictícios podem ser apagados excluindo `.nexus-data/sos` com o aplicativo parado.

**Prioridade:** “Sim” sugere **Urgente**, “Não” sugere **Normal** e “Não sei” gera **A verificar**. Trata-se de uma regra de demonstração e não de decisão de despacho. A quantidade pode ficar desconhecida. O chat não inventa localização nem confirma por conta própria.

### O que explicar para o professor

- Uma intenção representa a finalidade da frase: registrar, consultar, saber como funciona offline, ver ajuda ou cancelar.
- Uma entidade é um dado encontrado na frase. “Alagamento” vira **Enchente**, “duas vítimas” vira **2** e “código 12” pode virar o protocolo **12**.
- No fluxo Node-RED, Webchat e Telegram chegam ao mesmo nó de conversa. A variável de contexto separa as sessões. O registro só acontece depois da revisão, no Java.
- A fila persistente é real no protótipo. O rádio, o relé e a central de resgate são simulados. Um próximo passo seria testar transporte entre dois dispositivos reais.

## 4. Checklist FIAP (PDF, páginas 23–28)

| Requisito | Pontos | O que mostrar |
|---|---:|---|
| 5 intenções, pelo menos 12 exemplos por intenção | 15 | `nlu/intencoes.json` e variações no Webchat |
| 5 entidades com sinônimos | 15 | `nlu/entidades.json` e respostas “alagamento”, “duas vítimas” |
| Variável de contexto | 10 | O resumo lembra respostas de quatro mensagens diferentes |
| Webchat somente texto | 10 | Abra o chat, registre e consulte um protocolo |
| Telegram texto, STT e TTS via Node-RED | 25 | Preencha credenciais, teste com o bot real e grave a voz recebida e a resposta escrita/falada |
| Vídeo real com narração explicativa | 25 | O grupo precisa gravar Webchat e Telegram, publicar no YouTube como não listado e testar o link em aba anônima |

**Entrega:** até **19/11/2026, às 23h55**, no Portal do Aluno, na disciplina correta. Substitua os campos de `IDENTIFICACAO.txt` por nome completo, RM e turma de cada integrante e pelo link do vídeo. O ZIP atual é uma base para revisão do grupo. Não envie o arquivo com dados em branco, segredos, `node_modules` ou dados de testes. A apresentação presencial de 23 a 27/11 vale 30% da nota da disciplina e pede demonstração ao vivo de áudio no Telegram e participação dos integrantes.

**Sugestão de sequência para o vídeo:** apresente o problema e avise que é um protótipo. Mostre um SOS no Webchat, a fila pendente e a mudança após habilitar o relé simulado. Depois, mostre a frase reconhecida pelo LLM local e o nó de contexto. Termine com texto no Telegram, um áudio curto transcrito e a resposta falada. O vídeo de **Artificial Intelligence & Chatbot** deve ter narração explicativa. Ele é distinto do pitch de **Software Engineering and Business Model**, que tem instruções próprias no PDF.

**Ponte com Software Engineering:** use três casos de uso coerentes com as telas: *Registrar SOS*, *Consultar protocolo* e *Retransmitir com rota disponível*. No modelo de negócio, diferencie o cidadão usuário de prefeituras e Defesa Civil como possíveis parceiros ou clientes, sem afirmar que já há parceria. Para CitizenTech, o impacto esperado é facilitar registro e acompanhamento durante falhas de conectividade. Relacione ao ODS 11 (impacto dos desastres, meta 11.5) e às situações climáticas do ODS 13 (meta 13.1). As metas são conexão temática, não resultado já medido.

### Evidências e revisão do grupo

- Testes automatizados cobrem o catálogo, extração, validação do LLM, contratos de áudio e a integração real Webchat/Node-RED/Java com fila persistente.
- Os testes automatizados do LLM e do áudio usam respostas simuladas de API. As validações com serviços reais estão registradas separadamente abaixo.
- **Telegram com texto e áudio — validado no bot real.** O `/sos` iniciou a conversa, a mensagem de voz foi transcrita e o bot avançou para a pergunta de localização com resposta escrita e falada.
- **Ollama com Qwen2.5 1.5B — validado no ambiente de teste.** No Webchat, a frase “Tenho uma ocorrência para informar” abriu o fluxo de SOS com o indicador **LLM local**. Ainda falta repetir a demonstração no computador que será usado na apresentação.
- Uso de IA generativa neste rascunho: ChatGPT para apoiar a leitura da rubrica, elaborar e revisar uma proposta de código, documentação e testes. Confiram, rodem e expliquem o código, ajustem o que decidirem e atualizem esta declaração com as ferramentas efetivamente usadas pelo grupo. A FIAP veda entregar material gerado sem entender e revisar.

### Referências técnicas

[Node-RED](https://nodered.org/docs/user-guide/runtime/configuration) · [Ollama Chat API](https://docs.ollama.com/api/chat) · [Telegram Bot API](https://core.telegram.org/bots/api) · [STT](https://developers.openai.com/api/reference/resources/audio/subresources/transcriptions/methods/create) · [TTS](https://developers.openai.com/api/reference/resources/audio/subresources/speech/methods/create) · [ODS 11](https://sdgs.un.org/goals/goal11) · [ODS 13](https://sdgs.un.org/goals/goal13)
