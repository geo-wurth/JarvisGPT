/*******************************************************************
 * tema.js
 * 
 * Responsável pelo controle de tema da aplicação
 ********************************************************************/

/*******************************************************************
 * 1  Inicialização do controle de tema
 ********************************************************************/

// Inicializa os eventos relacionados ao tema
function InicializarTema() {

    const toggleButton = document.getElementById('toggle-mode');

    toggleButton.addEventListener('click', function () {
        TrocarTema();
    });
}

/*******************************************************************
 * 2  Alternância de tema
 ********************************************************************/

// Alterna entre os modos claro e escuro
const TrocarTema = () => {

    const body = document.body;

    // Verifica se o tema atual é dark mode
    const isDarkMode = body.classList.contains('dark-mode');

    // Alterna a classe do tema
    body.classList.toggle('dark-mode');

    // Atualiza o ícone do botão
    const toggleButton = document.getElementById('toggle-mode');

    toggleButton.innerHTML = isDarkMode
        ? '<i class="fas fa-moon"></i>'
        : '<i class="fas fa-sun"></i>';
}