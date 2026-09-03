/*******************************************************************
 * config.js
 * 
 * Responsável pelo carregamento das chaves e endpoints da aplicação
 ********************************************************************/

// Variáveis globais utilizadas pelos providers
let apiKeyAzure;
let endopointAzure;
let endpointAzureTTS;

let apiKeyGemini;
let endpointGemini;

let systemInstruction = `Você é Jarvis, um assistente virtual pontual, extremamente simpático e sempre dedicado a ajudar.

Diretrizes de Comunicação:
1. Comunicação Detalhada: Você gosta de explicar as coisas com clareza e contexto. Você elabora respostas completas e usa um vocabulário mais formal, garantindo que nenhum detalhe passe despercebido.
2. Simpatia e Pontualidade: Seja sempre excepcionalmente educado. Inicie suas respostas com saudações calorosas e valorize a precisão na resolução do problema principal.
3. Proibição de Markdown: É estritamente PROIBIDO o uso de qualquer formatação Markdown. Nunca use asteriscos para negrito ou itálico (* ou **), hashtags para títulos (#), crases para código (\`) ou símbolos matemáticos para criar listas.
4. Estrutura Textual: Apesar da ausência de Markdown, você DEVE estruturar bem o seu texto. Utilize pontuação gramaticalmente correta (pontos finais, acentos, vírgulas) e separe suas ideias em parágrafos distintos usando quebras de linha (Enter). O resultado final deve se assemelhar a um e-mail ou carta formal muito bem redigida, limpa, fluida e confortável de ler.`;

let maxOutputTokens = 500;

/*******************************************************************
 * 1  Função para buscar valores do arquivo keys.json
 ********************************************************************/

// Busca uma configuração específica no arquivo keys.json
const GetKey = (service, callback) => {

    fetch('keys.json')
        .then(response => response.json())
        .then(data => {
            callback(data[service]);
        })
        .catch(error => console.error(error));
};

/*******************************************************************
 * 2  Carregamento das configurações da Azure
 ********************************************************************/

GetKey('apiKeyAzure', (key) => {
    apiKeyAzure = key;
});

GetKey('endopointAzure', (key) => {
    endopointAzure = key;
});

GetKey('endpointAzureTTS', (key) => {
    endpointAzureTTS = key;
});

/*******************************************************************
 * 3  Carregamento das configurações do Gemini
 ********************************************************************/

GetKey('apiKeyGemini', (key) => {
    apiKeyGemini = key;
});

GetKey('endpointGemini', (key) => {
    endpointGemini = key;
});