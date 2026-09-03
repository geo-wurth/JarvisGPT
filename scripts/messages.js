/*******************************************************************
 * messages.js
 * 
 * Responsável pelo controle visual das mensagens da aplicação
 ********************************************************************/

// Controla se a interface já entrou no modo de conversa
let primeiraResposta = true;

// Evita carregar o CSS mais de uma vez
let cssCarregado = false;

/*******************************************************************
 * 1  Controle da interface
 ********************************************************************/

// Desabilita os elementos da interface durante a requisição
function bloquearUI() {

    document.getElementById("prompt").disabled = true;
    document.getElementById("send").disabled = true;
}

// Reabilita os elementos da interface após a resposta
function liberarUI() {

    document.getElementById("prompt").disabled = false;
    document.getElementById("send").disabled = false;

    // Retorna o foco para o campo de texto
    document.getElementById("prompt").focus();
}

/*******************************************************************
 * 2  Carregamento dinâmico do CSS do chat
 ********************************************************************/

// Carrega o arquivo answer.css dinamicamente
function carregarCSS() {

    // Evita recarregamento desnecessário
    if (cssCarregado) return;

    // Verifica se o CSS já existe no HTML
    const existente = document.querySelector('link[href="answer.css"]');

    if (existente) {
        cssCarregado = true;
        return;
    }

    // Cria a tag do CSS
    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.href = "answer.css";

    // Adiciona o CSS ao documento
    document.head.appendChild(link);

    cssCarregado = true;
}

/*******************************************************************
 * 3  Mensagens do usuário
 ********************************************************************/

// Adiciona uma nova mensagem do usuário na tela
function adicionarMensagemUsuario(pergunta) {

    // Garante que o CSS esteja carregado
    carregarCSS();

    const chatSection = document.querySelector(".chat");
    const divResposta = document.getElementById("resposta");

    // Ajusta o layout após a primeira interação
    if (primeiraResposta) {

        // Move o conteúdo principal para o topo
        chatSection.style.justifyContent = "flex-start";
        chatSection.style.padding = "20px 0";

        // Remove elementos iniciais da tela
        chatSection.querySelector("img")?.remove();
        chatSection.querySelector("h1")?.remove();

        // Reduz a área do input
        document.querySelector(".pergunta")?.classList.add("pequena");

        // Exibe o container de respostas
        divResposta.style.display = "flex";

        primeiraResposta = false;
    }

    // Cria o container da mensagem
    const userMsg = document.createElement("div");
    userMsg.className = "msg user";

    // Cria o balão da mensagem
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerText = pergunta;

    // Monta a estrutura final
    userMsg.appendChild(bubble);
    divResposta.appendChild(userMsg);

    // Mantém o scroll na última mensagem
    divResposta.scrollTop = divResposta.scrollHeight;
}

/*******************************************************************
 * 4  Mensagens do bot
 ********************************************************************/

function criarMensagemBot() {

    const divResposta = document.getElementById("resposta");

    // Container principal da mensagem
    const botMsg = document.createElement("div");
    botMsg.className = "msg bot";

    // Wrapper da bolha + botão
    const wrapper = document.createElement("div");
    wrapper.className = "bubble-wrapper";

    // Balão da resposta
    const bubble = document.createElement("div");
    bubble.className = "bubble loading typing";
    bubble.innerText = "Jarvis está pensando";

    // Botão de áudio
    const speakButton = document.createElement("button");
    speakButton.className = "speak-button";

    speakButton.innerHTML = '<i class="fas fa-volume-up"></i>';

    // Evento de reprodução
    speakButton.addEventListener("click", () => {

        const texto = bubble.innerText;

        const modelo = verificaModeloIA();

        if (modelo === "ChatGPT") {

            ReproduzirVozAzure(texto);

        } else if (modelo === "Gemini") {

            ReproduzirVozGemini(texto);
        }
    });

    // Monta estrutura
    wrapper.appendChild(bubble);
    wrapper.appendChild(speakButton);

    botMsg.appendChild(wrapper);

    divResposta.appendChild(botMsg);

    divResposta.scrollTop = divResposta.scrollHeight;

    return bubble;
}

// Atualiza o conteúdo da mensagem do bot
function atualizarMensagemBot(bubble, texto) {

    // Remove o estado de carregamento
    bubble.classList.remove("loading");

    // Atualiza o conteúdo da resposta
    bubble.innerText = texto;

    // Mantém o scroll no final da conversa
    const divResposta = document.getElementById("resposta");

    divResposta.scrollTop = divResposta.scrollHeight;
}

/*******************************************************************
 * 5  Controle de erros
 ********************************************************************/

// Exibe mensagens de erro na interface
function mostrarErro() {

    const divResposta = document.getElementById("resposta");

    divResposta.style.display = "block";
    divResposta.innerText = "Ocorreu um erro ao obter a resposta.";
}