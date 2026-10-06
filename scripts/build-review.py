"""Bundle the implemented game for offline review without publishing it."""
from pathlib import Path
import base64, json, mimetypes, re

ROOT=Path(__file__).resolve().parent.parent
assets={}
def embedded(file):
    file=file.resolve()
    if not file.is_relative_to(ROOT) or not file.is_file():
        raise ValueError(f'Missing or invalid asset: {file}')
    mime=mimetypes.guess_type(str(file))[0] or 'application/octet-stream'
    return 'data:'+mime+';base64,'+base64.b64encode(file.read_bytes()).decode()

for folder in ['assets/story/prologue','assets/story/exterior-v175','assets/characters']:
    for file in (ROOT/folder).glob('*'):
        if file.is_file():assets[file.relative_to(ROOT).as_posix()]=embedded(file)
html=(ROOT/'index.html').read_text()
html=re.sub(r'\s*<link[^>]*rel="preload"[^>]*>', '', html)
def stylesheet(m):
    file=ROOT/m.group(1).split('?')[0]
    css=file.read_text()
    def cssurl(u):
        value=u.group(1).strip('"\'')
        if value.startswith('data:'):return u.group(0)
        target=file.parent/value.split('?')[0]
        if target.name.startswith('home-bg'):target=ROOT/'assets/story/prologue/exterior-summer.svg'
        return 'url("'+embedded(target)+'")'
    css=re.sub(r'url\(([^)]+)\)',cssurl,css)
    return '<style>'+css+'</style>'
html=re.sub(r'<link rel="stylesheet" href="([^"]+)"\s*/>',stylesheet,html)
def script(m):
    content=(ROOT/m.group(1).split('?')[0]).read_text().replace('</script','<\\/script')
    return "<script>document.addEventListener('DOMContentLoaded',function(){\n"+content+'\n});</script>'
html=re.sub(r'<script src="([^"]+)" defer></script>',script,html)
def image(m):
    path=m.group(1).split('?')[0]
    return 'src="'+(assets.get(path) or embedded(ROOT/path))+'"'
html=re.sub(r'src="(assets/[^"]+)"',image,html)
html=html.replace('href="favicon.svg"','href="'+embedded(ROOT/'favicon.svg')+'"')
html=re.sub(r'\s*<a class="title-menu-item" href="wardrobe.html">.*?</a>', '',html,flags=re.S)
html=html.replace('</head>','<script>const reviewAssets='+json.dumps(assets)+';window.PixelyAsset=path=>reviewAssets[path]||path;</script></head>')
(ROOT/'prologue-review.html').write_text(html)
print(f'Offline review: {(ROOT/"prologue-review.html").stat().st_size:,} bytes')
