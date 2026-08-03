#!/usr/bin/env python3
from pathlib import Path
import datetime, json, re, subprocess, sys

if len(sys.argv) < 2:
    raise SystemExit('Uso: python tools/release.py v0.1.0-beta.1')
version = sys.argv[1]
if not re.fullmatch(r'v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?', version):
    raise SystemExit('Versión inválida. Ejemplo: v0.1.0-beta.1')
plain = version[1:]

def run(*args):
    return subprocess.check_output(args, text=True).strip()

try:
    last_tag = run('git', 'describe', '--tags', '--abbrev=0')
    rev_range = f'{last_tag}..HEAD'
except subprocess.CalledProcessError:
    last_tag = None
    rev_range = 'HEAD'

raw = run('git', 'log', rev_range, '--pretty=%s')
commits = [x.strip() for x in raw.splitlines() if x.strip()]
commits = [x for x in commits if not x.startswith('chore(release):')]
if not commits:
    commits = ['Actualización de mantenimiento de la aplicación offline.']

categories = {'Añadido': [], 'Corregido': [], 'Cambiado': []}
for msg in commits:
    low = msg.lower()
    clean = re.sub(r'^[a-z]+(?:\([^)]*\))?!?:\s*', '', msg, flags=re.I)
    if low.startswith(('feat', 'add')):
        categories['Añadido'].append(clean)
    elif low.startswith(('fix', 'bug')):
        categories['Corregido'].append(clean)
    else:
        categories['Cambiado'].append(clean)

date = datetime.date.today().isoformat()
section = [f'## [{version}] - {date}', '']
for title, items in categories.items():
    if items:
        section += [f'### {title}'] + [f'- {x}' for x in items] + ['']
section_text = '\n'.join(section).rstrip() + '\n\n'

changelog = Path('CHANGELOG.md')
text = changelog.read_text(encoding='utf-8')
insert_at = text.find('\n## ')
if insert_at == -1:
    text = text.rstrip() + '\n\n' + section_text
else:
    text = text[:insert_at+1] + section_text + text[insert_at+1:]
changelog.write_text(text, encoding='utf-8')

notes = [f'## BACKROOMS — NoClip Android Offline {version}', '',
         'APK firmada para Android, diseñada para funcionar completamente sin conexión.', '']
for title, items in categories.items():
    if items:
        notes += [f'### {title}'] + [f'- {x}' for x in items] + ['']
notes += ['### Instalación', '- Descarga `backrooms-noclip-offline.apk`.',
          '- Permite la instalación desde tu navegador o gestor de archivos cuando Android lo solicite.',
          '- Las actualizaciones futuras deben estar firmadas con la misma clave.', '']
Path('RELEASE_NOTES.md').write_text('\n'.join(notes), encoding='utf-8')

readme = Path('README.md')
r = readme.read_text(encoding='utf-8')
r = re.sub(r'<!-- latest-release:start -->.*?<!-- latest-release:end -->',
           f'<!-- latest-release:start -->\n**Última versión preparada:** `{version}`\n<!-- latest-release:end -->', r, flags=re.S)
readme.write_text(r, encoding='utf-8')

main = Path('game/js/main.js')
m = main.read_text(encoding='utf-8')
m = re.sub(r"window\.VERSION_JUEGO = '[^']+';", f"window.VERSION_JUEGO = '{version}';", m, count=1)
main.write_text(m, encoding='utf-8')

pkg = Path('android-app/package.json')
p = json.loads(pkg.read_text(encoding='utf-8'))
p['version'] = plain
pkg.write_text(json.dumps(p, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Changelog interno: conserva hasta cinco versiones generadas desde CHANGELOG.md.
content = changelog.read_text(encoding='utf-8')
entries = []
for match in re.finditer(r'^## \[(v[^\]]+)\].*?\n(.*?)(?=^## \[|\Z)', content, flags=re.M|re.S):
    v, body = match.group(1), match.group(2)
    items = [re.sub(r'^-\s*', '', line).strip() for line in body.splitlines() if line.startswith('- ')]
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
