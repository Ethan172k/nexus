import java.util.ArrayList;
import java.util.Scanner;

public class SistemaNexus {

    private Scanner entrada;
    private ArrayList<PedidoSOS> pedidos;
    private RedeMesh rede;
    private Central central;
    private Estatisticas estatisticas;
    private Relatorio relatorio;
    private int proximoProtocolo;

    public SistemaNexus() {
        entrada = new Scanner(System.in);
        pedidos = new ArrayList<>();
        rede = new RedeMesh();
        central = new Central();
        estatisticas = new Estatisticas();
        relatorio = new Relatorio();
        proximoProtocolo = 1;

        rede.adicionarDispositivo(new Dispositivo("CELULAR_1", "Celular"));
        rede.adicionarDispositivo(new Dispositivo("CELULAR_2", "Celular"));
        rede.adicionarDispositivo(new Dispositivo("RADIO_1", "Radio"));
        rede.adicionarDispositivo(new Dispositivo("CENTRAL", "Central"));
    }

    public void iniciar() {

        int opcao;

        do {
            System.out.println("\n===== NEXUS =====");
            System.out.println("1 - Registrar pedido SOS");
            System.out.println("2 - Consultar pedidos");
            System.out.println("3 - Atualizar atendimento");
            System.out.println("4 - Listar dispositivos");
            System.out.println("5 - Mostrar estatisticas");
            System.out.println("6 - Exportar relatorio");
            System.out.println("0 - Sair");
            System.out.print("Escolha: ");

            opcao = entrada.nextInt();
            entrada.nextLine();

            switch (opcao) {
                case 1:
                    registrarPedido();
                    break;

                case 2:
                    central.listarPedidos();
                    break;

                case 3:
                    atualizarPedido();
                    break;

                case 4:
                    rede.listarDispositivos();
                    break;

                case 5:
                    estatisticas.gerarRelatorio(pedidos);
                    break;

                case 6:
                    relatorio.exportarCSV(pedidos);
                    break;

                case 0:
                    System.out.println("Encerrando o NEXUS...");
                    break;

                default:
                    System.out.println("Opcao invalida.");
            }

        } while (opcao != 0);
    }

    private void registrarPedido() {

        System.out.print("Nome: ");
        String nome = entrada.nextLine();

        System.out.print("Localizacao: ");
        String localizacao = entrada.nextLine();

        System.out.print("Descricao da emergencia: ");
        String descricao = entrada.nextLine();

        System.out.print("Quantidade de pessoas: ");
        int pessoas = entrada.nextInt();
        entrada.nextLine();

        PedidoSOS pedido = new PedidoSOS(
                proximoProtocolo,
                nome,
                localizacao,
                descricao,
                pessoas
        );

        pedidos.add(pedido);
        central.receberPedido(pedido);

        proximoProtocolo++;

        System.out.println("Pedido registrado com sucesso!");
    }

    private void atualizarPedido() {

        System.out.print("Digite o protocolo: ");
        int protocolo = entrada.nextInt();
        entrada.nextLine();

        System.out.println("1 - Em atendimento");
        System.out.println("2 - Resolvido");
        System.out.print("Novo status: ");

        int opcao = entrada.nextInt();
        entrada.nextLine();

        String status;

        if (opcao == 1) {
            status = "Em atendimento";
        } else if (opcao == 2) {
            status = "Resolvido";
        } else {
            System.out.println("Opcao invalida.");
            return;
        }

        central.atualizarAtendimento(protocolo, status);
    }
}