---
description: Corrigir ou ajustar QR Code em qualquer parte do sistema Elite Track
---

# /fix-qrcode

## Antes de qualquer alteração, LEIA estes arquivos (nesta ordem):

1. `src/constants/companyInfo.ts` — `getAppBaseUrl()`, `PRODUCTION_URL`
2. `src/utils/qrUtils.ts` — Utilitário centralizado de QR (URL + imagem)
3. `src/pages/QRCode.tsx` (174 linhas) — Página do QR para o cliente
4. `src/pages/QRRedirect.tsx` (146 linhas) — Redirect de `/qr/:code`
5. `src/components/laudo/EliteShieldLaudo.tsx:780-815` — QR no laudo digital
6. `src/utils/pdfGenerator.ts:153-171` — QR no PDF
7. `src/components/executor/QRScanner.tsx:57-70` — Parser de URL do scanner

## Regras de URL

- **Laudo HTML**: `${window.location.origin}/verify/${project.id}` (dinâmico)
- **PDF**: `${PRODUCTION_URL}/verify/${project.id}` (fixo, domínio de produção)
- **Página QR**: `${getAppBaseUrl()}/verify/${project.id}`
- **API externa (imagem)**: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
- **Lib interna (dataURL para PDF)**: `import QRCode from 'qrcode'` → `QRCode.toDataURL(url, opts)`

## Utilitário centralizado: `src/utils/qrUtils.ts`

Todas as funções de QR devem usar este utilitário:
- `getVerifyUrl(projectId)` — retorna URL de verificação
- `getQrImageUrl(projectId, options?)` — retorna URL da imagem QR (api.qrserver.com)
- `generateQrDataUrl(projectId)` — retorna base64 DataURL (para PDF)

## Checklist de validação

- [ ] URL gerada aponta para `/verify/{projectId}` (não `/qr/`)
- [ ] QR Code é visível no laudo HTML (seção EliteTrace)
- [ ] QR Code é visível no PDF (página 4, seção EliteTrace)
- [ ] QR Code na página `/qrcode` usa `getAppBaseUrl()`
- [ ] Scanner (`QRScanner.tsx`) extrai corretamente códigos de URLs `/verify/`, `/qr/`, `/card/`
- [ ] Alt text da imagem: `"QR Code EliteTrace"`
- [ ] Tamanho responsivo no laudo: `w-32 sm:w-48` (não fixo `w-48`)

## Teste Playwright

```bash
npx playwright test tests/operador-perfil.spec.ts --grep "QR Code"
```
