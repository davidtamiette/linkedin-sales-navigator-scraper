# Usando Claude com LinkedIn Sales Navigator Scraper

Este documento explica como Claude pode ajudar com o desenvolvimento e manutenção deste projeto.

## Recursos que Claude pode oferecer

1. **Análise de código**: Claude pode revisar o código do scraper para identificar potenciais problemas, bugs ou melhorias de desempenho.

2. **Documentação**: Claude pode ajudar a documentar o código, criar exemplos de uso e melhorar o README.

3. **Soluções para bloqueios**: Claude pode sugerir técnicas anti-detecção adicionais quando o LinkedIn implementar novas proteções.

4. **Otimização de seletores CSS**: Claude pode ajudar a atualizar seletores quando a interface do LinkedIn Sales Navigator mudar.

5. **Resolução de erros**: Claude pode analisar logs de erro e sugerir soluções.

## Como usar Claude com este projeto

### Para análise de código
```
Claude, você pode revisar o código da função parseCookieString e sugerir melhorias?
```

### Para atualizar seletores
```
Claude, o seletor LEAD_RESULTS não está mais funcionando. Aqui está o HTML atual da página do Sales Navigator. Pode sugerir um novo seletor?
```

### Para melhorar mecanismos anti-bloqueio
```
Claude, estou enfrentando bloqueios do LinkedIn. Pode sugerir técnicas adicionais de evasão de detecção?
```

## Problemas Comuns e Soluções

### Erro com atributo `sameSite` dos cookies

**Erro:** 
```
Protocol error (Network.setCookies): Invalid parameters Failed to deserialize params.cookies.sameSite
```

**Solução:**
Este erro ocorre porque o LinkedIn usa valores como "no_restriction" para o atributo `sameSite` dos cookies, mas o Puppeteer (e o Chrome DevTools Protocol) espera valores específicos como "None", "Lax" ou "Strict".

A solução é remover esse atributo antes de enviar os cookies para o navegador:
```javascript
delete cookie.sameSite;
```

Esta correção já está implementada na versão atual do código.

### Formato dos cookies do LinkedIn

Os cookies do LinkedIn podem ser extraídos como string ou como um array de objetos. Quando usando o formato de objeto, certifique-se de que eles seguem esta estrutura:

```javascript
{
  "name": "li_at",
  "value": "seu-valor-de-cookie-aqui",
  "domain": ".linkedin.com",
  "path": "/",
  "httpOnly": true,
  "secure": true
}
```

Os cookies críticos para autenticação são `li_at` e `JSESSIONID`.

## Limitações

Claude tem um conhecimento limitado de atualizações muito recentes no LinkedIn Sales Navigator. Para problemas com mudanças recentes na interface, forneça capturas de tela ou HTML atualizado.

---

Criado em: 02 de maio de 2025
Última atualização: 02 de maio de 2025
