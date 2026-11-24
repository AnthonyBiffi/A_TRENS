# Assets Oficiais — A3 Mobilidade

Extraia esta pasta dentro de `public/assets/` no seu projeto (`A3_final_js-v2`).

## Arquivos incluídos

| Arquivo | Uso recomendado | Dimensões |
| :--- | :--- | :--- |
| `logo-a3-mobilidade.png` | Logo completo com fundo transparente (Alta Resolução / Retina) | 1154 × 726 px |
| `logo-a3-mobilidade@1x.png` | Logo completo com fundo transparente (tamanho padrão) | 577 × 363 px |
| `logo-a3-mobilidade-fundo-escuro.png` | Logo completo com card azul-marinho `#06122A` (para fundos claros e tela inicial) | 1234 × 790 px |
| `logo-a3-simbolo.png` | Apenas o símbolo **A3 + Trem + Sinal** (transparente, ideal para navbar) | 1114 × 462 px |
| `logo-a3-simbolo@1x.png` | Apenas o símbolo **A3 + Trem + Sinal** (tamanho padrão) | 557 × 231 px |
| `logo-a3-mobilidade.svg` | Versão SVG pronta para `<img src="assets/logo-a3-mobilidade.svg">` | 1154 × 726 px |
| `icon-a3-512x512.png` | Ícone quadrado de aplicativo / PWA / splash screen | 512 × 512 px |
| `apple-touch-icon.png` | Ícone para dispositivos iOS / Android | 180 × 180 px |
| `favicon-32x32.png` / `favicon-16x16.png` / `favicon.ico` | Ícone da aba do navegador | 16px – 64px |

## Como colocar no seu projeto (`public/index.html`)

1. **Favicon no `<head>` do `public/index.html`:**
   ```html
   <link rel="icon" type="image/x-icon" href="assets/favicon.ico" />
   <link rel="icon" type="image/png" sizes="32x32" href="assets/favicon-32x32.png" />
   <link rel="apple-touch-icon" sizes="180x180" href="assets/apple-touch-icon.png" />
   ```

2. **No cabeçalho (`<header class="app-header">`) ou na Tela Inicial (`#screen-tela1`):**
   ```html
   <!-- No cabeçalho superior -->
   <img src="assets/logo-a3-simbolo.png" alt="A3 Mobilidade" style="height: 44px; width: auto;" />

   <!-- Na tela inicial (substituindo o emoji 🚇) -->
   <img src="assets/logo-a3-mobilidade-fundo-escuro.png" alt="A3 Mobilidade" style="max-width: 240px; height: auto; margin-bottom: 12px;" />
   ```
