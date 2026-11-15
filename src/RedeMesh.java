import java.util.ArrayList;

public class RedeMesh {

    private ArrayList<Dispositivo> dispositivos;

    public RedeMesh() {
        dispositivos = new ArrayList<>();
    }

    public void adicionarDispositivo(Dispositivo dispositivo) {
        dispositivos.add(dispositivo);
        System.out.println("Dispositivo adicionado à rede.");
    }

    public void listarDispositivos() {
        System.out.println("\n--- DISPOSITIVOS DA REDE ---");

        if (dispositivos.isEmpty()) {
            System.out.println("Nenhum dispositivo encontrado.");
            return;
        }

        for (Dispositivo dispositivo : dispositivos) {
            dispositivo.exibirInformacoes();
        }
    }

    public boolean verificarConexao(String identificador) {

        for (Dispositivo dispositivo : dispositivos) {

            if (dispositivo.getIdentificador().equalsIgnoreCase(identificador)) {
                return dispositivo.isConectado();
            }
        }

        return false;
    }

    public int quantidadeDispositivos() {
        return dispositivos.size();
    }

    public void removerDispositivo(String identificador) {

        for (int i = 0; i < dispositivos.size(); i++) {

            if (dispositivos.get(i).getIdentificador()
                    .equalsIgnoreCase(identificador)) {

                dispositivos.remove(i);
                System.out.println("Dispositivo removido da rede.");
                return;
            }
        }

        System.out.println("Dispositivo não encontrado.");
    }
}