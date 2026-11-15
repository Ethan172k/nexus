import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;

public class Relatorio {

    public void exportarCSV(ArrayList<PedidoSOS> pedidos) {

        try {
            PrintWriter arquivo = new PrintWriter(
                    new FileWriter("relatorio_nexus.csv")
            );

            arquivo.println("Protocolo;Status;Prioridade");

            for (PedidoSOS pedido : pedidos) {

                arquivo.println(
                        pedido.getProtocolo() + ";" +
                                pedido.getStatus() + ";" +
                                pedido.getPrioridade()
                );
            }

            arquivo.close();

            System.out.println("Relatório exportado com sucesso!");
            System.out.println("Arquivo: relatorio_nexus.csv");

        } catch (IOException erro) {

            System.out.println("Erro ao gerar o relatório.");
        }
    }
}