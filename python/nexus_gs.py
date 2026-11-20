import json
import os
import csv
import unicodedata
import tempfile
from datetime import datetime


ARQUIVO_DADOS = "nexus_dados.json"
ARQUIVO_RELATORIO = "relatorio_nexus.csv"

STATUS_PENDENTE = "Aguardando rota"
STATUS_RECEBIDO = "Recebido pela central simulada"
STATUS_ATENDIMENTO = "Em atendimento"
STATUS_RESOLVIDO = "Resolvido"

DISPOSITIVOS = [
    "CELULAR_1",
    "CELULAR_2",
    "CELULAR_3",
    "RADIO_1",
    "CENTRAL"
]


# ==========================================
# FUNCOES AUXILIARES
# ==========================================

def remover_acentos(texto):
    texto = unicodedata.normalize("NFD", texto)
    caracteres = []
    for caractere in texto:
        if unicodedata.category(caractere) != "Mn":
            caracteres.append(caractere)
    return "".join(caracteres).lower()


def criar_conexoes():
    conexoes = [
        {"a": "CELULAR_1", "b": "CELULAR_2", "ativa": True},
        {"a": "CELULAR_2", "b": "CELULAR_3", "ativa": True},
        {"a": "CELULAR_3", "b": "RADIO_1", "ativa": True},
        {"a": "RADIO_1", "b": "CENTRAL", "ativa": True},
        {"a": "CELULAR_1", "b": "RADIO_1", "ativa": True},
        {"a": "CELULAR_2", "b": "RADIO_1", "ativa": True}
    ]

    return conexoes


def exibir_titulo(titulo):
    print("\n" + "=" * 55)
    print(titulo.center(55))
    print("=" * 55)


def obter_texto(mensagem):
    while True:
        texto = input(mensagem).strip()

        if texto != "":
            return texto
        else:
            print("Essa informacao nao pode ficar vazia.")


def obter_numero(mensagem):
    while True:
        try:
            numero = int(input(mensagem))

            if numero > 0:
                return numero
            else:
                print("Digite um numero maior que zero.")

        except ValueError:
            print("Digite apenas numeros inteiros.")


def gerar_id(pedidos):
    maior_id = 0

    for pedido in pedidos:
        if pedido["protocolo"] > maior_id:
            maior_id = pedido["protocolo"]

    return maior_id + 1


def adicionar_historico(pedido, mensagem):
    registro = {
        "data": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
        "mensagem": mensagem
    }

    pedido["historico"].append(registro)


# ==========================================
# ARMAZENAMENTO DE DADOS
# ==========================================

def carregar_dados():
    pedidos = []
    conexoes = criar_conexoes()

    if os.path.exists(ARQUIVO_DADOS):
        try:
            with open(ARQUIVO_DADOS, "r", encoding="utf-8") as arquivo:
                dados = json.load(arquivo)

                if isinstance(dados, dict):
                    pedidos = dados.get("pedidos", [])
                    conexoes = dados.get(
                        "conexoes",
                        criar_conexoes()
                    )

                elif isinstance(dados, list):
                    pedidos = dados

        except (json.JSONDecodeError, OSError):
            print("Nao foi possivel carregar os dados anteriores.")

    # Arquivos criados pela versão original continuam consultáveis.
    for pedido in pedidos:
        if pedido["status"] == "Recebido pela central":
            pedido["status"] = STATUS_RECEBIDO

    return pedidos, conexoes


def salvar_dados(pedidos, conexoes):
    dados = {
        "pedidos": pedidos,
        "conexoes": conexoes
    }

    temporario = None
    try:
        # O arquivo anterior permanece intacto se a escrita falhar.
        destino = os.path.abspath(ARQUIVO_DADOS)
        descritor, temporario = tempfile.mkstemp(
            dir=os.path.dirname(destino), prefix=".nexus-", suffix=".tmp"
        )
        with os.fdopen(descritor, "w", encoding="utf-8") as arquivo:
            json.dump(
                dados,
                arquivo,
                indent=4,
                ensure_ascii=False
            )
            arquivo.flush()
            os.fsync(arquivo.fileno())
        os.replace(temporario, destino)
        return True
    except OSError:
        print("Erro ao salvar os dados. A alteração não foi aplicada.")
        return False
    finally:
        if temporario is not None and os.path.exists(temporario):
            try:
                os.unlink(temporario)
            except OSError:
                pass


# ==========================================
# CLASSIFICACAO DE PRIORIDADE
# ==========================================

def calcular_prioridade(pessoas, descricao):
    descricao = remover_acentos(descricao)

    palavras_criticas = [
        "enchente",
        "afogamento",
        "desabamento",
        "preso",
        "incendio",
        "risco de morte",
        "soterrado",
        "ferido grave"
    ]

    palavras_altas = [
        "ferido",
        "machucado",
        "falta de agua",
        "isolado",
        "doente",
        "sem alimento"
    ]

    for palavra in palavras_criticas:
        if palavra in descricao:
            return "CRITICA"

    if pessoas >= 5:
        return "CRITICA"

    for palavra in palavras_altas:
        if palavra in descricao:
            return "ALTA"

    if pessoas >= 2:
        return "ALTA"

    return "MODERADA"


# ==========================================
# REDE MESH
# ==========================================

def montar_rede(conexoes):
    rede = {}

    for dispositivo in DISPOSITIVOS:
        rede[dispositivo] = []

    for conexao in conexoes:
        if conexao["ativa"]:
            origem = conexao["a"]
            destino = conexao["b"]

            rede[origem].append(destino)
            rede[destino].append(origem)

    return rede


def encontrar_caminho(origem, destino, conexoes):
    rede = montar_rede(conexoes)

    fila = [origem]
    visitados = [origem]
    anteriores = {}

    while len(fila) > 0:
        atual = fila.pop(0)

        if atual == destino:
            caminho = []
            ponto = destino

            while ponto != origem:
                caminho.insert(0, ponto)
                ponto = anteriores[ponto]

            caminho.insert(0, origem)

            return caminho

        for vizinho in rede[atual]:
            if vizinho not in visitados:
                visitados.append(vizinho)
                anteriores[vizinho] = atual
                fila.append(vizinho)

    return []


def mostrar_dispositivos():
    exibir_titulo("DISPOSITIVOS DA REDE NEXUS")

    for dispositivo in DISPOSITIVOS:
        if dispositivo == "CENTRAL":
            print(f"{dispositivo} - Central de resgate simulada")
        elif dispositivo.startswith("RADIO"):
            print(f"{dispositivo} - Equipamento de comunicacao")
        else:
            print(f"{dispositivo} - Dispositivo de usuario")


def mostrar_conexoes(conexoes):
    exibir_titulo("CONEXOES DA REDE")

    for i, conexao in enumerate(conexoes):
        if conexao["ativa"]:
            situacao = "ATIVA"
        else:
            situacao = "INATIVA"

        print(
            f"{i + 1}. {conexao['a']} <--> "
            f"{conexao['b']} | {situacao}"
        )


def alterar_conexao(conexoes, pedidos):
    mostrar_conexoes(conexoes)

    print("\nDigite o numero da conexao que deseja alterar.")
    numero = obter_numero("Conexao: ")

    if numero <= len(conexoes):
        indice = numero - 1

        conexoes[indice]["ativa"] = (
            not conexoes[indice]["ativa"]
        )

        if not salvar_dados(pedidos, conexoes):
            conexoes[indice]["ativa"] = not conexoes[indice]["ativa"]
            return

        if conexoes[indice]["ativa"]:
            print("Conexao ativada!")
        else:
            print("Conexao desativada!")

    else:
        print("Conexao nao encontrada.")


def encaminhar_pedido(pedido, conexoes):
    origem = pedido["dispositivo"]

    caminho = encontrar_caminho(
        origem,
        "CENTRAL",
        conexoes
    )

    if len(caminho) > 0:
        pedido["caminho"] = caminho
        pedido["status"] = STATUS_RECEBIDO

        texto_caminho = " -> ".join(caminho)

        adicionar_historico(
            pedido,
            f"SOS encaminhado pela rede simulada: {texto_caminho}"
        )
        return True

    else:
        pedido["status"] = STATUS_PENDENTE
        pedido["caminho"] = []

        adicionar_historico(
            pedido,
            "Não foi encontrada uma rota até a central simulada."
        )
        return False


def exibir_resultado_encaminhamento(pedido):
    if pedido["status"] == STATUS_RECEBIDO:
        print("\nSOS recebido pela central simulada.")
        print("Rota simulada: " + " -> ".join(pedido["caminho"]))
    else:
        print("\nSem rota disponível até a central simulada.")
        print("SOS salvo localmente. Status: Aguardando rota.")


# ==========================================
# CADASTRO DE SOS
# ==========================================

def cadastrar_sos(pedidos, conexoes):
    exibir_titulo("CADASTRAR PEDIDO DE SOCORRO")

    mostrar_dispositivos()

    dispositivo = obter_texto(
        "\nEm qual dispositivo o pedido sera criado? "
    ).upper()

    if dispositivo not in DISPOSITIVOS:
        print("Dispositivo nao encontrado.")
        return

    if dispositivo == "CENTRAL":
        print("Escolha um dispositivo de usuario ou radio.")
        return

    nome = obter_texto("Nome da pessoa: ")
    localizacao = obter_texto("Localizacao: ")
    descricao = obter_texto("Descreva a emergencia: ")
    pessoas = obter_numero("Quantidade de pessoas em risco: ")

    prioridade = calcular_prioridade(
        pessoas,
        descricao
    )

    pedido = {
        "protocolo": gerar_id(pedidos),
        "nome": nome,
        "localizacao": localizacao,
        "descricao": descricao,
        "pessoas": pessoas,
        "prioridade": prioridade,
        "dispositivo": dispositivo,
        "status": STATUS_PENDENTE,
        "caminho": [],
        "data": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
        "historico": []
    }

    adicionar_historico(
        pedido,
        "Pedido de socorro cadastrado."
    )

    encaminhar_pedido(pedido, conexoes)
    if not salvar_dados(pedidos + [pedido], conexoes):
        print("SOS não registrado. Nenhum protocolo foi confirmado.")
        return

    pedidos.append(pedido)
    print("\nPedido cadastrado com sucesso!")
    print(f"Protocolo: {pedido['protocolo']}")
    print(f"Prioridade: {prioridade}")

    exibir_resultado_encaminhamento(pedido)


# ==========================================
# CONSULTAS
# ==========================================

def localizar_pedido(pedidos, protocolo):
    for pedido in pedidos:
        if pedido["protocolo"] == protocolo:
            return pedido

    return None


def exibir_pedido(pedido):
    print("\n" + "-" * 50)
    print(f"PROTOCOLO: {pedido['protocolo']}")
    print(f"Nome: {pedido['nome']}")
    print(f"Localizacao: {pedido['localizacao']}")
    print(f"Descricao: {pedido['descricao']}")
    print(f"Pessoas: {pedido['pessoas']}")
    print(f"Prioridade: {pedido['prioridade']}")
    print(f"Dispositivo de origem: {pedido['dispositivo']}")
    print(f"Status: {pedido['status']}")

    if len(pedido["caminho"]) > 0:
        print("Caminho: " + " -> ".join(pedido["caminho"]))
    else:
        print("Caminho: ainda nao encontrado")

    print(f"Data: {pedido['data']}")
    print("-" * 50)


def consultar_todos(pedidos):
    exibir_titulo("TODOS OS PEDIDOS")

    if len(pedidos) == 0:
        print("Nenhum pedido cadastrado.")
        return

    for pedido in pedidos:
        exibir_pedido(pedido)


def consultar_por_protocolo(pedidos):
    protocolo = obter_numero("Digite o protocolo: ")

    pedido = localizar_pedido(pedidos, protocolo)

    if pedido is not None:
        exibir_pedido(pedido)
    else:
        print("Protocolo nao encontrado.")


def consultar_por_status(pedidos):
    exibir_titulo("CONSULTAR POR STATUS")

    print("1 - Aguardando rota")
    print("2 - Recebido pela central simulada")
    print("3 - Em atendimento")
    print("4 - Resolvido")

    opcao = obter_numero("Escolha: ")

    match opcao:
        case 1:
            status = STATUS_PENDENTE
        case 2:
            status = STATUS_RECEBIDO
        case 3:
            status = STATUS_ATENDIMENTO
        case 4:
            status = STATUS_RESOLVIDO
        case _:
            print("Opcao invalida.")
            return

    encontrou = False

    for pedido in pedidos:
        if pedido["status"] == status:
            exibir_pedido(pedido)
            encontrou = True

    if not encontrou:
        print("Nenhum pedido encontrado nesse status.")


def consultar_historico(pedidos):
    protocolo = obter_numero("Digite o protocolo: ")

    pedido = localizar_pedido(pedidos, protocolo)

    if pedido is None:
        print("Protocolo nao encontrado.")
        return

    exibir_titulo("HISTORICO DA OCORRENCIA")

    for registro in pedido["historico"]:
        print(
            f"{registro['data']} - "
            f"{registro['mensagem']}"
        )


# ==========================================
# ENCAMINHAMENTO DE PEDIDOS PENDENTES
# ==========================================

def tentar_encaminhar_pendentes(pedidos, conexoes):
    exibir_titulo("TENTANDO ENCAMINHAR PEDIDOS")

    atualizados = pedidos.copy()
    resultados = []
    for i, pedido in enumerate(pedidos):
        if pedido["status"] == STATUS_PENDENTE:
            novo = pedido.copy()
            novo["historico"] = pedido["historico"].copy()
            encaminhar_pedido(novo, conexoes)
            atualizados[i] = novo
            resultados.append(novo)

    if not resultados:
        print("Nao existem pedidos aguardando rota.")
        return

    if not salvar_dados(atualizados, conexoes):
        return
    pedidos[:] = atualizados
    for pedido in resultados:
        print(f"\nProtocolo: {pedido['protocolo']}")
        exibir_resultado_encaminhamento(pedido)


# ==========================================
# ATUALIZAR ATENDIMENTO
# ==========================================

def atualizar_status(pedidos, conexoes):
    protocolo = obter_numero("Digite o protocolo: ")

    pedido = localizar_pedido(pedidos, protocolo)

    if pedido is None:
        print("Protocolo nao encontrado.")
        return

    if pedido["status"] == STATUS_PENDENTE:
        print("Esse pedido ainda não chegou à central simulada.")
        return

    exibir_titulo("ATUALIZAR ATENDIMENTO")

    print("1 - Em atendimento")
    print("2 - Resolvido")

    opcao = obter_numero("Escolha: ")

    match opcao:
        case 1:
            novo_status = STATUS_ATENDIMENTO
        case 2:
            novo_status = STATUS_RESOLVIDO
        case _:
            print("Opcao invalida.")
            return

    status_anterior = pedido["status"]
    pedido["status"] = novo_status
    adicionar_historico(pedido, f"Status alterado na simulação para: {novo_status}")
    if salvar_dados(pedidos, conexoes):
        print("Status atualizado com sucesso!")
    else:
        pedido["status"] = status_anterior
        pedido["historico"].pop()


# ==========================================
# ESTATISTICAS
# ==========================================

def consultar_estatisticas(pedidos):
    total = len(pedidos)

    criticas = 0
    altas = 0
    moderadas = 0

    pendentes = 0
    recebidos = 0
    em_atendimento = 0
    resolvidos = 0

    for pedido in pedidos:

        if pedido["prioridade"] == "CRITICA":
            criticas += 1

        elif pedido["prioridade"] == "ALTA":
            altas += 1

        else:
            moderadas += 1

        if pedido["status"] == STATUS_PENDENTE:
            pendentes += 1

        elif pedido["status"] == STATUS_RECEBIDO:
            recebidos += 1

        elif pedido["status"] == STATUS_ATENDIMENTO:
            em_atendimento += 1

        elif pedido["status"] == STATUS_RESOLVIDO:
            resolvidos += 1

    exibir_titulo("ESTATISTICAS DO NEXUS")

    print(f"Total de ocorrencias: {total}")

    print("\n--- PRIORIDADES ---")
    print(f"Prioridade critica: {criticas}")
    print(f"Prioridade alta: {altas}")
    print(f"Prioridade moderada: {moderadas}")

    print("\n--- STATUS ---")
    print(f"Aguardando rota: {pendentes}")
    print(f"Recebidas pela central simulada: {recebidos}")
    print(f"Em atendimento: {em_atendimento}")
    print(f"Resolvidas: {resolvidos}")

    soma_status = (
        pendentes
        + recebidos
        + em_atendimento
        + resolvidos
    )

    print(f"\nSoma dos status: {soma_status}")

    if soma_status == total:
        print("Todas as ocorrencias foram contabilizadas.")
    else:
        print("Atencao: existem ocorrencias sem status contabilizado.")


# ==========================================
# EXPORTACAO CSV
# ==========================================

def exportar_relatorio(pedidos):
    if len(pedidos) == 0:
        print("Nao existem dados para exportar.")
        return

    try:
        with open(
            ARQUIVO_RELATORIO,
            "w",
            newline="",
            encoding="utf-8-sig"
        ) as arquivo:

            campos = [
                "protocolo",
                "nome",
                "localizacao",
                "descricao",
                "pessoas",
                "prioridade",
                "dispositivo",
                "status",
                "caminho",
                "data"
            ]

            escritor = csv.DictWriter(
                arquivo,
                fieldnames=campos
            )

            escritor.writeheader()

            for pedido in pedidos:
                linha = pedido.copy()

                # CORRECAO: remove o historico da copia
                # sem alterar o pedido original.
                linha.pop("historico", None)

                linha["caminho"] = " -> ".join(
                    pedido["caminho"]
                )

                escritor.writerow(linha)

        print(f"Relatorio criado: {ARQUIVO_RELATORIO}")

    except OSError:
        print("Nao foi possivel criar o relatorio.")


# ==========================================
# MENU DE CONSULTAS
# ==========================================

def menu_consultas(pedidos):
    while True:
        exibir_titulo("CONSULTAS")

        print("1 - Consultar todos os pedidos")
        print("2 - Consultar por protocolo")
        print("3 - Consultar por status")
        print("4 - Consultar historico")
        print("0 - Voltar")

        opcao = input("Escolha: ")

        match opcao:
            case "1":
                consultar_todos(pedidos)

            case "2":
                consultar_por_protocolo(pedidos)

            case "3":
                consultar_por_status(pedidos)

            case "4":
                consultar_historico(pedidos)

            case "0":
                break

            case _:
                print("Opcao invalida.")

        input("\nPressione ENTER para continuar...")


# ==========================================
# MENU DA REDE
# ==========================================

def menu_rede(pedidos, conexoes):
    while True:
        exibir_titulo("GERENCIAMENTO DA REDE MESH SIMULADA")

        print("1 - Mostrar dispositivos")
        print("2 - Mostrar conexoes")
        print("3 - Ativar ou desativar conexao")
        print("4 - Tentar encaminhar pedidos pendentes")
        print("0 - Voltar")

        opcao = input("Escolha: ")

        match opcao:
            case "1":
                mostrar_dispositivos()

            case "2":
                mostrar_conexoes(conexoes)

            case "3":
                alterar_conexao(conexoes, pedidos)

            case "4":
                tentar_encaminhar_pendentes(
                    pedidos,
                    conexoes
                )

            case "0":
                break

            case _:
                print("Opcao invalida.")

        input("\nPressione ENTER para continuar...")


# ==========================================
# MENU PRINCIPAL
# ==========================================

def menu_principal():
    pedidos, conexoes = carregar_dados()
    print("Protótipo acadêmico. Não envia mensagens nem aciona resgate real.")
    print("Use apenas dados fictícios nesta simulação.")

    while True:
        exibir_titulo("NEXUS - SIMULADOR DE REDE DE EMERGÊNCIA")

        print("1 - Cadastrar pedido de SOS")
        print("2 - Consultar ocorrencias")
        print("3 - Gerenciar rede de dispositivos")
        print("4 - Atualizar atendimento")
        print("5 - Consultar estatisticas")
        print("6 - Exportar relatorio")
        print("0 - Encerrar sistema")

        opcao = input("\nEscolha uma opcao: ")

        match opcao:
            case "1":
                cadastrar_sos(pedidos, conexoes)

            case "2":
                menu_consultas(pedidos)

            case "3":
                menu_rede(pedidos, conexoes)

            case "4":
                atualizar_status(pedidos, conexoes)

            case "5":
                consultar_estatisticas(pedidos)

            case "6":
                exportar_relatorio(pedidos)

            case "0":
                print("NEXUS encerrado.")
                break

            case _:
                print("Opcao invalida.")

        input("\nPressione ENTER para continuar...")


if __name__ == "__main__":
    menu_principal()
