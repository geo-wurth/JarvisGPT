/*******************************************************************
 * gemini.js
 * 
 * Responsável pela integração com Google Gemini e Gemini TTS
 ********************************************************************/

/*******************************************************************
 * 1  Consulta ao Google Gemini
 ********************************************************************/

// Envia perguntas para o modelo Gemini
async function ConsultarGemini(pergunta) {

    // Impede múltiplas requisições simultâneas
    if (carregando) return;

    carregando = true;

    try {

        const model = "gemini-3.1-flash-lite-preview";

        const url = `${endpointGemini}/v1beta/models/${model}:generateContent`;

        // Exibe imediatamente a pergunta do usuário
        adicionarMensagemUsuario(pergunta);

        // Cria a mensagem inicial do bot
        const botBubble = criarMensagemBot();

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKeyGemini
            },
            body: JSON.stringify({
                 system_instruction: {
                        parts: [
                            {
                                text: systemInstruction
                            }
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
                ],
                generationConfig: {
                    maxOutputTokens: maxOutputTokens
                }
            })
        });

        // Interrompe caso a API retorne erro
        if (!response.ok) {

            const erroTexto = await response.text();

            throw new Error(erroTexto);
        }

        // Converte a resposta para objeto JavaScript
        const data = await response.json();

        // Extrai o texto retornado pelo modelo
        const textoGerado = data.candidates[0].content.parts[0].text;

        // Atualiza a mensagem do bot
        atualizarMensagemBot(botBubble, textoGerado);

        // Remove animação de digitação
        botBubble.classList.remove("typing");

        // Reproduz a resposta utilizando Gemini TTS (desativo, não remover)
        // ReproduzirVozGemini(textoGerado);

    } catch (error) {

        console.error("Erro na requisição:", error);

        mostrarErro();

    } finally {

        carregando = false;

        liberarUI();
    }
}

/*******************************************************************
 * 2  Síntese de voz com Gemini TTS
 ********************************************************************/

// Converte texto em voz utilizando Gemini TTS
const ReproduzirVozGemini = async (resposta) => {

    const model = "gemini-3.1-flash-tts-preview";

    const url = `${endpointGemini}/v1beta/models/${model}:generateContent`;

    try {

        // Envia a solicitação de geração de áudio
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
                            {
                                text: resposta
                            }
                        ]
                    }
                ],
                generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: "Aoede"
                            }
                        }
                    }
                }
            })
        });

        // Interrompe caso a API retorne erro
        if (!response.ok) {

            const erroTexto = await response.text();

            throw new Error(`Erro na API do Gemini TTS: ${erroTexto}`);
        }

        // Converte a resposta para objeto JavaScript
        const data = await response.json();

        // Localiza o conteúdo de áudio retornado
        const audioPart = data.candidates[0].content.parts.find(
            part => part.inlineData
        );

        if (!audioPart) {
            throw new Error("Nenhum áudio foi retornado pelo Gemini.");
        }

        // Extrai o áudio em Base64
        const audioBase64 = audioPart.inlineData.data;

        // Converte Base64 para bytes
        const binaryString = atob(audioBase64);

        const bytes = new Uint8Array(binaryString.length);

        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Converte os bytes para PCM 16 bits
        const int16Array = new Int16Array(bytes.buffer);

        // Converte PCM para Float32 exigido pela Web Audio API
        const float32Array = new Float32Array(int16Array.length);

        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768.0;
        }

        // Inicializa o contexto de áudio
        const audioContext = new (
            window.AudioContext || window.webkitAudioContext
        )();

        // Cria o buffer de áudio
        const audioBuffer = audioContext.createBuffer(
            1,
            float32Array.length,
            24000
        );

        // Insere os dados processados no buffer
        audioBuffer.getChannelData(0).set(float32Array);

        // Cria o player de áudio
        const source = audioContext.createBufferSource();

        source.buffer = audioBuffer;

        source.connect(audioContext.destination);

        // Inicia a reprodução
        source.start();

    } catch (error) {

        console.error("Falha na geração de voz:", error);
    }
};