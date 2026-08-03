// Generado por tools/release.py.
(function () {
  const CHANGELOG = [
    { v: "v0.1.0-beta.1", cambios: ["iniciar edición Android offline"] },
    { v: "v0.1.0-dev", cambios: ["Base comunitaria exclusiva para Android.", "Empaquetado offline mediante Capacitor.", "Automatización de APK, firma, changelog, README y GitHub Releases.", "La interfaz principal ofrece únicamente el modo de un jugador.", "El motor de conexión funciona solo contra la simulación local incluida en la aplicación.", "Servidor MMO, despliegue web, salas privadas y controles de administración online.", "Marca personal anterior dentro de la interfaz y documentación del proyecto."] }
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
      const det = document.createElement('details'); det.className = 'cdx'; if (i === 0) det.open = true;
      const sum = document.createElement('summary'); sum.textContent = entrada.v; det.appendChild(sum);
      const ul = document.createElement('ul'); ul.className = 'changelog-ul';
      for (const cambio of entrada.cambios) { const li = document.createElement('li'); li.textContent = cambio; ul.appendChild(li); }
      det.appendChild(ul); frag.appendChild(det);
    });
    cont.appendChild(frag);
  }
  window.Changelog = { render, marcarVisto };
  marcarNovedadSiHace();
})();
