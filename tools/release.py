#!/usr/bin/env python3
from pathlib import Path
import datetime, json, re, subprocess, sys

if len(sys.argv) < 2:
    raise SystemExit('Uso: python tools/release.py v0.2.0-beta')
version = sys.argv[1]
if not re.fullmatch(r'v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?', version):
    raise SystemExit('Versión inválida. Ejemplo: v0.2.0-beta')
plain = version[1:]


def run(*args):
    return subprocess.check_output(args, text=True).strip()


def bulletize(msg: str) -> str:
    return re.sub(r'^[a-z]+(?:\([^)]*\))?!?:\s*', '', msg, flags=re.I).strip().rstrip('.') + '.'


def classify(commits):
    sections = {
        'novedades': [],
        'mejoras': [],
        'correcciones': [],
        'seguridad': [],
        'conocidos': [],
    }
    for msg in commits:
        low = msg.lower()
        clean = bulletize(msg)
        if low.startswith(('feat', 'add')):
            sections['novedades'].append(clean)
        elif low.startswith(('fix', 'bug')):
            sections['correcciones'].append(clean)
        elif low.startswith(('sec', 'security')):
            sections['seguridad'].append(clean)
        else:
            sections['mejoras'].append(clean)
    return sections


try:
    last_tag = run('git', 'describe', '--tags', '--abbrev=0')
    rev_range = f'{last_tag}..HEAD'
except subprocess.CalledProcessError:
    last_tag = None
    rev_range = 'HEAD'

raw = run('git', 'log', rev_range, '--pretty=%s')
commits = [x.strip() for x in raw.splitlines() if x.strip()]
commits = [x for x in commits if not x.startswith('chore(release):')]
sections = classify(commits)

# Defaults for empty sections
if not sections['novedades']:
    sections['novedades'] = ['Se añadió una nueva actualización de mantenimiento para la edición Android offline.']
if not sections['mejoras']:
    sections['mejoras'] = ['Se ajustaron componentes internos de la aplicación para mejorar la estabilidad general.']
if not sections['correcciones']:
    sections['correcciones'] = ['Se solucionaron problemas menores detectados en la versión anterior.']
if not sections['seguridad']:
    sections['seguridad'] = ['Se mantiene la verificación SHA-256 de la APK publicada en la Release.']
if not sections['conocidos']:
    sections['conocidos'] = ['El juego sigue limitado al modo offline para un jugador.']

# Size heuristic
count = sum(len(v) for v in sections.values())
size = 'small' if count <= 5 else 'medium' if count <= 12 else 'large'
kind = 'stable'
for label in ('alpha', 'beta', 'rc'):
    if label in version.lower():
        kind = label
        break

# Summary
summary_parts = []
if sections['novedades']:
    summary_parts.append(sections['novedades'][0])
if sections['correcciones']:
    summary_parts.append(sections['correcciones'][0])
summary = ' '.join(summary_parts[:2]).strip()
if not summary:
    summary = 'Breve resumen general de esta actualización.'

date = datetime.date.today().isoformat()

# CHANGELOG.md append with discord-friendly structure
changelog_path = Path('CHANGELOG.md')
existing = changelog_path.read_text(encoding='utf-8').rstrip() + '\n\n'
entry_lines = [
    f'## [{version}] - {date}',
    f'<!-- noclip:type={kind} -->',
    f'<!-- noclip:size={size} -->',
    '',
    summary,
    '',
    '### ✨ Novedades',
] + [f'- {x}' for x in sections['novedades']] + [
    '', '### 🛠️ Cambios y mejoras',
] + [f'- {x}' for x in sections['mejoras']] + [
    '', '### 🐛 Correcciones',
] + [f'- {x}' for x in sections['correcciones']] + [
    '', '### 🛡️ Seguridad',
] + [f'- {x}' for x in sections['seguridad']] + [
    '', '### ⚠️ Problemas conocidos',
] + [f'- {x}' for x in sections['conocidos']] + [
    '', '### 📱 Requisitos',
    '- Android 8.0 o superior.',
    '- Arquitectura arm64-v8a.',
    '- Aproximadamente 500 MB de almacenamiento libre.',
    ''
]
entry_text = '\n'.join(entry_lines)
insert_at = existing.find('\n## [', existing.find('\n## [') + 1)
if insert_at == -1:
    # after header and intro
    match = re.search(r'(^# .*?$.*?^\s*$)', existing, flags=re.M | re.S)
    if match:
        new_content = existing[:match.end()] + entry_text + '\n\n' + existing[match.end():]
    else:
        new_content = existing + entry_text + '\n'
else:
    first_version = existing.find('\n## [')
    new_content = existing[:first_version+1] + entry_text + '\n\n' + existing[first_version+1:]
changelog_path.write_text(new_content.rstrip() + '\n', encoding='utf-8')

# RELEASE_NOTES.md exact template
notes_lines = [
    f'<!-- noclip:type={kind} -->',
    f'<!-- noclip:size={size} -->',
    '',
    f'# BackRooms-Noclip Android {version}',
    '',
    summary,
    '',
    '## ✨ Novedades',
] + [f'- {x}' for x in sections['novedades']] + [
    '', '## 🛠️ Cambios y mejoras',
] + [f'- {x}' for x in sections['mejoras']] + [
    '', '## 🐛 Correcciones',
] + [f'- {x}' for x in sections['correcciones']] + [
    '', '## 🛡️ Seguridad',
] + [f'- {x}' for x in sections['seguridad']] + [
    '', '## ⚠️ Problemas conocidos',
] + [f'- {x}' for x in sections['conocidos']] + [
    '', '## 📱 Requisitos',
    '- Android 8.0 o superior.',
    '- Arquitectura arm64-v8a.',
    '- Aproximadamente 500 MB de almacenamiento libre.',
    ''
]
Path('RELEASE_NOTES.md').write_text('\n'.join(notes_lines), encoding='utf-8')

# README latest markers
readme = Path('README.md')
r = readme.read_text(encoding='utf-8')
r = re.sub(r'<!-- latest-release:start -->.*?<!-- latest-release:end -->',
           f'<!-- latest-release:start -->\n**Última versión preparada:** `{version}`\n<!-- latest-release:end -->', r, flags=re.S)
latest_summary = '\n'.join(f'- {x}' for x in (sections['novedades'][:2] + sections['correcciones'][:1]))
r = re.sub(r'<!-- latest-summary:start -->.*?<!-- latest-summary:end -->',
           f'<!-- latest-summary:start -->\n{latest_summary}\n<!-- latest-summary:end -->', r, flags=re.S)
readme.write_text(r, encoding='utf-8')

# Game version
main = Path('game/js/main.js')
m = main.read_text(encoding='utf-8')
m = re.sub(r"window\.VERSION_JUEGO = '[^']+';", f"window.VERSION_JUEGO = '{version}';", m, count=1)
main.write_text(m, encoding='utf-8')

# Android package version
pkg = Path('android-app/package.json')
p = json.loads(pkg.read_text(encoding='utf-8'))
p['version'] = plain
pkg.write_text(json.dumps(p, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# In-game changelog: up to 5 recent versions
content = changelog_path.read_text(encoding='utf-8')
entries = []
for match in re.finditer(r'^## \[(v[^\]]+)\].*?(?=^## \[|\Z)', content, flags=re.M | re.S):
    block = match.group(0)
    v = match.group(1)
    items = [re.sub(r'^-\s*', '', line).strip() for line in block.splitlines() if line.startswith('- ')]
    if items:
        entries.append((v, items[:12]))
    if len(entries) >= 5:
        break
js_entries = ',\n'.join(
    "    { v: %s, cambios: %s }" % (json.dumps(v, ensure_ascii=False), json.dumps(items, ensure_ascii=False))
    for v, items in entries
)
template = f"""// Generado por tools/release.py.\n(function () {{\n  const CHANGELOG = [\n{js_entries}\n  ];\n  const CLAVE_VISTO = 'backrooms-changelog-visto';\n  const ultima = CHANGELOG[0].v;\n  function marcarNovedadSiHace() {{\n    const boton = document.getElementById('btn-changelog');\n    if (boton && localStorage.getItem(CLAVE_VISTO) !== ultima) boton.classList.add('novedad');\n  }}\n  function marcarVisto() {{\n    localStorage.setItem(CLAVE_VISTO, ultima);\n    const boton = document.getElementById('btn-changelog');\n    if (boton) boton.classList.remove('novedad');\n  }}\n  function render(cont) {{\n    if (!cont || cont.childElementCount) return;\n    const frag = document.createDocumentFragment();\n    CHANGELOG.forEach((entrada, i) => {{\n      const det = document.createElement('details'); det.className = 'cdx'; if (i === 0) det.open = true;\n      const sum = document.createElement('summary'); sum.textContent = entrada.v; det.appendChild(sum);\n      const ul = document.createElement('ul'); ul.className = 'changelog-ul';\n      for (const cambio of entrada.cambios) {{ const li = document.createElement('li'); li.textContent = cambio; ul.appendChild(li); }}\n      det.appendChild(ul); frag.appendChild(det);\n    }});\n    cont.appendChild(frag);\n  }}\n  window.Changelog = {{ render, marcarVisto }};\n  marcarNovedadSiHace();\n}})();\n"""
Path('game/js/ui/changelog.js').write_text(template, encoding='utf-8')
print(f'Archivos de versión preparados para {version}. Cambios incluidos: {len(commits)}')
