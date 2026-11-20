# NEXUS | Guia da apresentação presencial de Front-End

## Abertura

> Imagine uma enchente em que o sinal cai. Ao pedir socorro, como saber se o SOS chegou? O NEXUS é um projeto acadêmico que explora como registrar um pedido e acompanhar seu estado. Este site reúne a proposta e um simulador visual.

## Sequência da demonstração

1. **Navegação.** Comecem no Início. Mostrem que o mesmo menu conecta as sete páginas e abram Como funciona e Tecnologias.
2. **Simulador visual.** Em Como funciona, cliquem em Enviar alerta. Mostrem a rota LoRa simulada, provoquem uma falha e observem como o mapa procura uma alternativa. Se todas as rotas de saída estiverem indisponíveis, mostrem o estado Sem rota disponível. Restaurem uma conexão e usem Enviar alerta de novo para demonstrar a nova tentativa. Encerrem com Restaurar rede, que cancela um envio em andamento ou agendado.
3. **Interações.** Abram e fechem o menu mobile. Mostrem uma busca ou um filtro no FAQ e alternem as abas de Tecnologias. Em Contato, tentem enviar com campos vazios, mostrem um e-mail inválido e depois simulem um envio com dados fictícios. Nenhuma mensagem é enviada.
4. **Responsividade.** Usem as ferramentas do navegador para mostrar celular (390 px), tablet (768 px) e desktop (1440 px). Confiram o menu, a legibilidade do mapa e o formulário. Mostrem pelo menos uma página relevante em cada tamanho.
5. **Explicação técnica.** Mostrem a estrutura semântica do HTML, os estilos externos e as Media Queries. Abram o código JavaScript do simulador e expliquem como o grafo guarda as conexões e como o caminho de menor custo é recalculado a partir dos links disponíveis. Mostrem o README e o histórico de commits do GitHub.
6. **Separação das demos.** Se quiserem mostrar o WebChat, abram a aplicação local separadamente. Registrem um SOS fictício, mostrem o protocolo e o estado Aguardando retransmissão. Só então habilitem a rota simulada e mostrem o mesmo protocolo recebido pela central simulada. O mapa do site não está conectado ao WebChat e nenhum dos dois aciona resgate real.

## Divisão entre os integrantes

Combinem quem conduz cada trecho. Os dois devem participar e explicar as partes em que realmente contribuíram. Deixem os dados de teste e as páginas abertas antes de começar.

## Fechamento

> O ponto principal é mostrar ao cidadão o que aconteceu com seu SOS. No protótipo, um pedido salvo no aparelho é diferente de um recebido pela central simulada.
