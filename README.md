# LinkedIn Sales Navigator Scraper [PRIVADO]

Este ator para Apify permite extrair perfis de leads do LinkedIn Sales Navigator usando links específicos ou palavras-chave de busca.

## Características

- **Autenticação por Cookie**: Autenticação segura usando cookies do LinkedIn (at_lt/li_at)
- **Duas modalidades de busca**:
  - Por URL: use uma URL do Sales Navigator com filtros pré-configurados
  - Por palavras-chave: busque perfis usando termos específicos
- **Paginação automática**: navegação inteligente entre páginas de resultados
- **Suporte a proxy**: use os proxies da Apify para evitar bloqueios
- **Atrasos aleatórios**: comportamento humano simulado para evitar detecção
- **Extração enriquecida**: captura informações adicionais como tags, grau de conexão e identificadores únicos

## Dados extraídos

Para cada lead, o ator extrai:

- Nome completo
- Cargo/posição atual
- Localização
- Empresa atual
- URL do perfil no Sales Navigator
- ID do LinkedIn (extraído da URL)
- Tags associadas (quando disponíveis)
- Notas e anotações (quando visíveis)
- Grau de conexão
- Informações de contato disponíveis
- Data/hora da extração

## Como usar

### 1. Configure os parâmetros de entrada

| Parâmetro | Descrição |
|-----------|-----------|
| `linkedinCookies` | Array de objetos de cookies do LinkedIn (incluindo at_lt ou li_at) |
| `cookieString` | Alternativa: string de cookies copiada do navegador |
| `searchType` | Escolha entre 'link' ou 'keywords' |
| `searchUrl` | URL completa do Sales Navigator (necessário quando searchType = 'link') |
| `searchKeywords` | Termos de busca (necessário quando searchType = 'keywords') |
| `maxLeads` | Número máximo de leads para extrair (máx. 1000) |
| `maxPagesToScrape` | Número máximo de páginas para extrair (máx. 100) |
| `proxyConfiguration` | Configurações de proxy (recomendado usar os proxies da Apify) |

### 2. Obtendo os cookies do LinkedIn

Existem duas formas de fornecer os cookies de autenticação:

#### Método 1: Array de objetos de cookies
```javascript
[
  {
    "name": "at_lt", 
    "value": "valor-do-cookie",
    "domain": ".linkedin.com",
    "path": "/",
    "httpOnly": true,
    "secure": true
  }
]
```

#### Método 2: String de cookies (mais simples)
```
at_lt=valor-do-cookie; li_at=valor-do-outro-cookie
```

Para obter os cookies:
1. Faça login na sua conta do LinkedIn
2. Abra as ferramentas de desenvolvedor do navegador (F12)
3. Vá para a aba "Application" ou "Storage" > Cookies
4. Procure pelo cookie `at_lt` ou `li_at`
5. Copie o valor ou a string completa de cookies

### 3. Execute o ator

Após configurar os parâmetros, inicie o ator através da interface da Apify ou programaticamente via API.

### 4. Obtenha os resultados

Os dados extraídos estarão disponíveis em:
- **Dataset**: formato de tabela estruturada (CSV, JSON, Excel)
- **API**: para integração com outros sistemas

## Exemplos

### Exemplo 1: Busca por URL com cookie string

Use este método quando já tiver uma busca configurada no Sales Navigator com todos os filtros desejados:

```json
{
  "cookieString": "at_lt=valor-do-cookie; li_at=valor-do-outro-cookie",
  "searchType": "link",
  "searchUrl": "https://www.linkedin.com/sales/search/people?query=(filters:List((type:GEOGRAPHY,values:List((id:102105699,text:Brasil)))))",
  "maxLeads": 200,
  "maxPagesToScrape": 20,
  "proxyConfiguration": {
    "useApifyProxy": true
  }
}
```

### Exemplo 2: Busca por palavras-chave com objeto de cookies

Use este método para buscar perfis usando termos específicos:

```json
{
  "linkedinCookies": [
    {
      "name": "at_lt",
      "value": "valor-do-cookie-at_lt",
      "domain": ".linkedin.com",
      "path": "/",
      "httpOnly": true,
      "secure": true
    },
    {
      "name": "li_at",
      "value": "valor-do-cookie-li_at",
      "domain": ".linkedin.com",
      "path": "/",
      "httpOnly": true,
      "secure": true
    }
  ],
  "searchType": "keywords",
  "searchKeywords": "CTO startups tecnologia São Paulo",
  "maxLeads": 100,
  "maxPagesToScrape": 10,
  "proxyConfiguration": {
    "useApifyProxy": true
  }
}
```

## Considerações importantes

1. **Cookies de Autenticação**:
   - O cookie `at_lt` ou `li_at` é essencial para autenticar a sessão
   - Os cookies têm um tempo de vida limitado (geralmente horas ou dias)
   - Atualize os cookies regularmente quando expirados
   - O método de cookie é mais seguro do que usar usuário/senha direto

2. **Limites do LinkedIn**:
   - Respeite os termos de serviço do LinkedIn e mantenha taxas de requisição razoáveis
   - Distribua as execuções ao longo do tempo
   - O LinkedIn tem limites diários de visualização de perfis (variável por conta)

3. **Captchas e Segurança**:
   - Em casos de detecção, o LinkedIn pode apresentar captchas ou outras verificações
   - O ator fará capturas de tela para diagnóstico quando encontrar problemas
   - Os captchas não são resolvidos automaticamente - será necessário intervenção manual

4. **Proxies**:
   - Sempre utilize proxies rotacionados para distribuir as requisições e evitar bloqueios
   - Os proxies da Apify são recomendados por serem otimizados para este tipo de tarefa
   - Considere usar proxies residenciais para maior probabilidade de sucesso

## Solução de problemas

- **Autenticação falha**: 
  - Verifique se os cookies estão válidos e atualizados
  - Confirme se o cookie `at_lt` ou `li_at` está presente
  - Tente obter novos cookies fazendo login novamente no LinkedIn

- **Resultados vazios**:
  - Verifique a URL ou palavras-chave no navegador normal
  - Certifique-se de que sua conta tem acesso ao Sales Navigator
  - Confirme se os cookies foram extraídos corretamente

- **Bloqueio pelo LinkedIn**:
  - Aumente os valores de atraso mínimos e máximos no código
  - Utilize proxies de melhor qualidade
  - Reduza a frequência de execução
  - Verifique as capturas de tela de erro para diagnóstico

## Vantagens do Método de Cookie

1. **Segurança**: Não é necessário armazenar senhas em texto claro
2. **Confiabilidade**: Evita problemas de login com autenticação de dois fatores
3. **Eficiência**: Menos requisições para autenticação
4. **Detecção**: Menor probabilidade de acionar sistemas antifraude
5. **Flexibilidade**: Compatível com diferentes tipos de conta e configurações de segurança

## Limitações

- Este ator não contorna todos os mecanismos de detecção avançados do LinkedIn
- É necessário ter uma conta do LinkedIn com acesso ao Sales Navigator
- O número de resultados pode ser limitado pelas restrições do LinkedIn para sua conta
- Os cookies têm validade limitada e precisam ser atualizados periodicamente

## Boas Práticas

1. Execute o ator em intervalos moderados (não continuamente)
2. Varie as buscas e termos utilizados
3. Atualize os cookies regularmente
4. Utilize proxies de alta qualidade
5. Configure os atrasos conforme a urgência vs. risco de bloqueio

## Atualizações e Melhorias

Contribuições são bem-vindas! Para sugestões, problemas ou melhorias, abra uma issue no repositório.