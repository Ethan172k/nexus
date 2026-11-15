import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

/** Adaptador local do chatbot. As classes do terminal original não são alteradas. */
public class GatewayNexus {
    private final Central central = new Central();
    private final RedeMesh rede = new RedeMesh();
    private final Dispositivo rele = new Dispositivo("RELE_DEMO", "Nó simulado");
    private final Map<Integer, Registro> pedidos = new TreeMap<>();
    private final Path diretorio;
    private int proximo = 1;

    record Registro(PedidoSOS pedido, Properties dados) {}

    GatewayNexus(Path diretorio) throws IOException {
        this.diretorio = diretorio;
        Files.createDirectories(diretorio);
        rede.adicionarDispositivo(rele);
        try (var arquivos = Files.newDirectoryStream(diretorio, "*.properties")) {
            for (Path arquivo : arquivos) {
                Properties dados = new Properties();
                try (var entrada = Files.newInputStream(arquivo)) { dados.load(entrada); }
                PedidoSOS pedido = criar(dados);
                if ("true".equals(dados.getProperty("recebido"))) central.receberPedido(pedido);
                pedidos.put(pedido.getProtocolo(), new Registro(pedido, dados));
                proximo = Math.max(proximo, pedido.getProtocolo() + 1);
            }
        }
    }

    private static PedidoSOS criar(Properties d) {
        var pedido = new PedidoSOS(Integer.parseInt(d.getProperty("id")), "Não informado",
            d.getProperty("localizacao"), d.getProperty("evento") + " | Risco: " + d.getProperty("risco"),
            Integer.parseInt(d.getProperty("pessoas")));
        // Zero significa quantidade desconhecida na interface, nunca zero vítimas.
        pedido.definirPrioridade(switch (d.getProperty("risco")) {
            case "imediato" -> "Urgente";
            case "sem_imediato" -> "Normal";
            default -> "A verificar";
        });
        return pedido;
    }

    private void gravar(Properties dados) throws IOException {
        Path destino = diretorio.resolve(dados.getProperty("id") + ".properties");
        Path temporario = Files.createTempFile(diretorio, "sos-", ".tmp");
        try {
            try (var saida = Files.newOutputStream(temporario)) { dados.store(saida, "NEXUS prototipo"); }
            Files.move(temporario, destino, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } finally { Files.deleteIfExists(temporario); }
    }

    private static String json(PedidoSOS p) {
        boolean recebeu = !"Pendente".equals(p.getStatus());
        return "{\"protocolo\":" + p.getProtocolo() + ",\"prioridade\":\"" +
            p.getPrioridade() + "\",\"recebido\":" + recebeu + "}";
    }

    private synchronized String executar(String rota, Map<String, String> dados) throws IOException {
        String dono = dados.getOrDefault("dono", "");
        if (!dono.matches("(web|telegram):[A-Za-z0-9_-]{1,80}")) throw new IllegalArgumentException();
        if (rota.equals("/pedidos")) {
            String operacao = dados.getOrDefault("operacao", "");
            String evento = dados.getOrDefault("evento", "");
            String local = dados.getOrDefault("localizacao", "").strip();
            String risco = dados.getOrDefault("risco", "");
            int pessoas = Integer.parseInt(dados.getOrDefault("pessoas", "-1"));
            if (!operacao.matches("[A-Za-z0-9_-]{1,80}") || local.length() < 4 || local.length() > 200 ||
                pessoas < 0 || pessoas > 999 || !Set.of("Enchente", "Terremoto", "Apagão", "Outra emergência").contains(evento) ||
                !Set.of("imediato", "sem_imediato", "incerto").contains(risco)) throw new IllegalArgumentException();

            for (var r : pedidos.values()) {
                if (dono.equals(r.dados.getProperty("dono")) && operacao.equals(r.dados.getProperty("operacao")))
                    return json(r.pedido);
            }
            var salvo = new Properties();
            salvo.setProperty("id", Integer.toString(proximo));
            for (String campo : List.of("dono", "operacao", "evento", "risco", "pessoas"))
                salvo.setProperty(campo, dados.get(campo));
            salvo.setProperty("localizacao", local);
            salvo.setProperty("recebido", "false");
            var pedido = criar(salvo);
            gravar(salvo);
            pedidos.put(proximo++, new Registro(pedido, salvo));
            return json(pedido);
        }
        if (rota.equals("/ultimo")) {
            Registro ultimo = null;
            for (var r : pedidos.values()) if (dono.equals(r.dados.getProperty("dono"))) ultimo = r;
            return ultimo == null ? null : json(ultimo.pedido);
        }
        int id = Integer.parseInt(dados.getOrDefault("protocolo", "0"));
        var r = pedidos.get(id);
        if (r == null || !dono.equals(r.dados.getProperty("dono"))) return null;
        if (rota.equals("/retransmitir") && "Pendente".equals(r.pedido.getStatus())) {
            if ("true".equals(dados.get("rotaAtiva"))) rele.conectar();
            else rele.desconectar();
            if (rede.verificarConexao(rele.getIdentificador())) {
                var salvo = new Properties();
                salvo.putAll(r.dados);
                salvo.setProperty("recebido", "true");
                gravar(salvo);
                central.receberPedido(r.pedido);
                pedidos.put(id, new Registro(r.pedido, salvo));
            }
        }
        return json(r.pedido);
    }

    private static Map<String, String> formulario(byte[] bytes) {
        var resultado = new HashMap<String, String>();
        for (String par : new String(bytes, StandardCharsets.UTF_8).split("&")) {
            String[] kv = par.split("=", 2);
            if (kv.length == 2)
                resultado.put(URLDecoder.decode(kv[0], StandardCharsets.UTF_8),
                    URLDecoder.decode(kv[1], StandardCharsets.UTF_8));
        }
        return resultado;
    }

    private void atender(HttpExchange req) throws IOException {
        int codigo = 200;
        String resposta;
        String rota = req.getRequestURI().getPath();
        try {
            if (rota.equals("/health") && req.getRequestMethod().equals("GET")) resposta = "{\"ok\":true}";
            else if (!Set.of("/pedidos", "/status", "/ultimo", "/retransmitir").contains(rota)) {
                codigo = 404; resposta = "{\"erro\":\"nao_encontrado\"}";
            } else if (!req.getRequestMethod().equals("POST")) {
                codigo = 405; resposta = "{\"erro\":\"metodo\"}";
            } else {
                var bytes = req.getRequestBody().readNBytes(8193);
                if (bytes.length > 8192) throw new IllegalArgumentException();
                resposta = executar(rota, formulario(bytes));
                if (resposta == null) { codigo = 404; resposta = "{\"erro\":\"nao_encontrado\"}"; }
            }
        } catch (IllegalArgumentException erro) {
            codigo = 400; resposta = "{\"erro\":\"dados_invalidos\"}";
        } catch (IOException erro) {
            codigo = 503; resposta = "{\"erro\":\"falha_no_armazenamento\"}";
            System.err.println("Falha ao acessar a fila local.");
        }
        byte[] saida = resposta.getBytes(StandardCharsets.UTF_8);
        req.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        req.getResponseHeaders().set("Cache-Control", "no-store");
        req.sendResponseHeaders(codigo, saida.length);
        try (var stream = req.getResponseBody()) { stream.write(saida); }
    }

    public static void main(String[] args) throws Exception {
        int porta = args.length > 0 ? Integer.parseInt(args[0]) : 8787;
        Path dados = Path.of(args.length > 1 ? args[1] : ".nexus-data/sos");
        var app = new GatewayNexus(dados);
        var servidor = HttpServer.create(new InetSocketAddress("127.0.0.1", porta), 0);
        servidor.createContext("/", app::atender);
        servidor.start();
        System.out.println("Java NEXUS disponível no loopback, porta " + porta);
    }
}
