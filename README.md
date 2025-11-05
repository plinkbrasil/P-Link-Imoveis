
# P-Link Imóveis — Next.js + Tailwind (file-based content)

Site base com SEO, sitemap/robots, JSON-LD e conteúdo por arquivos.
Inclui exemplo TR001 (Itaituba/PA) e slot para visualização 3D do QGIS.

## Rodar local
```bash
npm install
npm run dev
# http://localhost:3000
```

## Adicionar imóvel
Crie uma pasta em `content/properties/TR00X` com:
- `meta.json`
- `fotos/` (imagens)
- `3d/index.html` (opcional, export do Qgis2threejs)

## Build/Produção
```bash
npm run build
npm start
```

## Docker (opcional)
Veja o Dockerfile incluso.
