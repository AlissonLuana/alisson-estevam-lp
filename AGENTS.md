# Contexto do projeto

## URL pública para validação visual

Após qualquer alteração na interface, os resultados publicados devem ser verificados em:

**http://alisson-estevam-lp.s3-website-us-east-1.amazonaws.com/index.html**

Essa é a URL pública do website S3 do projeto `AlissonLuana/alisson-estevam-lp`.

## Publicação

As alterações na branch `main` são publicadas automaticamente pela GitHub Actions no bucket S3 `alisson-estevam-lp`.

O site utiliza hospedagem estática S3, sem CloudFront. A URL usa HTTP (não HTTPS).

## Páginas principais

- Landing page: `/index.html`
- Agendamento: `/pages/agendar.html`

Ao ajustar a UI, preserve a responsividade mobile e desktop e valide o resultado na URL pública após o deploy.
