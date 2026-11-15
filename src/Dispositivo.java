public class Dispositivo {

    private String identificador;
    private String tipo;
    private boolean conectado;

    public Dispositivo(String identificador, String tipo) {
        this.identificador = identificador;
        this.tipo = tipo;
        this.conectado = true;
    }

    public void conectar() {
        conectado = true;
        System.out.println(identificador + " conectado à rede.");
    }

    public void desconectar() {
        conectado = false;
        System.out.println(identificador + " desconectado da rede.");
    }

    public void exibirInformacoes() {
        System.out.println("\n--- DISPOSITIVO ---");
        System.out.println("Identificador: " + identificador);
        System.out.println("Tipo: " + tipo);
        System.out.println("Conectado: " + (conectado ? "Sim" : "Não"));
    }

    public String getIdentificador() {
        return identificador;
    }

    public String getTipo() {
        return tipo;
    }

    public boolean isConectado() {
        return conectado;
    }
}