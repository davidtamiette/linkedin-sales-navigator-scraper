# LinkedIn Sales Navigator Scraper

Este projeto é um actor do Apify para extrair perfis do LinkedIn Sales Navigator com base em palavras-chave, localização e outras opções.

## Como usar

1. **Configuração do input:**
   - Preencha o `input.json` ou use o input schema na interface do Apify Cloud.
2. **Execução:**
   - Local: `npm start`
   - Apify Cloud: Publique e execute pelo console.apify.com

## Parâmetros de entrada
- `sessionCookie`: Cookie `li_at` do LinkedIn (obrigatório)
- `keywords`: Palavras-chave para busca
- `location`: Localização geográfica
- `maxResults`: Máximo de perfis a extrair
- `extractDetails`: Extrair detalhes individuais dos perfis

## Output
- Os resultados são salvos no dataset padrão do Apify.

## Dependências
- [apify](https://www.npmjs.com/package/apify) v3+

## Observações
- Nunca compartilhe seu cookie `li_at` publicamente!
- O uso deste scraper deve respeitar os Termos de Uso do LinkedIn.
