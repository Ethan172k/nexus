import java.util.ArrayList;

public class PedidoSOS {

    private int protocolo;
    private String nome;
    private String localizacao;
    private String descricao;
    private int pessoas;
    private String prioridade;
    private String status;
    private ArrayList<String> historico;

    public PedidoSOS(int protocolo, String nome, String localizacao,
                     String descricao, int pessoas) {

        this.protocolo = protocolo;
        this.nome = nome;
        this.localizacao = localizacao;
        this.descricao = descricao;
        this.pessoas = pessoas;
        this.prioridade = "Normal";
        this.status = "Pendente";
        this.historico = new ArrayList<>();

        historico.add("Pedido de SOS registrado.");
    }

    public void definirPrioridade(String prioridade) {
        this.prioridade = prioridade;
    }

    public void atualizarStatus(String novoStatus) {
        this.status = novoStatus;
        historico.add("Status atualizado para: " + novoStatus);
    }

    public void adicionarHistorico(String mensagem) {
        historico.add(mensagem);
    }

    public void exibirPedido() {
        System.out.println("\n--- PEDIDO DE SOCORRO ---");
        System.out.println("Protocolo: " + protocolo);
        System.out.println("Nome: " + nome);
        System.out.println("Localização: " + localizacao);
        System.out.println("Descrição: " + descricao);
        System.out.println("Pessoas: " + pessoas);
        System.out.println("Prioridade: " + prioridade);
        System.out.println("Status: " + status);
        System.out.println("Histórico: " + historico);
    }

    public int getProtocolo() {
        return protocolo;
    }

    public String getStatus() {
        return status;
    }

    public String getPrioridade() {
        return prioridade;
    }
}