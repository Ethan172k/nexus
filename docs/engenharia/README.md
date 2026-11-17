# Engenharia de Software e Modelo de Negócio | NEXUS

## Documento funcional

**Problema.** Em uma enchente ou queda de conectividade, o cidadão precisa informar onde está e saber o que aconteceu com seu pedido. O NEXUS é um protótipo acadêmico de registro guiado e acompanhamento de SOS.

**Jornada.** O morador informa tipo de emergência, localização, quantidade e risco. Confirma o resumo e recebe o protocolo com indicação de salvamento local. Pode consultar o pedido da própria sessão. No modo demonstração, testa a retransmissão com ou sem rota. Sem rota, mantém-se o registro local. Com rota, o mesmo protocolo fica recebido pela central simulada. Nenhuma equipe é acionada.

**Escopo.** Conversa guiada, confirmação, protocolo estável, transparência do estado e prioridade sugerida. Prioridade não é despacho nem recebimento. WebChat local, Telegram e a demo somente no navegador são ambientes distintos. Telegram e áudio exigem internet. A demo não implementa transporte real, central operacional nem integração com Defesa Civil. O banco relacional é uma proposta.

## Business Model Canvas

| Bloco | Hipótese de trabalho |
|---|---|
| Segmentos | Moradores afetados são usuários; prefeitura ou consórcio municipal é cliente potencial. |
| Proposta de valor | Coletar dados mínimos e distinguir salvamento local de recebimento. |
| Canais | WebChat e Telegram na demo; canais de piloto a combinar. |
| Relacionamento | Guia de uso, treinamento de operadores e feedback de status. |
| Receitas | Possível piloto financiado ou contrato institucional. Sem cobrança do cidadão. |
| Recursos | Protótipo, equipe de desenvolvimento, ambiente de teste e infraestrutura do piloto. |
| Atividades | Testar a jornada, validar acessibilidade, treinar e medir em simulados. |
| Parceiros | Defesa Civil municipal e organizações comunitárias seriam potenciais parceiras. Não há parceria confirmada. |
| Custos | Desenvolvimento, implantação, treinamento, hospedagem e serviços de voz quando usados. |

## Mapa de Empatia

Persona hipotética: morador durante enchente com sinal instável. **Pensa e sente:** “Meu pedido chegou?”. **Vê:** rua alagada e conexão intermitente. **Ouve:** alertas e relatos de vizinhos. **Fala e faz:** envia localização e acompanha o protocolo. **Dores:** repetir informação e confundir fila com recebimento. **Ganhos:** orientação simples, confirmação local e estado compreensível. Validar em simulados ou entrevistas antes de um piloto.

**Indicadores propostos, ainda não medidos:** tempo até protocolo, abandono antes da confirmação e capacidade de distinguir os dois estados. Contribuições pretendidas: ODS 11.5 e 13.1 na preparação e resposta a desastres.

## Quadros descritivos e rastreabilidade

| Caso | Ator e objetivo | Fluxo principal | Alternativas | Backlog |
|---|---|---|---|---|
| UC-01 — Registrar SOS | Cidadão quer obter protocolo após confirmar dados. | Inicia conversa, informa dados, revisa, confirma e obtém protocolo local. | Entrada inválida é solicitada novamente; cancelar abandona o rascunho. | US-01 |
| UC-02 — Consultar protocolo | Cidadão quer saber se pedido foi recebido. | Digita protocolo ou pede o último; sistema verifica sessão e exibe estado e prioridade. | Protocolo ausente ou de outra sessão não revela dados. | US-02 |
| UC-03 — Simular retransmissão | Usuário da demo quer verificar a disponibilidade da rota. | Seleciona cenário, solicita teste e o sistema avalia a rota. | Sem rota, conserva SALVO_LOCAL; com rota, confirma RECEBIDO_SIMULADO sem trocar protocolo. | US-03 |

## Finalização no Astah

Use os três arquivos [PlantUML](astah/) como fonte. No Astah, confira os atores, associações, inclusões e extensões e salve um projeto .asta. As prévias não são evidência de criação no Astah. Em uma versão com suporte à importação de casos de uso pelo plugin oficial, use a conversão; se a versão não importar esse tipo, reproduza os elementos no editor nativo. Exporte as três imagens para o PDF.

## Backlog e pitch

[backlog.json](backlog.json) é a base de cartões, não um quadro publicado. Transfira para o Trello/Jira, confirme atribuições e datas e confira leitura pelo professor. O pitch deve usar imagens reais e ter até três minutos, sem vídeo gerado por IA. Confirme com o professor a instrução sobre narração humana, que diverge no PDF. Inclua os dois links no PDF único.

Rubrica FIAP: páginas 92–101. IA generativa auxiliou a organização e documentação, a serem revisadas e defendidas pelo grupo.
