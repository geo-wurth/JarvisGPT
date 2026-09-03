/*******************************************************************
 * chatgpt.js
 * 
 * Responsável pela integração com Azure OpenAI e Azure TTS
 ********************************************************************/

/*******************************************************************
 * 1  Consulta ao Azure OpenAI
 ********************************************************************/

// Envia perguntas para o modelo ChatGPT da Azure
async function ConsultarAzureOpenAI(pergunta) {

    // Impede múltiplas requisições simultâneas
    if (carregando) return;

    carregando = true;

    try {

        const api_version = "2025-04-01-preview";

        const url = `${endopointAzure}/openai/responses?api-version=${api_version}`;

        // Exibe imediatamente a pergunta do usuário
        adicionarMensagemUsuario(pergunta);

        // Cria a mensagem inicial do bot
        const botBubble = criarMensagemBot();

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKeyAzure}`
            },
            body: JSON.stringify({
                model: "gpt-5.4",
                stream: true,
                max_output_tokens: maxOutputTokens,
                input: [
                    {
                        role: "system",
                        content: systemInstruction
                    },
                    {
                        role: "user",
                        content: pergunta
                    }
                ]
            })
        });

        // Interrompe caso a API retorne erro
        if (!response.ok) {

            const erroTexto = await response.text();

            throw new Error(erroTexto);
        }

        // Processa a resposta em streaming
        const reader = response.body.getReader();

        const decoder = new TextDecoder("utf-8");

        let respostaFinal = "";
        let buffer = "";

        while (true) {

            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Separa os blocos da resposta
            let partes = buffer.split("\n");

            // Mantém conteúdo incompleto no buffer
            buffer = partes.pop();

            for (let parte of partes) {

                parte = parte.trim();

                if (!parte) continue;

                // Remove prefixo "data:"
                if (parte.startsWith("data:")) {
                    parte = parte.replace("data:", "").trim();
                }

                // Ignora finalização do stream
                if (parte === "[DONE]") continue;

                try {

                    const json = JSON.parse(parte);

                    // Captura os fragmentos de texto da resposta
                    if (json.type === "response.output_text.delta") {

                        const delta = json.delta;

                        if (delta) {

                            respostaFinal += delta;

                            atualizarMensagemBot(botBubble, respostaFinal);
                        }
                    }

                } catch (e) {

                    // Ignora JSON incompleto
                }
            }
        }

        // Remove animação de digitação
        botBubble.classList.remove("typing");

        // Reproduz resposta utilizando Azure TTS (desativo, não remover)
        // ReproduzirVozAzure(respostaFinal);

    } catch (error) {

        console.error("Erro na requisição:", error);

        mostrarErro();

    } finally {

        carregando = false;

        liberarUI();
    }
}

/*******************************************************************
 * 2  Síntese de voz com Azure TTS
 ********************************************************************/

// Converte texto em voz utilizando Azure Speech
const ReproduzirVozAzure = async (resposta) => {

    try {

        // Configura os headers da requisição
        const headers = new Headers();

        headers.append("Ocp-Apim-Subscription-Key", apiKeyAzure);
        headers.append("Content-Type", "application/ssml+xml");
        headers.append("X-Microsoft-OutputFormat", "audio-16khz-32kbitrate-mono-mp3");

        // Define voz e idioma do TTS
        const body = `<speak version='1.0' xml:lang='pt-BR'>
            <voice name='pt-BR-Thalita:DragonHDLatestNeural'>
                ${resposta}
            </voice>
        </speak>`;

        // Envia requisição para Azure Speech
        const response = await fetch(`${endpointAzureTTS}/cognitiveservices/v1`, {
            method: "POST",
            headers,
            body
        });

        // Interrompe caso a API retorne erro
        if (!response.ok) {
            throw new Error("Erro na API");
        }

        // Cria o player de áudio em streaming
        const mediaSource = new MediaSource();

        const audio = new Audio();

        audio.src = URL.createObjectURL(mediaSource);

        // Inicia a reprodução
        audio.play().catch(console.error);

        // Processa os chunks de áudio recebidos
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

                // Aguarda o processamento do buffer
                await new Promise(resolve => {

                    sourceBuffer.addEventListener(
                        "updateend",
                        resolve,
                        { once: true }
                    );
                });
            }
        });

    } catch (error) {

        console.error("Erro ao reproduzir voz:", error);
    }
}