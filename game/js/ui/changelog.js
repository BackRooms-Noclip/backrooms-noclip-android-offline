// Changelog visible dentro de la aplicación. La entrada superior se actualiza
// automáticamente al publicar una versión con tools/release.sh.
(function () {
  const CHANGELOG = [
    { v: 'v0.1.0-dev', cambios: [
      'Primera edición comunitaria exclusiva para Android y completamente offline.',
      'Se retiró la interfaz multijugador y cualquier intento de conexión externa.',
      'El progreso, los perfiles y el Códice se guardan localmente en el dispositivo.',
    ] },
  ];

  const CLAVE_VISTO = 'backrooms-changelog-visto';
  const ultima = CHANGELOG[0].v;

  function marcarNovedadSiHace() {
    const boton = document.getElementById('btn-changelog');
    if (boton && localStorage.getItem(CLAVE_VISTO) !== ultima) boton.classList.add('novedad');
  }

  function marcarVisto() {
    localStorage.setItem(CLAVE_VISTO, ultima);
    const boton = document.getElementById('btn-changelog');
    if (boton) boton.classList.remove('novedad');
  }

  function render(cont) {
    if (!cont || cont.childElementCount) return;
    const frag = document.createDocumentFragment();
    CHANGELOG.forEach((entrada, i) => {
      const det = document.createElement('details');
      det.className = 'cdx';
      if (i === 0) det.open = true;
      const sum = document.createElement('summary');
      sum.textContent = entrada.v;
      det.appendChild(sum);
      const ul = document.createElement('ul');
      ul.className = 'changelog-ul';
      for (const cambio of entrada.cambios) {
        const li = document.createElement('li');
        li.textContent = cambio;
        ul.appendChild(li);
      }
      det.appendChild(ul);
      frag.appendChild(det);
    });
    cont.appendChild(frag);
  }

  window.Changelog = { render, marcarVisto };
  marcarNovedadSiHace();
})();
