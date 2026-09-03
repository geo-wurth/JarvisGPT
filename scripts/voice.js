/*******************************************************************
 * voice.js
 * 
 * Responsável pelo reconhecimento e captura de voz
 * Atualizado com Modos: Contínuo (Palavra-chave) e Manual (Botão)
 ********************************************************************/

// Estado atual
let currentVoiceMode = 'continuous';
let isManualRecording = false;
let manualTranscript = "";
let agendarEnvioManual = false;

/*******************************************************************
 * 1  Integração e Controle visual do botão de captura
 ********************************************************************/

// Intercepta a função liberarUI do messages.js para retomar a escuta
const originalLiberarUI = window.liberarUI;
window.liberarUI = () => {
    if (typeof originalLiberarUI === 'function') originalLiberarUI();
    
    // Se estiver no modo contínuo, volta a ouvir após o bot responder
    if (currentVoiceMode === 'continuous') {
        try { recognition.start(); } catch(err) {}
        TrocarCorBotao('');
    }
};

const TrocarCorBotao = (cor) => {
    const captureButton = document.getElementById('capture');
    captureButton.style.backgroundColor = cor;
    
    if (cor) {
        captureButton.style.transform = 'scale(1.1)';
        captureButton.style.boxShadow = '0 0 15px ' + cor;
        captureButton.style.color = 'white';
    } else {
        captureButton.style.transform = '';
        captureButton.style.boxShadow = '';
        captureButton.style.color = '';
    }
};

/*******************************************************************
 * 2  Alternância entre os modos
 ********************************************************************/

document.getElementById('voiceContinuous').addEventListener('change', (e) => {
    if (e.target.checked) {
        currentVoiceMode = 'continuous';
        
        // Limpa estado manual se estivesse rodando
        if (isManualRecording) FinalizarGravacaoManual(false);

        // Tenta iniciar o listener contínuo se não estiver bloqueado pela UI
        if (!document.getElementById("prompt").disabled) {
            try { recognition.start(); } catch(err) {}
        }
    }
});

document.getElementById('voiceManual').addEventListener('change', (e) => {
    if (e.target.checked) {
        currentVoiceMode = 'manual';
        
        // No modo manual, ele não fica ouvindo em background
        try { recognition.stop(); } catch(err) {}
    }
});

/*******************************************************************
 * 3  Ação do botão de Captura (Modo Manual)
 ********************************************************************/

document.getElementById("capture").addEventListener("click", () => {
    
    // Se o usuário clicar no botão e estiver no modo contínuo, avisamos
    if (currentVoiceMode === 'continuous') {
        // Altera para modo manual automaticamente para facilitar
        document.getElementById('voiceManual').checked = true;
        currentVoiceMode = 'manual';
        try { recognition.stop(); } catch(err) {}
    }

    // Comportamento do Modo Manual
    if (!isManualRecording) {
        IniciarGravacaoManual();
    } else {
        FinalizarGravacaoManual(true);
    }
});

const IniciarGravacaoManual = () => {
    isManualRecording = true;
    agendarEnvioManual = false;
    manualTranscript = "";
    
    TrocarCorBotao('#4CAF50'); // Verde
    
    const promptInput = document.getElementById("prompt");
    promptInput.disabled = true;
    promptInput.value = "";
    promptInput.placeholder = "Ouvindo... Clique no microfone para enviar.";
    
    try { recognition.start(); } catch(err) {}
};

const FinalizarGravacaoManual = (enviar = false) => {
    isManualRecording = false;
    
    TrocarCorBotao(''); // Volta cor normal
    
    const promptInput = document.getElementById("prompt");
    promptInput.disabled = false;
    promptInput.placeholder = "Pergunte algo ao Jarvis...";
    
    if (enviar) {
        agendarEnvioManual = true;
    }
    
    try { recognition.stop(); } catch(err) {}
};

/*******************************************************************
 * 4  Lógica de processamento de voz
 ********************************************************************/

const CapturarVoz = () => {

    recognition.addEventListener('result', (event) => {
        let result = event.results[event.results.length - 1][0].transcript;

        if (currentVoiceMode === 'continuous') {
            // Verifica a palavra-chave Jarvis
            if (result.toLowerCase().includes('jarvis')) {
                
                TrocarCorBotao('#4CAF50');
                bloquearUI(); // ui.js function

                let pergunta = result
                    .toLowerCase()
                    .replace(/^\s*jarvis,?\s*/i, '')
                    .trim();

                pergunta = pergunta.charAt(0).toUpperCase() + pergunta.slice(1);
                
                recognition.stop();

                if (pergunta) {
                    // Coloca no input temporariamente para visualização
                    document.getElementById('prompt').value = pergunta;
                    
                    direcionarPergunta(pergunta);
                    document.getElementById('prompt').value = "";
                }
            }
        } 
        else if (currentVoiceMode === 'manual' && isManualRecording) {
            
            // Acumula o que está sendo falado
            manualTranscript += " " + result;
            
            // Mostra em tempo real no input text bloqueado
            document.getElementById("prompt").value = manualTranscript.trim();
        }
    });

    // É no evento 'end' que garantimos que o envio manual receba todo o áudio processado.
    recognition.addEventListener('end', () => {
        
        // Se o usuário clicou para parar e enviar, agora temos certeza de que
        // os eventos 'result' pendentes já foram disparados.
        if (agendarEnvioManual) {
            agendarEnvioManual = false;
            
            if (manualTranscript.trim() !== "") {
                const promptInput = document.getElementById("prompt");
                promptInput.value = manualTranscript.trim();
                
                direcionarPergunta(manualTranscript.trim());
                
                promptInput.value = "";
                manualTranscript = "";
            }
        }
        // Se o serviço cair sozinho, no modo manual garantimos que continue 
        // ouvindo se a intenção do usuário era manter gravando
        else if (currentVoiceMode === 'manual' && isManualRecording) {
            try { recognition.start(); } catch(e) {}
        } 
        // Se estiver no modo continuo e a UI não estiver bloqueada, retoma
        else if (currentVoiceMode === 'continuous' && !document.getElementById("prompt").disabled) {
            try { recognition.start(); } catch(e) {}
        }
    });
};