/*******************************************************************
 * ui.js
 * 
 * Responsável pelos eventos e interações da interface
 ********************************************************************/

/*******************************************************************
 * 1  Inicialização dos eventos da interface
 ********************************************************************/

// Inicializa os eventos principais da UI
function InicializarUI() {

    InicializarSwitchesIA();
    InicializarBotaoEnviar();
    InicializarEnterPrompt();
}

/*******************************************************************
 * 2  Controle dos switches de IA
 ********************************************************************/

// Controla a alternância entre ChatGPT e Gemini
function InicializarSwitchesIA() {

    const switches = document.querySelectorAll("#IAs .form-check-input");

    const chatGptSwitch = switches[0];
    const geminiSwitch = switches[1];

    function alternarIAs(event) {

        const switchModificado = event.target;

        // Mantém apenas um provider ativo por vez
        if (switchModificado === chatGptSwitch) {

            geminiSwitch.checked = !chatGptSwitch.checked;

        } else if (switchModificado === geminiSwitch) {

            chatGptSwitch.checked = !geminiSwitch.checked;
        }
    }

    chatGptSwitch.addEventListener("change", alternarIAs);
    geminiSwitch.addEventListener("change", alternarIAs);
}

/*******************************************************************
 * 3  Verificação do modelo ativo
 ********************************************************************/

// Retorna o provider atualmente selecionado
function verificaModeloIA() {

    const switches = document.querySelectorAll("#IAs .form-check-input");

    const chatGptSwitch = switches[0];
    const geminiSwitch = switches[1];

    if (chatGptSwitch.checked) {
        return "ChatGPT";
    }

    if (geminiSwitch.checked) {
        return "Gemini";
    }
}

/*******************************************************************
 * 4  Direcionamento das perguntas
 ********************************************************************/

// Direciona a pergunta para o provider ativo
function direcionarPergunta(pergunta) {

    // Impede perguntas vazias
    if (!pergunta || pergunta.trim() === "") return;

    const modelo = verificaModeloIA();

    if (modelo == "ChatGPT") {

        ConsultarAzureOpenAI(pergunta);

    } else if (modelo == "Gemini") {

        ConsultarGemini(pergunta);
    }
}

/*******************************************************************
 * 5  Botão de envio manual
 ********************************************************************/

// Inicializa o evento do botão de envio
function InicializarBotaoEnviar() {

    document.getElementById("send").addEventListener("click", () => {

        const input = document.getElementById("prompt");
        const pergunta = input.value.trim();

        // Valida se existe conteúdo antes do envio
        if (pergunta) {

            direcionarPergunta(pergunta);

            bloquearUI();

            // Limpa o campo após o envio
            input.value = "";

        } else {

            alert("Digite uma pergunta antes de enviar.");
        }
    });
}

/*******************************************************************
 * 6  Envio da pergunta com Enter
 ********************************************************************/

// Inicializa o envio utilizando a tecla Enter
function InicializarEnterPrompt() {

    document.getElementById("prompt").addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            // Impede comportamento padrão do Enter
            event.preventDefault();

            const pergunta = this.value.trim();

            if (pergunta) {

                direcionarPergunta(pergunta);

                bloquearUI();

                // Limpa o input após o envio
                this.value = "";
            }
        }
    });
}