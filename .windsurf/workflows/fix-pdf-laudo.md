---
description: Corrigir ou ajustar o PDF do laudo EliteShield gerado por pdfGenerator.ts
---

# /fix-pdf-laudo

## Antes de qualquer alteração, LEIA estes arquivos:

1. `src/utils/pdfGenerator.ts` (955 linhas) — Gerador do PDF
2. `src/config/eliteshield-laudo-template.ts` (556 linhas) — Template de dados, textos, specs, garantias
3. `src/components/laudo/EliteShieldLaudo.tsx` (948 linhas) — Laudo HTML (referência visual)
4. `src/types/index.ts:137-168` — Interface `Project` (blindingLine, protectionLevel)
5. `src/constants/companyInfo.ts` — PRODUCTION_URL, COMPANY_INFO

## Estrutura do PDF (9 páginas)

| Página | Linhas no código | Conteúdo |
|---|---|---|
| 1 | 184-304 | **CAPA**: logo, título ELITESHIELD™, veículo, datas |
| 2 | 306-411 | **DADOS**: veículo, cliente, linha blindagem, specs técnicas |
| 3 | 413-517 | **PROCESSO**: timeline etapas, testes e verificações |
| 4 | 519-614 | **RESPONSÁVEIS**: técnicos, garantias, EliteTrace QR Code |
| 5 | 616-693 | **TERMOS 1-4**: declaração, proteção, materiais, processo |
| 6 | 695-773 | **TERMOS 5-8**: fotos, responsabilidade, garantia, limitações |
| 7 | 775-839 | **TERMOS 9-12**: manutenção, rastreabilidade, validade, declaração final |
| 8 | 841-891 | **STATUS**: badge finalizado/andamento, data emissão |
| 9 | 893-949 | **FOTOS** (condicional — só se houver fotos na timeline) |

## Funções auxiliares (linhas 1-152)

- `COLORS` — Paleta de cores RGB
- `generateQRCodeDataURL(text)` — QR Code como base64
- `loadImageAsDataURL(src)` — Carrega imagem com proporções
- `addPageHeader(doc, logo, pageNum, totalPages)` — Header com logo + nº página
- `addPageFooter(doc)` — Rodapé com dados da empresa
- `addSectionTitle(doc, title, y)` — Título de seção dourado → retorna novo Y
- `addField(doc, label, value, x, y, labelWidth)` — Campo label/valor → retorna novo Y
- `addCard(doc, x, y, w, h)` — Card com borda dourada

## Variáveis globais no escopo da função principal

- `pw` = largura da página (210mm A4)
- `ph` = altura da página (297mm A4)
- `m` = margem (15mm)
- `y` = posição vertical atual (CRÍTICA — sempre acompanhar)
- `totalPages` = número total de páginas (DEVE ser dinâmico)

## Regras ao editar

1. **Sempre rastrear `y`** após cada seção. Se `y > ph - 40`, quebrar página.
2. **Usar `doc.splitTextToSize(text, maxWidth)`** para textos longos.
3. **Specs devem ser condicionais**: usar `getEspecificacoesPorLinha(project.blindingLine)` do template.
4. **`totalPages` deve ser dinâmico**: `const totalPages = hasPhotos ? 9 : 8`
5. **Não usar valores mágicos** para posições. Sempre derivar de `y` anterior.
6. **Testar com Safe Core E Ultra Lite Armor** para validar specs condicionais.

## Checklist de validação

- [ ] Specs na página 2 são condicionais ao tipo de blindagem
- [ ] `totalPages` reflete número real de páginas
- [ ] QR Code visível na página 4 com URL `PRODUCTION_URL/verify/{id}`
- [ ] Garantia opacos = 10 anos
- [ ] "Uso: Executivo" NÃO aparece em nenhuma página
- [ ] Nomes longos não estouram o card
- [ ] PDF abre sem erros em qualquer viewer

## Teste

```bash
# Verificar build
npx tsc --noEmit
# Testar via Playwright (verificar laudo HTML como proxy)
npx playwright test tests/operador-perfil.spec.ts
```
