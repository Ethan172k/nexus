import java.util.ArrayList;

public class Estatisticas {

    public void gerarRelatorio(ArrayList<PedidoSOS> pedidos) {

        int pendentes = 0;
        int recebidos = 0;
        int emAtendimento = 0;
        int resolvidos = 0;
        int urgentes = 0;

        for (PedidoSOS pedido : pedidos) {

            switch (pedido.getStatus()) {
                case "Pendente":
                    pendentes++;
                    break;

                case "Recebido pela central":
                    recebidos++;
                    break;

                case "Em atendimento":
                    emAtendimento++;
                    break;

                case "Resolvido":
                    resolvidos++;
                    break;
            }

            if (pedido.getPrioridade().equalsIgnoreCase("Urgente")) {
                urgentes++;
            }
        }

        System.out.println("\n--- ESTATÍSTICAS DO NEXUS ---");
        System.out.println("Total de pedidos: " + pedidos.size());
        System.out.println("Pendentes: " + pendentes);
        System.out.println("Recebidos pela central: " + recebidos);
        System.out.println("Em atendimento: " + emAtendimento);
        System.out.println("Resolvidos: " + resolvidos);
        System.out.println("Pedidos urgentes: " + urgentes);
    }
}