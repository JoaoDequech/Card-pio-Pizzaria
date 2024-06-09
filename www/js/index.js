document.addEventListener('deviceready', aoDispositivoPronto, false);

let ID_PIZZARIA, dadosImagemAtual, listaPedidosAtual;

function aoDispositivoPronto() {
    console.log('Executando cordova-' + cordova.platformId + '@' + cordova.version);

    document.querySelectorAll(".btn-mudar-tela")
        .forEach(btn => btn.addEventListener("click", mudarTela));

    document.getElementById("salvar-pizza").addEventListener("click", salvarPizza);

    document.getElementById("deletar-pizza").addEventListener("click", deletarPizza);

    document.getElementById("btn-novo-pedido").addEventListener("click", () => alternarFormularioEdicao());

    document.getElementById("tirar-foto").addEventListener("click", tirarFoto);

    dadosImagemAtual = "";
    ID_PIZZARIA = "Dequechito's Fazzbear";
    listaPedidosAtual = [];

    listarPedidos();
}

function mudarTela(event) {
    let { telaDestino, telaOrigem } = event.target.dataset;

    document.getElementById(telaOrigem).classList.add("escondido");
    document.getElementById(telaDestino).classList.remove("escondido");

    dadosImagemAtual = "";
}

function listarPedidos() {
    cordova.plugin.http.get("https://pedidos-pizzaria.glitch.me/admin/pizzas/" + ID_PIZZARIA,
        {}, {},
        function (respostaOk) {
            atualizarListaPedidos(JSON.parse(respostaOk.data));
        },
        function (respostaErro) {
            console.log({ respostaErro });
            alert("Erro ao buscar pedidos!");
        });
}

function atualizarListaPedidos(pedidos) {
    let listaPedidos = document.querySelector(".lista-pedidos");
    listaPedidos.innerHTML = "";

    pedidos.forEach(pedido => {
        let elementoPedido = document.createElement('div');
        elementoPedido.classList.add('item-pedido');

        elementoPedido.appendChild(gerarElementoPrevisualizacaoImagem(pedido));
        elementoPedido.appendChild(gerarTituloPedido(pedido));

        elementoPedido.onclick = () => alternarFormularioEdicao(pedido);

        listaPedidos.appendChild(elementoPedido);
    });
}

function gerarTituloPedido(pedido) {
    let precoFormatado = pedido.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    let tituloPedido = document.createElement('h2');
    tituloPedido.classList.add('nome-pedido');
    tituloPedido.innerText = `${pedido.pizza} | ${precoFormatado}`;

    return tituloPedido;
}

function gerarElementoPrevisualizacaoImagem(pedido) {
    let elementoImagem = document.createElement('div');
    elementoImagem.classList.add('imagem-pedido');

    if (pedido.imagem.startsWith('data:image/jpeg;base64,')) {
        elementoImagem.style.backgroundImage = 'url(' + pedido.imagem + ')';
    } else {
        elementoImagem.classList.add('imagem-placeholder');
    }

    return elementoImagem;
}

function alternarFormularioEdicao(pedido) {
    let inputNomePizza = document.getElementById('nome-pizza');
    let inputPrecoPizza = document.getElementById('preco-pizza');
    let previsualizacaoImagem = document.getElementById('previsualizacao-pizza');
    let btnSalvarPizza = document.getElementById("salvar-pizza");
    let btnDeletarPizza = document.getElementById("deletar-pizza");

    // Remove os event listeners antigos para evitar duplicação
    btnSalvarPizza.removeEventListener("click", salvarPizza);
    btnSalvarPizza.removeEventListener("click", atualizarPizza);

    if (pedido) {
        inputNomePizza.value = pedido.pizza;
        inputPrecoPizza.value = pedido.preco;
        previsualizacaoImagem.style.backgroundImage = pedido.imagem.startsWith('data:image/jpeg;base64,') ? 'url(' + pedido.imagem + ')' : 'url(../img/placeholder.jpg)';
        btnSalvarPizza.addEventListener("click", () => atualizarPizza(pedido["_id"]));
        btnDeletarPizza.classList.remove("escondido");
    } else {
        inputNomePizza.value = '';
        inputPrecoPizza.value = '';
        previsualizacaoImagem.style.backgroundImage = '';
        btnSalvarPizza.addEventListener("click", salvarPizza);
        btnDeletarPizza.classList.add("escondido");
    }

    mudarTela({ target: { dataset: { telaDestino: 'tela-novo-pedido', telaOrigem: 'tela-lista-pedidos' } } });

    dadosImagemAtual = pedido ? pedido.imagem : "";
}

function salvarPizza() {
    let nomePizza = document.querySelector("#nome-pizza").value;
    let precoPizza = parseFloat(document.querySelector("#preco-pizza").value);

    // Verifica se a imagem está disponível, caso contrário, define um valor padrão ou placeholder
    let imagem = dadosImagemAtual || "data:image/jpeg;base64,";

    console.log({ ID_PIZZARIA, nomePizza, precoPizza, imagem });

    cordova.plugin.http.setDataSerializer('json');

    cordova.plugin.http.post("https://pedidos-pizzaria.glitch.me/admin/pizza",
        {
            pizzaria: ID_PIZZARIA,
            pizza: nomePizza,
            preco: precoPizza,
            imagem: imagem
        },
        {},
        function (respostaOk) {
            console.log({ respostaOk });
            listarPedidos();
            alert("Pedido salvo com sucesso");
            mudarTela({ target: { dataset: { telaDestino: 'tela-lista-pedidos', telaOrigem: 'tela-novo-pedido' } } }); // Volta para a tela inicial
        },
        function (respostaErro) {
            console.log({ respostaErro });
            alert("Erro ao salvar pedido");
        });
}

function atualizarPizza(idPedido) {
    let nomePizza = document.querySelector("#nome-pizza").value;
    let precoPizza = parseFloat(document.querySelector("#preco-pizza").value);

    // Verifica se a imagem está disponível, caso contrário, define um valor padrão ou placeholder
    let imagem = dadosImagemAtual || "data:image/jpeg;base64,";

    console.log({ ID_PIZZARIA, idPedido, nomePizza, precoPizza, imagem });

    cordova.plugin.http.setDataSerializer('json');

    cordova.plugin.http.put("https://pedidos-pizzaria.glitch.me/admin/pizza",
        {
            pizzaria: ID_PIZZARIA,
            pizzaid: idPedido,
            pizza: nomePizza,
            preco: precoPizza,
            imagem: imagem
        },
        {},
        function (respostaOk) {
            listarPedidos();
            alert("Pedido atualizado com sucesso");
        },
        function (respostaErro) {
            console.log({ respostaErro });
            alert("Erro ao atualizar pedido");
        });
}

function tirarFoto() {
    let previsualizacao = document.getElementById("previsualizacao-pizza");

    navigator.camera.getPicture(onSucesso, onFalha, {
        quality: 50,
        destinationType: Camera.DestinationType.DATA_URL,
        targetWidth: 800,
        targetHeight: 800,
        correctOrientation: true
    });

    function onSucesso(imageData) {
        dadosImagemAtual = 'data:image/jpeg;base64,' + imageData;
        previsualizacao.style.backgroundImage = "url(" + dadosImagemAtual + ")";
    }

    function onFalha(message) {
        alert('Falhou porque: ' + message);
    }
}

function deletarPizza() {
    let nomePizza = document.querySelector("#nome-pizza").value;

    console.log({ ID_PIZZARIA, nomePizza });

    cordova.plugin.http.setDataSerializer('json');

    cordova.plugin.http.delete(encodeURI("https://pedidos-pizzaria.glitch.me/admin/pizza/" + ID_PIZZARIA + "/" + nomePizza),
        {}, {},
        function (respostaOk) {
            console.log({ respostaOk });
            listarPedidos();
            alert("Pedido deletado com sucesso");
            mudarTela({ target: { dataset: { telaDestino: 'tela-lista-pedidos', telaOrigem: 'tela-novo-pedido' } } }); // Volta para a tela inicial
        },
        function (respostaErro) {
            console.log({ respostaErro });
            alert("Erro ao deletar pedido");
        });
}
