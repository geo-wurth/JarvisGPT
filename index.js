/*******************************************************************
 * index.js
 * 
 * Aplicação Web com:
 * - Reconhecimento de voz (Speech API)
 * - Integração com Azure OpenAI (Chat Completion)
 * - Integração com Google Gemini (Chat Completion)
 * - Síntese de voz com Microsoft TTS (Text to Speech)
 * - Alternância de tema (Dark/Light Mode)
 ********************************************************************/


/*******************************************************************
 * 1  Inicialização do reconhecimento de voz automática
 ********************************************************************/

// Cria a instância do reconhecimento de voz
var recognition = new webkitSpeechRecognition();

// Define o idioma conforme o navegador do usuário
recognition.lang = window.navigator.language;

// Desabilita resultados parciais durante a fala
recognition.interimResults = false;

// Mantém o reconhecimento ativo continuamente
recognition.continuous = true;

// Inicia a captura de áudio
recognition.start();

// Alguns navegadores exigem interação do usuário antes de liberar áudio
// Simula uma interação inicial para evitar bloqueios
let h1 = document.querySelector('h1');

h1.click();

/*******************************************************************
 * 2  Monitoramento de switchs de modelos de IA
 ********************************************************************/

document.addEventListener("DOMContentLoaded", () => {
    // Seleciona todos os inputs de switch dentro da div #IAs
    const switches = document.querySelectorAll("#IAs .form-check-input");
    
    // Assumindo que o primeiro é o ChatGPT e o segundo é o Gemini
    const chatGptSwitch = switches[0];
    const geminiSwitch = switches[1];

    function alternarIAs(event) {
        const switchModificado = event.target;

        if (switchModificado === chatGptSwitch) {
            // Se mexeu no ChatGPT, o Gemini recebe o estado inverso
            geminiSwitch.checked = !chatGptSwitch.checked;
        } else if (switchModificado === geminiSwitch) {
            // Se mexeu no Gemini, o ChatGPT recebe o estado inverso
            chatGptSwitch.checked = !geminiSwitch.checked;
        }
    }

    // Adiciona o evento de 'change' (mudança de estado) para ambos
    chatGptSwitch.addEventListener("change", alternarIAs);
    geminiSwitch.addEventListener("change", alternarIAs);
});

/*******************************************************************
 * 3  Função para buscar chaves de API
 ********************************************************************/

// Busca valores do arquivo keys.json
const GetKey = (service, callback) => {

    fetch('keys.json')
        .then(response => response.json())
        .then(data => {
            callback(data[service]);
        })
        .catch(error => console.error(error));
};

// Variáveis globais utilizadas para armazenar chaves e endpoints
let apiKeyAzure;
let endopointAzure;
let endpointAzureTTS;
let apiKeyGemini;
let endpointGemini;

// Carrega as configurações da Azure OpenAI
GetKey('apiKeyAzure', (key) => {
    apiKeyAzure = key;
});

GetKey('endopointAzure', (key) => {
    endopointAzure = key;
});

GetKey('endpointAzureTTS', (key) => {
    endpointAzureTTS = key;
});

// Carrega as configurações do Google Gemini
GetKey('apiKeyGemini', (key) => {
    apiKeyGemini = key;
});

GetKey('endpointGemini', (key) => {
    endpointGemini = key;
});


/*******************************************************************
 * 4  Controle de tema (Dark Mode)
 ********************************************************************/

// Inicializa o evento de troca de tema após o carregamento da página
document.addEventListener('DOMContentLoaded', function () {

    const toggleButton = document.getElementById('toggle-mode');

    toggleButton.addEventListener('click', function () {
        TrocarTema();
    });
});

// Alterna entre os modos claro e escuro da interface
const TrocarTema = () => {

    const body = document.body;
    const isDarkMode = body.classList.contains('dark-mode');

    // Alterna a classe do tema atual
    body.classList.toggle('dark-mode');

    // Atualiza o ícone do botão conforme o tema ativo
    const toggleButton = document.getElementById('toggle-mode');

    toggleButton.innerHTML = isDarkMode
        ? '<i class="fas fa-moon"></i>'
        : '<i class="fas fa-sun"></i>';
}

/*******************************************************************
 *  Preparação dos itens 5 E 6
 ********************************************************************/

let carregando = false;

/*******************************************************************
 * 5  Consulta ao Azure OpenAI - ChatGPT
 ********************************************************************/

async function ConsultarAzureOpenAI(pergunta) {

    if (carregando) return;

    carregando = true;

    try {
        const api_version = "2025-04-01-preview";

        const url = `${endopointAzure}/openai/responses?api-version=${api_version}`;

        // Mostra mensagem do usuário imediatamente
        adicionarMensagemUsuario(pergunta);

        // Cria bolha do bot com loading
        const botBubble = criarMensagemBot();

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKeyAzure}`
            },
            body: JSON.stringify({
                model: "gpt-5.2-chat",
                stream: true,
                max_output_tokens: 1000,
                input: [
                    // {
                    //     role: "system",
                    //     content: "Jarvis é um chatbot pontual e muito simpático que ajuda as pessoas, mas é muito prolixo, redundante e desgastante textualmente. Suas respostas não usam markdown."
                    // },
                    {
                        role: "user",
                        content: pergunta
                    }
                ]
            })
        });

        if (!response.ok) {
            const erroTexto = await response.text();
            throw new Error(erroTexto);
        }

        // STREAM
        const reader = response.body.getReader();

        const decoder = new TextDecoder("utf-8");

        let respostaFinal = "";
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // quebra por linhas
            let partes = buffer.split("\n");

            // mantém última parte incompleta no buffer
            buffer = partes.pop();

            for (let parte of partes) {
                parte = parte.trim();

                if (!parte) continue;

                // remove "data:" se existir
                if (parte.startsWith("data:")) {
                    parte = parte.replace("data:", "").trim();
                }

                if (parte === "[DONE]") continue;

                try {
                    const json = JSON.parse(parte);
                    if (json.type === "response.output_text.delta") {
                        const delta = json.delta;

                        if (delta) {
                            respostaFinal += delta;
                            atualizarMensagemBot(botBubble, respostaFinal);
                        }
                    }

                } catch (e) {
                    // ignora JSON incompleto
                }
            }
        }

        // remove cursor de digitação
        botBubble.classList.remove("typing");

    } catch (error) {
        console.error("Erro na requisição:", error);
        mostrarErro();
    } finally {
        carregando = false;
        ReproduzUltimaMenssagem()
        liberarUI();
    }
}

/*******************************************************************
 * 6  Consulta ao Google Gemini
 ********************************************************************/

async function ConsultarGemini(pergunta) {

    if (carregando) return;

    carregando = true;

    try {
        const model = "gemini-3.1-flash-lite-preview";

        const url = `${endpointGemini}/v1beta/models/${model}:generateContent`;

        // Mostra mensagem do usuário imediatamente
        adicionarMensagemUsuario(pergunta);

        // Cria bolha do bot com loading
        const botBubble = criarMensagemBot();

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": `${apiKeyGemini}`
            },
            body: JSON.stringify({
                 system_instruction: {
                        parts: [
                            // {
                            //     text: "Jarvis é um chatbot pontual e muito simpático que ajuda as pessoas, mas é muito prolixo, redundante e desgastante textualmente. Suas respostas não usam markdown."
                            // }
                        ]
                    },
                contents: [
                {
                    parts: [
                    {
                        text: pergunta
                    }
                    ]
                }
                ]
            })
        });

        if (!response.ok) {
            const erroTexto = await response.text();
            throw new Error(erroTexto);
        }

        // Converte a resposta da API para objeto JavaScript
        const data = await response.json();

        // Extrai o texto exato devolvido pelo modelo
        const textoGerado = data.candidates[0].content.parts[0].text;

        // Insere o texto na bolha de resposta do bot
        atualizarMensagemBot(botBubble, textoGerado);

        // Remove cursor de digitação
        botBubble.classList.remove("typing");

    } catch (error) {
        console.error("Erro na requisição:", error);
        mostrarErro();
    } finally {
        carregando = false;
        ReproduzUltimaMenssagem();
        liberarUI();
    }
}
/*******************************************************************
 * 7  Verifica qual o modelo ativo
 ********************************************************************/

function verificaModeloIA() {
    // Seleciona os switches dentro da div #IAs
    const switches = document.querySelectorAll("#IAs .form-check-input");
    const chatGptSwitch = switches[0];
    const geminiSwitch = switches[1];

    // Verifica qual switch está marcado (checked)
    if (chatGptSwitch.checked) {
        return "ChatGPT";
    } else if (geminiSwitch.checked) {
        return "Gemini";
    }
}


/*******************************************************************
 * 8  Função para direcionar para o modelo correto
 ********************************************************************/

// Função principal para decidir qual IA chamar
function direcionarPergunta(pergunta) {
    // Se a pergunta estiver vazia, não faz nada
    if (!pergunta || pergunta.trim() === "") return;

    const modelo = verificaModeloIA();

    // Verifica qual switch está marcado (checked)
    if (modelo == "ChatGPT") {
        ConsultarAzureOpenAI(pergunta);
    } else if (modelo == "Gemini") {
        ConsultarGemini(pergunta);
    }
}

/*******************************************************************
 * 9  Manipula os elementos da página para inclusão da resposta
 ********************************************************************/

// Controla se a interface já entrou no modo de conversa
let primeiraResposta = true;

// Evita carregar o CSS mais de uma vez
let cssCarregado = false;

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

// Carrega dinamicamente o CSS responsável pelas mensagens do chat
function carregarCSS() {

    // Evita recarregamento desnecessário
    if (cssCarregado) return;

    // Verifica se o CSS já existe no HTML
    const existente = document.querySelector('link[href="answer.css"]');

    if (existente) {
        cssCarregado = true;
        return;
    }

    // Cria a tag <link> do CSS
    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.href = "answer.css";

    // Adiciona o CSS ao <head>
    document.head.appendChild(link);

    cssCarregado = true;
}

// Adiciona uma nova mensagem do usuário na tela
function adicionarMensagemUsuario(pergunta) {

    // Garante que o CSS das respostas esteja carregado
    carregarCSS();

    const chatSection = document.querySelector(".chat");
    const divResposta = document.getElementById("resposta");

    // Ajusta o layout após a primeira interação
    if (primeiraResposta) {

        // Move o conteúdo para o topo
        chatSection.style.justifyContent = "flex-start";
        chatSection.style.padding = "20px 0";

        // Remove logo e título iniciais
        chatSection.querySelector("img")?.remove();
        chatSection.querySelector("h1")?.remove();

        // Reduz a área do input
        document.querySelector(".pergunta")?.classList.add("pequena");

        // Exibe o container de respostas
        divResposta.style.display = "flex";

        primeiraResposta = false;
    }

    // Cria a estrutura da mensagem do usuário
    const userMsg = document.createElement("div");
    userMsg.className = "msg user";

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerText = pergunta;

    // Monta a estrutura final
    userMsg.appendChild(bubble);
    divResposta.appendChild(userMsg);

    // Mantém o scroll na última mensagem
    divResposta.scrollTop = divResposta.scrollHeight;
}

// Cria a bolha inicial do bot com efeito de carregamento
function criarMensagemBot() {

    const divResposta = document.getElementById("resposta");

    // Container da mensagem
    const botMsg = document.createElement("div");
    botMsg.className = "msg bot";

    // Balão da resposta
    const bubble = document.createElement("div");
    bubble.className = "bubble loading typing";
    bubble.innerText = "Jarvis está pensando";

    botMsg.appendChild(bubble);
    divResposta.appendChild(botMsg);

    // Mantém o scroll atualizado
    divResposta.scrollTop = divResposta.scrollHeight;

    return bubble;
}

// Atualiza o conteúdo da mensagem do bot
function atualizarMensagemBot(bubble, texto) {

    // Remove estado de carregamento
    bubble.classList.remove("loading");

    // Atualiza o texto da resposta
    bubble.innerText = texto;

    // Move o scroll para o final
    const divResposta = document.getElementById("resposta");
    divResposta.scrollTop = divResposta.scrollHeight;
}

// Exibe uma mensagem de erro na interface
function mostrarErro() {

    const divResposta = document.getElementById("resposta");

    divResposta.style.display = "block";
    divResposta.innerText = "Ocorreu um erro ao obter a resposta.";
}

/*******************************************************************
 * 10  Botão de envio manual
 ********************************************************************/

// Envia a pergunta ao clicar no botão de envio
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

// Permite enviar a pergunta pressionando Enter
document.getElementById("prompt").addEventListener("keydown", function (event) {

    if (event.key === "Enter") {

        // Evita comportamento padrão do Enter
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


/*******************************************************************
 * 11  Controle visual do botão de captura de áudio
 ********************************************************************/

// Altera a cor do botão de captura
const TrocarCor = (cor) => {
    var startButton = document.getElementById('capture');
    startButton.style.backgroundColor = cor;
}

// Controla o estado atual da captura de áudio
let capturing = true;

// Alterna visualmente o estado do botão de captura
document.getElementById("capture").addEventListener("click", () => {
    
    if (capturing) {

        // Indica visualmente que a captura está ativa
        TrocarCor('#4CAF50');

        capturing = false;

    } else {

    }
});

/*******************************************************************
 * 12  Captura de voz com a palavra-chave "Jarvis"
 ********************************************************************/

const CapturarVoz = () => {
    recognition.addEventListener('result', (event) => {
        const result = event.results[event.results.length - 1][0].transcript;     

        // Comando especial: trocar tema
        if (result.toLowerCase().includes('jarvis')) { 
            TrocarCor('#4CAF50');

            bloquearUI();

            // Comece a salvar a pergunta quando "Jarvis" é detectado
            let pergunta = result
                .toLowerCase()
                .replace(/^\s*jarvis,?\s*/i, '') // só remove no início da frase
                .trim();

            pergunta = pergunta.charAt(0).toUpperCase() + pergunta.slice(1)

            // Pare a captura de voz
            recognition.stop();

            // Consulte a API do OpenAI
            direcionarPergunta(pergunta);

            // Aguarde 5 segundos e inicie a captura de voz novamente
            setTimeout(() => {
                recognition.start();
                TrocarCor('#dd203c');
            }, 5000);
        }
    });
}

/*******************************************************************
 * 13  Síntese de voz (Microsoft Azure TTS)
 ********************************************************************/

// Converte texto em voz utilizando a API de TTS da Azure
const ReproduzirVozAzure = async (resposta) => {

    // Configura os headers da requisição
    const headers = new Headers();

    headers.append("Ocp-Apim-Subscription-Key", apiKeyAzure);
    headers.append("Content-Type", "application/ssml+xml");
    headers.append("X-Microsoft-OutputFormat", "audio-16khz-32kbitrate-mono-mp3");

    // Define o SSML com idioma e voz utilizados
    const body = `<speak version='1.0' xml:lang='pt-BR'>
        <voice name='pt-BR-Thalita:DragonHDLatestNeural'>
            ${resposta}
        </voice>
    </speak>`;

    // Envia a requisição para a API da Azure Speech
    const response = await fetch(`${endpointAzureTTS}/cognitiveservices/v1`, {
        method: "POST",
        headers,
        body 
    });

    // Interrompe a execução caso a API retorne erro
    if (!response.ok) throw new Error("Erro na API");

    // Cria o player de áudio utilizando streaming
    const mediaSource = new MediaSource();
    const audio = new Audio();

    audio.src = URL.createObjectURL(mediaSource);

    // Inicia a reprodução do áudio
    audio.play().catch(console.error);

    // Processa os chunks de áudio recebidos da API
    mediaSource.addEventListener("sourceopen", async () => {

        const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
        const reader = response.body.getReader();

        while (true) {

            const { done, value } = await reader.read();

            // Finaliza o stream quando não houver mais dados
            if (done) {
                mediaSource.endOfStream();
                break;
            }

            // Adiciona o trecho de áudio ao buffer
            sourceBuffer.appendBuffer(value);

            // Aguarda o processamento do buffer antes do próximo chunk
            await new Promise(resolve => {
                sourceBuffer.addEventListener("updateend", resolve, { once: true });
            });
        }
    });
};

/*******************************************************************
 * 14  Síntese de voz (Gemini TTS)
 ********************************************************************/

const ReproduzirVozGemini = async (resposta) => {
    const model = "gemini-3.1-flash-tts-preview";
    const url = `${endpointGemini}/v1beta/models/${model}:generateContent`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKeyGemini
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: resposta }
                        ]
                    }
                ],
                generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: "Aoede" // Pode testar: Aoede, Charon, Fenrir, Kore, Puck
                            }
                        }
                    }
                }
            })
        });

        if (!response.ok) {
            const erroTexto = await response.text();
            throw new Error(`Erro na API do Gemini TTS: ${erroTexto}`);
        }

        const data = await response.json();

        // Procura automaticamente qual "part" da resposta contém o áudio
        const audioPart = data.candidates[0].content.parts.find(part => part.inlineData);
        
        if (!audioPart) {
            throw new Error("O Gemini respondeu, mas não enviou nenhum arquivo de áudio.");
        }

        // Extrai o áudio cru em Base64
        const audioBase64 = audioPart.inlineData.data;

        // 1. Converte o Base64 para Bytes (8-bit)
        const binaryString = atob(audioBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // 2. O Gemini retorna PCM de 16 bits. Lemos os bytes agrupados em 16-bit (Int16)
        const int16Array = new Int16Array(bytes.buffer);

        // 3. A Web Audio API exige Float32 (ondas de som entre -1.0 e 1.0)
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768.0; // Converte o limite de 32768 do Int16
        }

        // 4. Inicia o motor de áudio do navegador
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 5. Cria um "recipiente" para o som.
        // O padrão de voz do Gemini é Mono (1 canal) a 24.000 Hz
        const audioBuffer = audioContext.createBuffer(1, float32Array.length, 24000);
        
        // 6. Insere as nossas ondas sonoras processadas no canal
        audioBuffer.getChannelData(0).set(float32Array);

        // 7. Cria o player, conecta aos alto-falantes e dá o play
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();

    } catch (error) {
        console.error("Falha na geração de voz:", error);
    }
};

/*******************************************************************
 * 15  Reprodução da síntese de voz TTS
 ********************************************************************/
const ReproduzUltimaMenssagem = () => {

    const modelo = verificaModeloIA()

    // Captura último texto enviado
    let bubbles = document.querySelectorAll(".bubble")
    let lastMessage = bubbles[bubbles.length - 1].innerText

    // Verifica qual switch está marcado (checked)
    if (modelo == "ChatGPT") {
        ReproduzirVozAzure(lastMessage)
    } else if (modelo == "Gemini") {
        ReproduzirVozGemini(lastMessage);
    }
}

/*******************************************************************
 * 16  Inicialização final
 ********************************************************************/

// Ativa escuta de voz
CapturarVoz();