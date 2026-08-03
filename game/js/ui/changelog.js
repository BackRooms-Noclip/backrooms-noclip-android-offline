// Generado por tools/release.py.
(function () {
  const CHANGELOG = [
    { v: "v0.2.2-beta", cambios: ["Se añadió una nueva actualización de mantenimiento para la edición Android offline.", "Se ajustaron componentes internos de la aplicación para mejorar la estabilidad general.", "ocupar toda la pantalla y eliminar insets laterales.", "Se mantiene la verificación SHA-256 de la APK publicada en la Release.", "El juego sigue limitado al modo offline para un jugador.", "Android 8.0 o superior.", "Arquitectura arm64-v8a.", "Aproximadamente 500 MB de almacenamiento libre."] },
    { v: "v0.2.1-beta", cambios: ["Se añadió una nueva actualización de mantenimiento para la edición Android offline.", "Se ajustaron componentes internos de la aplicación para mejorar la estabilidad general.", "forzar el icono oficial en instalador y launcher.", "eliminar franjas y ocupar toda la pantalla.", "Se mantiene la verificación SHA-256 de la APK publicada en la Release.", "El juego sigue limitado al modo offline para un jugador.", "Android 8.0 o superior.", "Arquitectura arm64-v8a.", "Aproximadamente 500 MB de almacenamiento libre."] },
    { v: "v0.2.0-beta.1", cambios: ["consolidar pantalla completa inmersiva e icono oficial.", "Se ajustaron componentes internos de la aplicación para mejorar la estabilidad general.", "corregir visibilidad de onResume para Capacitor 8.", "Se mantiene la verificación SHA-256 de la APK publicada en la Release.", "El juego sigue limitado al modo offline para un jugador.", "Android 8.0 o superior.", "Arquitectura arm64-v8a.", "Aproximadamente 500 MB de almacenamiento libre."] },
    { v: "v0.2.0-beta", cambios: ["integrar icono oficial de la aplicación.", "actualizar README principal y plantilla del changelog.", "forzar pantalla completa inmersiva y ocultar barras del sistema.", "Se mantiene la verificación SHA-256 de la APK publicada en la Release.", "El juego sigue limitado al modo offline para un jugador.", "Android 8.0 o superior.", "Arquitectura arm64-v8a.", "Aproximadamente 500 MB de almacenamiento libre."] },
    { v: "v0.1.0-beta.1", cambios: ["iniciar edición Android offline"] }
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
