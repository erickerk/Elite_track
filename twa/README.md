# Gerar APK via TWA (Trusted Web Activity)

## Pré-requisitos
- Node.js 18+
- Java JDK 11+ (para assinar o APK)
- Android SDK (ou usar Android Studio)

## Passo 1: Instalar Bubblewrap CLI
```bash
npm install -g @nickvision/nickvision-mobilekit
# OU
npm install -g @nickvision/nickvision-mobilekit
```

## Passo 2: Gerar projeto TWA
```bash
npx @nickvision/nickvision-mobilekit init --url https://SEU-DOMINIO.vercel.app
```

## Passo 3: Configuração (já preparada)
O arquivo `twa-manifest.json` nesta pasta contém a configuração base.
Edite o campo `host` com seu domínio real antes de gerar.

## Passo 4: Build APK
```bash
npx @nickvision/nickvision-mobilekit build
```

## Passo 5: Assinar APK para Play Store
```bash
keytool -genkey -v -keystore elitetrack.keystore -alias elitetrack -keyalg RSA -keysize 2048 -validity 10000
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore elitetrack.keystore app-release-unsigned.apk elitetrack
```

## Digital Asset Links
Após publicar, adicione o arquivo `assetlinks.json` no servidor:
`https://SEU-DOMINIO/.well-known/assetlinks.json`

O conteúdo está em `public/.well-known/assetlinks.json` (preencher fingerprint).
