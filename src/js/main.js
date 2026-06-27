/* ── Router ── */

const pages = {

  'home':          { title: 'Página Inicial' },

  'coulomb':       { title: 'Lei de Coulomb' },

  'gauss':         { title: 'Lei de Gauss' },

  'potencial':     { title: 'Potencial Elétrico' },

  'dipolo':        { title: 'Dipolo Elétrico' },

  'resistores':    { title: 'Resistores' },

  'capacitores':   { title: 'Capacitores' },

  'biot':          { title: 'Lei de Biot-Savart' },

  'ampere':        { title: 'Lei de Ampère' },

  'potencial-mag': { title: 'Potenciais Magnéticos' },

  'forca-mag':     { title: 'Força Magnética' },

  'hall':          { title: 'Efeito Hall' },

  'maxwell':       { title: 'Equações de Maxwell' },

  'quem-somos':    { title: 'Quem Somos?' },

};



let currentPage = 'home';



// Controladores das simulações (registrados por cada script de simulação)

const simulationControllers = {};



function navigate(page) {

  if (!pages[page]) return;



  // Para a simulação da página atual, se houver

  const prevCtrl = simulationControllers[currentPage];

  if (prevCtrl && typeof prevCtrl.stop === 'function') {

    prevCtrl.stop();

  }



  // Oculta todas as páginas

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Mostra a página alvo

  const el = document.getElementById('page-' + page);

  if (el) el.classList.add('active');



  // Atualiza navegação

  document.querySelectorAll('.nav-item').forEach(item => {

    item.classList.toggle('active', item.dataset.page === page);

  });



  // Atualiza título da barra superior

  document.getElementById('page-title').textContent = pages[page].title;



  // Rola para o topo

  document.getElementById('main').scrollTo({ top: 0 });

  window.scrollTo({ top: 0 });



  currentPage = page;



  // Inicia a simulação da nova página, se houver

  const nextCtrl = simulationControllers[page];

  if (nextCtrl && typeof nextCtrl.start === 'function') {

    nextCtrl.start();

  }



  // Fecha sidebar em mobile

  if (window.innerWidth <= 768) {

    closeSidebarMobile();

  }

}



// ── Registrar controladores (cada simulação expõe seu controller) ──

// Estes são preenchidos pelos scripts de cada simulação.

// Aqui apenas definimos um objeto que será populado.



// Após todas as simulações serem carregadas, os controllers serão inseridos.

// Como o código é executado em ordem, precisamos garantir que o navigate inicial

// só chame a simulação depois que todos os scripts forem carregados.

// Para isso, vamos iniciar a navegação após um pequeno delay ou após o carregamento.

// Mas como os scripts estão no final do body, eles serão executados antes deste script?

// Sim, estão no final, então serão executados em ordem. Vamos modificar para que o

// navigate('home') seja chamado após todos os scripts.

// Por enquanto, vamos manter o navigate('home') no final, mas primeiro vamos

// registrar os controllers.



/* ── Sidebar toggle ── */

let sidebarOpen = true;



function toggleSidebar() {

  if (window.innerWidth <= 768) {

    // mobile: overlay mode

    const sidebar = document.getElementById('sidebar');

    const overlay = document.getElementById('overlay');

    const isOpen = sidebar.classList.contains('mobile-open');

    if (isOpen) {

      sidebar.classList.remove('mobile-open');

      overlay.style.display = 'none';

    } else {

      sidebar.classList.add('mobile-open');

      overlay.style.display = 'block';

    }

  } else {

    // desktop: push mode

    sidebarOpen = !sidebarOpen;

    const sidebar  = document.getElementById('sidebar');

    const topbar   = document.getElementById('topbar');

    const main     = document.getElementById('main');

    sidebar.classList.toggle('hidden', !sidebarOpen);

    topbar.classList.toggle('sidebar-hidden', !sidebarOpen);

    main.classList.toggle('sidebar-hidden', !sidebarOpen);

  }

}



function closeSidebarMobile() {

  document.getElementById('sidebar').classList.remove('mobile-open');

  document.getElementById('overlay').style.display = 'none';

}



// Inicializa a página inicial após o carregamento completo

// Para garantir que todos os controllers estejam registrados, aguardamos o DOM.

document.addEventListener('DOMContentLoaded', function() {

  // Os scripts de simulação já foram executados e registraram seus controllers

  // em window.__*Controller, mas ainda não foram copiados para simulationControllers.

  // Vamos fazer a cópia agora.

  // Mapeamento dos nomes das páginas para os nomes das variáveis globais

  const controllerMap = {

    'coulomb': '__coulombController',

    'gauss': '__gaussController',

    'potencial': '__potencialController',

    'dipolo': '__dipoloController',

    'resistores': '__resistoresController',

    'capacitores': '__capacitoresController',

    'biot': '__biotController',

    'ampere': '__ampereController',

    'potencial-mag': '__potencialMagController',

    'forca-mag': '__forcaMagController',

    'hall': '__hallController',

    'maxwell': '__maxwellController',

  };



  for (const [page, varName] of Object.entries(controllerMap)) {

    if (window[varName]) {

      simulationControllers[page] = window[varName];

    }

  }



  // Navega para home (já está ativa, mas garante que a simulação da home não existe)

  // Porém, a home não tem simulação, então não inicia nada.

  // Se alguma página já estiver ativa por padrão (home), não precisamos chamar start.

  // Mas se a home for a primeira, e ela não tem simulação, ok.

  // Porém, se o usuário navegar para outra página, o navigate cuidará de parar/iniciar.

  // Vamos definir currentPage = 'home' e não chamar start.

  // Mas precisamos garantir que a home não tenha simulação, e que as outras

  // simulações só iniciem quando navegadas.

  // A página inicial já está ativa (class active), então não fazemos nada.

  // Mas precisamos que a primeira navegação para uma página com simulação funcione.

  // O navigate será chamado quando o usuário clicar em um item do menu.

  // Para garantir que a página inicial esteja corretamente configurada:

  document.getElementById('page-title').textContent = 'Página Inicial';

  // Marca o item home como ativo

  document.querySelectorAll('.nav-item').forEach(item => {

    item.classList.toggle('active', item.dataset.page === 'home');

  });

});