# Banco de Dados | NEXUS

Proposta acadêmica de modelagem relacional, não um banco já integrado. O gateway Java atual usa arquivos locais. A demonstração não transmite por rádio, Bluetooth ou Wi-Fi Direct e não aciona equipes.

## Cenário e beneficiários

Um morador afetado por enchente informa localização, quantidade de pessoas e risco. Ao confirmar, recebe um protocolo e vê que o pedido foi salvo localmente. Sem rota, o teste não muda o status. Ao ativar a rota da demo e testar novamente, o mesmo protocolo aparece como recebido pela central simulada. A proposta beneficia cidadãos afetados e, num piloto futuro, quem acompanhar os pedidos.

## Modelo descritivo e regras

1. **RN01 — Confirmar para salvar.** Rascunho não gera pedido, protocolo nem histórico. A confirmação cria o pedido, a localização e o primeiro evento SALVO_LOCAL na mesma operação.
2. **RN02 — Manter o protocolo.** O protocolo é único na instalação. Repetir a mesma confirmação na mesma sessão não duplica o registro. Consultas são limitadas à sessão de origem.
3. **RN03 — Registrar tentativas.** Um SOS pode ter várias tentativas. SEM_ROTA não muda o estado. O registro de todas as tentativas é parte da proposta relacional, não persistência já implementada.
4. **RN04 — Receber na simulação.** Uma tentativa concluída gera RECEBIDO_SIMULADO para o mesmo SOS, com referência à tentativa. Essa transição ocorre no máximo uma vez no escopo inicial. Nenhuma equipe é acionada.
5. **RN05 — Separar estado de prioridade.** Risco imediato sugere Urgente; sem risco imediato, Normal; risco incerto, A verificar. Prioridade não comprova despacho nem recebimento.
6. **RN06 — Preservar o relato.** O texto da localização é obrigatório. Componentes estruturados são opcionais e não devem ser inferidos. Na versão atual, 0 pessoas significa quantidade desconhecida.

## DER conceitual

[Ver o diagrama de entidades e relacionamentos](diagramas/der-conceitual.png).

- Localização (1) — (1) Pedido SOS. Localização é um retrato do relato associado àquele SOS.
- Pedido SOS (1) — (0..N) Tentativa de retransmissão.
- Nó de comunicação (0..1) — (0..N) Tentativa de retransmissão.
- Pedido SOS (1) — (1..N) Histórico de status. A cardinalidade admite evolução; no escopo inicial, três tentativas sem rota, por exemplo, não criam três mudanças de estado.
- Tentativa de retransmissão (0..1) — (0..1) Histórico de status.

Não se cria N:N artificial. As tentativas já relacionam pedidos a nós quando existe rota.

## Modelo lógico

[Ver o diagrama lógico de tabelas e chaves](diagramas/modelo-logico.png).

[modelo.json](modelo.json) é a fonte do dicionário de dados, com cinco entidades, cardinalidades, tipos, PK, FK, unicidade e critérios CHECK. TIMESTAMPTZ representa um tipo temporal com fuso, não obriga adoção de um SGBD.

**Integridade entre linhas.** A localização é criada junto com o pedido e não é compartilhada (FK única). SEM_ROTA exige nó nulo e RECEBIDO_SIMULADO exige nó preenchido. Em uma implementação futura, uma FK composta por pedido e tentativa verifica que ambos se referem ao mesmo SOS. A transação verifica o resultado, grava a alteração e impede duplicidade. O estado atual é o evento mais recente ordenado por data e ID. No escopo inicial, uma restrição UNIQUE(pedido, status) protege a unicidade do evento inicial e da confirmação simulada. A transação garante que cada pedido tenha seu evento inicial.

**Exemplo fictício.** Protocolo 42: 14h00 SALVO_LOCAL → 14h02 tentativa SEM_ROTA (sem mudança) → 14h05 RECEBIDO_SIMULADO após teste com rota. A entrega é de modelagem. Os diagramas representam a mesma proposta documentada no PDF da disciplina.

Base: [gateway Java](../../src/GatewayNexus.java). Rubrica FIAP: páginas 30–35. IA generativa auxiliou a organização e documentação, a serem revisadas e defendidas pelo grupo.
