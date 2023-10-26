require('dotenv').config();

const openaiApiKey = process.env.OPENAI_API_KEY
const azureApiKey = process.env.AZURE_API_KEY

// Caputrar a fala do usuário
const CaputrarFala = () => {
    let botao = document.querySelector('#microfone');
    let icon = botao.querySelector('i');
    let input = document.querySelector('input');

    //Criar um objeto de reconhecimento de fala
    const recognition = new webkitSpeechRecognition();

    recognition.lang = window.navigator.language;
    recognition.interimResults = true;
    let buttonClicked = false;

    const changeButton = () => {
        botao.classList.remove('active');
        icon.classList.toggle('fa-microphone');
        icon.classList.toggle('fa-microphone-slash');
    }

    botao.addEventListener('click', () => {
        if (buttonClicked) {
            recognition.stop();
            PerguntaJarvis(input.value);
            buttonClicked = false;
            changeButton()
            
        } else {
            buttonClicked = true;
            recognition.start();
            input.placeholder = "Ouvindo..."
            changeButton()
        }

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            input.value = transcript;
        };

        // Evento de fim do reconhecimento de fala
        recognition.onend = () => {
            recognition.stop();
            PerguntaJarvis(input.value);
            buttonClicked = false;
            changeButton()
        }
    });
}

const AtivarJarvis = () => {
    let input = document.querySelector('input');
    // Crie uma instância de SpeechRecognition
    const recognition = new webkitSpeechRecognition();

    // Defina configurações para a instância
    recognition.lang = window.navigator.language;
    recognition.continuous = true; // Permite que ele continue escutando
    recognition.interimResults = false; // Define para true se quiser resultados parciais

    // Inicie o reconhecimento de voz
    recognition.start();

    // Adicione um evento de escuta para lidar com os resultados
    recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1]; // Último resultado

        // Verifique o texto reconhecido
        const recognizedText = result[0].transcript;

        // Verifique se a palavra "Jarvis" está no texto
        if (recognizedText.toLowerCase().includes('jarvis')) {

            // Comece a salvar a pergunta quando "Jarvis" é detectado
            let array_pergunta = recognizedText.toLowerCase().split('jarvis');
            array_pergunta = array_pergunta[array_pergunta.length - 1];
            
            if (array_pergunta.indexOf('.') == 0)  {
                array_pergunta = array_pergunta.replace(".", "");
            }

            if (array_pergunta.indexOf(',') == 0)  {
                array_pergunta = array_pergunta.replace(",", "");
            }

            array_pergunta = array_pergunta.trim();

            array_pergunta[0] = array_pergunta[0].toUpperCase();

            console.log(array_pergunta);

            array_pergunta = array_pergunta.trim();

            input.value = array_pergunta;
            PerguntaJarvis(array_pergunta);

            // Pare o reconhecimento de voz para economizar recursos
            recognition.stop();
        }
    };

    // Adicione um evento para reiniciar o reconhecimento após um tempo
    recognition.onend = () => {
        setTimeout(() => {
            recognition.start();
        }, 1000); // Espere 1 segundo antes de reiniciar
    };
}

const PerguntaJarvis = async (pergunta) => {
    let url = 'https://api.openai.com/v1/chat/completions';
    
    let header = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
    }

    let body = {
        "model": "ft:gpt-3.5-turbo-0613:zeros-e-um::8DDHyrh4",
        "messages": [
            {
                "role": "system",
                "content": "Jarvis é um chatbot pontual e muito simpático que ajuda as pessoas."
            },
            {
                "role": "user",
                "content": pergunta
            }
        ],
        "temperature": 0,
        "n": 1
    }

    let options = {
        method: 'POST',
        headers: header,
        body: JSON.stringify(body)
    }

    fetch(url, options)
    .then((response) => {
        return response.json();
    })
    .then((data) => {
        let respostas = data.choices
        
        respostas.forEach((resposta) => {
            FalarComoJarvis(resposta.message.content);
            // InsereResposta(resposta.message.content);
            let respostaField = document.querySelector("#resposta");
            respostaField.textContent = resposta.message.content;
        });
    })
}

const FalarComoJarvis = (resposta) => {
    let endpoint = "https://brazilsouth.tts.speech.microsoft.com/cognitiveservices/v1"
    let header = {
        "Ocp-Apim-Subscription-Key": azureApiKey,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
    }

    let body = `<speak version='1.0' xml:lang='pt-BR'><voice xml:lang='pt-BR' xml:gender='Male' name='pt-BR-JulioNeural'>${resposta}</voice></speak>`;

    let options = {
        method: 'POST',
        headers: header,
        body: body,
        redirect: 'follow'
    };

    fetch(endpoint, options)
    .then((response) => {
        if (response.ok) {
            return response.arrayBuffer();
        } else {
            throw new Error(`Falha na requisição: ${response.status} - ${response.statusText}`);
        }
    })
    .then((data) => {
        const blob = new Blob([data], {type: 'audio/mpeg'});
        const audioUrl = URL.createObjectURL(blob);
        const audioElement = new Audio(audioUrl);
        audioElement.play();
    })
    .catch((error) => {
        console.error('Error:', error)
    });
}

const CapturaTema = () => {
    let themeButton = document.querySelector(".theme");
    themeButton.addEventListener("click", () =>{
        TrocaTema(themeButton)
    })
}
const TrocaTema = (elemento) => {
    const body = document.querySelector('body');
    const input = document.querySelector('input');
    const icon = elemento.querySelector("i");
    const resposta = document.querySelector("#resposta");

    body.classList.toggle("dark");
    input.classList.toggle("dark");
    elemento.classList.toggle("dark");
    resposta.classList.toggle("dark")
    
    icon.classList.toggle("fa-moon");
    icon.classList.toggle("fa-sun");
}

const STTAzure = () => {
    let endpoint = "https://brazilsouth.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=pt-BR&format=detailed"

    let header = {
        "Ocp-Apim-Subscription-Key": azureApiKey,
        "Content-Type": "audio/wav"
    };

    var raw = "arquivo.wav";

    let options = {
        method: 'POST',
        headers: header,
        body: raw,
        redirect: 'follow'
    };

    fetch(endpoint, options)
    .then(response => response.text())
    .then(result => console.log(result.DisplayText))
    .catch(error => console.log('error', error));
}

// CaputrarFala();
AtivarJarvis();

CapturaTema();
// STTAzure();