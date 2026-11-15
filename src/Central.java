import java.util.ArrayList;

public class Central {

    private ArrayList<PedidoSOS> pedidos;

    public Central() {
        pedidos = new ArrayList<>();
    }

    public void receberPedido(PedidoSOS pedido) {
        pedidos.add(pedido);
        pedido.atualizarStatus("Recebido pela central");

        System.out.println("Pedido SOS recebido com sucesso!");
        System.out.println("Protocolo: " + pedido.getProtocolo());
    }

    public void listarPedidos() {

        System.out.println("\n--- PEDIDOS RECEBIDOS ---");

        if (pedidos.isEmpty()) {
            System.out.println("Nenhum pedido recebido.");
            return;
        }

        for (PedidoSOS pedido : pedidos) {
            pedido.exibirPedido();
        }
    }

    public void atualizarAtendimento(int protocolo, String novoStatus) {

        for (PedidoSOS pedido : pedidos) {

            if (pedido.getProtocolo() == protocolo) {
                pedido.atualizarStatus(novoStatus);
                System.out.println("Atendimento atualizado!");
                return;
            }
        }

        System.out.println("Protocolo não encontrado.");
    }

    public int quantidadePedidos() {
        return pedidos.size();
    }
}