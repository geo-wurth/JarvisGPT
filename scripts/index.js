/*******************************************************************
 * index.js
 * 
 * Arquivo principal responsável pela inicialização da aplicação
 ********************************************************************/

/*******************************************************************
 * 1  Inicialização do reconhecimento de voz
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
 * 2  Controle global de carregamento
 ********************************************************************/

// Controla se existe uma requisição em andamento
let carregando = false;

/*******************************************************************
 * 3  Inicialização final
 ********************************************************************/

// Inicializa captura de voz
CapturarVoz();

// Inicializa eventos da interface
InicializarUI();

// Inicializa controle de tema
InicializarTema();