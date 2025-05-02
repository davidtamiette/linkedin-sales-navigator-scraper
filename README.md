# LinkedIn Sales Navigator Scraper

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