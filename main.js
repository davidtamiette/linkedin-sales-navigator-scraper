/**
 * LinkedIn Sales Navigator Scraper
 * 
 * Este ator permite extrair dados do LinkedIn Sales Navigator a partir de links ou keywords.
 * Nota: É necessário ter o cookie at_lt válido do LinkedIn para autenticação.
 */

const { Actor, log, PuppeteerCrawler } = require('apify');

// Objeto para armazenar seletores CSS importantes
const SELECTORS = {
    SEARCH: {
        SEARCH_INPUT: '.search-global-typeahead__input',
        SEARCH_BUTTON: '.search-global-typeahead__button',
        RESULTS_CONTAINER: '.search-results__container',
    },
    SALES_NAVIGATOR: {
        LEAD_RESULTS: '.search-results__result-item',
        LEAD_NAME: '.result-lockup__name',
        LEAD_TITLE: '.result-lockup__highlight-keyword',
        LEAD_LOCATION: '.result-lockup__misc-item',
        LEAD_COMPANY: '.result-lockup__position-company',
        PAGINATION_NEXT: '.search-results__pagination-next-button',
    },
};

// Atraso aleatório para evitar detecção
const randomDelay = async (min = 2000, max = 5000) => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
    return delay;
};

Actor.main(async () => {
    // Recupera os inputs do usuário
    const input = await Actor.getInput();
    
    const {
        linkedinCookies,
        cookieString,
        searchType = 'link', // 'link' ou 'keywords'
        searchUrl,
        searchKeywords,
        maxLeads = 100,
        maxPagesToScrape = 10,
        proxyConfiguration,
    } = input;
    
    // Verificação da disponibilidade de cookies para autenticação
    if (!linkedinCookies && !cookieString) {
        throw new Error('É necessário fornecer cookies válidos do LinkedIn para autenticação (linkedinCookies ou cookieString)!');
    }
    
    if (searchType === 'link' && !searchUrl) {
        throw new Error('Search URL is required when searchType is "link"');
    }
    
    if (searchType === 'keywords' && !searchKeywords) {
        throw new Error('Search keywords are required when searchType is "keywords"');
    }
    
    // Configuração do Proxy (opcional)
    const proxyConfig = proxyConfiguration ? await Actor.createProxyConfiguration(proxyConfiguration) : undefined;
    
    // Inicia o crawler
    const crawler = new PuppeteerCrawler({
        proxyConfiguration: proxyConfig,
        maxConcurrency: 1,
        launchPuppeteerOptions: {
            stealth: true,
            useChrome: true,
        },
        handlePageFunction: async ({ page, request }) => {
            log.info(`Processando ${request.url}`);
            
            // Se é a primeira página (autenticação)
            if (request.userData.label === 'AUTHENTICATE') {
                log.info('Autenticando no LinkedIn usando cookies...');
                await authenticateWithCookies(page, linkedinCookies, cookieString);
                
                // Verificando se a autenticação foi bem-sucedida
                await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'networkidle2' });
                const isLoggedIn = await page.evaluate(() => {
                    return document.querySelector('.feed-identity-module__actor-meta') !== null;
                });
                
                if (!isLoggedIn) {
                    throw new Error('Falha na autenticação com os cookies fornecidos. Verifique se os cookies são válidos.');
                }
                
                log.info('Autenticação bem-sucedida!');
                
                // Após autenticação, navegue para a URL de pesquisa ou faça pesquisa por keywords
                if (searchType === 'link') {
                    await page.goto(searchUrl, { waitUntil: 'networkidle2' });
                } else {
                    // Navegue para o Sales Navigator e faça pesquisa por keywords
                    await page.goto('https://www.linkedin.com/sales/home', { waitUntil: 'networkidle2' });
                    await searchByKeywords(page, searchKeywords);
                }
                
                // Extrai dados da primeira página de resultados
                const leads = await extractLeadsFromPage(page);
                await Actor.pushData(leads);
                
                // Enfileira próximas páginas para scraping
                await enqueueNextPages(page, crawler.requestQueue, maxPagesToScrape);
            } 
            // Se é uma página de resultados subsequente
            else if (request.userData.label === 'SEARCH_RESULTS') {
                log.info(`Extraindo dados da página ${request.userData.pageNumber}`);
                await randomDelay();
                
                // Extrai dados da página atual
                const leads = await extractLeadsFromPage(page);
                await Actor.pushData(leads);
                
                // Enfileira a próxima página se não atingiu o limite
                if (request.userData.pageNumber < maxPagesToScrape) {
                    await enqueueNextPages(page, crawler.requestQueue, maxPagesToScrape, request.userData.pageNumber);
                }
            }
        },
        handleFailedRequestFunction: async ({ request }) => {
            log.error(`Falha ao processar ${request.url}`);
        },
    });
    
    // Enfileira a página inicial para autenticação
    await crawler.requestQueue.addRequest({
        url: 'https://www.linkedin.com',
        userData: {
            label: 'AUTHENTICATE',
        },
    });
    
    await crawler.run();
    log.info('Crawler finalizado.');
});

/**
 * Função para autenticar no LinkedIn usando cookies
 */
async function authenticateWithCookies(page, linkedinCookies, cookieString) {
    try {
        // Processa os cookies conforme o formato fornecido
        let cookies = [];
        
        if (linkedinCookies && Array.isArray(linkedinCookies)) {
            // Se fornecido como um array de objetos de cookie
            cookies = linkedinCookies;
        } else if (cookieString) {
            // Se fornecido como uma string de cookies
            cookies = parseCookieString(cookieString);
        }
        
        // Verifica se o cookie at_lt está presente
        const hasAuthCookie = cookies.some(cookie => cookie.name === 'at_lt' || cookie.name === 'li_at');
        
        if (!hasAuthCookie) {
            log.warning('Cookie de autenticação (at_lt ou li_at) não encontrado. A autenticação pode falhar.');
        }
        
        // Define os cookies no navegador
        await page.setCookie(...cookies);
        log.info(`${cookies.length} cookies definidos com sucesso.`);
    } catch (error) {
        log.error('Erro ao definir cookies:', error);
        throw new Error('Falha ao autenticar com cookies. Verifique o formato dos cookies fornecidos.');
    }
}

/**
 * Função para converter string de cookies em objetos de cookie
 */
function parseCookieString(cookieString) {
    const cookies = [];
    const cookiePairs = cookieString.split(';');
    
    for (const pair of cookiePairs) {
        if (pair.trim()) {
            const [name, value] = pair.trim().split('=');
            if (name && value) {
                cookies.push({
                    name: name.trim(),
                    value: value.trim(),
                    domain: '.linkedin.com',
                    path: '/',
                    httpOnly: name.trim() === 'at_lt' || name.trim() === 'li_at',
                    secure: true
                });
            }
        }
    }
    
    return cookies;
}

/**
 * Função para buscar por keywords no Sales Navigator
 */
async function searchByKeywords(page, keywords) {
    try {
        log.info(`Realizando busca por: ${keywords}`);
        
        // Certifique-se de estar no Sales Navigator
        if (!page.url().includes('linkedin.com/sales')) {
            await page.goto('https://www.linkedin.com/sales/home', { waitUntil: 'networkidle2' });
        }
        
        // Aguarda o carregador de página terminar
        await page.waitForFunction(() => !document.querySelector('.artdeco-loader-bars'));
        
        // Usando a barra de pesquisa do Sales Navigator
        await page.waitForSelector(SELECTORS.SEARCH.SEARCH_INPUT, { timeout: 10000 });
        await randomDelay(500, 1500);
        
        await page.click(SELECTORS.SEARCH.SEARCH_INPUT);
        await randomDelay(300, 800);
        
        // Limpa o campo de pesquisa para garantir
        await page.evaluate((selector) => {
            document.querySelector(selector).value = '';
        }, SELECTORS.SEARCH.SEARCH_INPUT);
        
        // Digite a pesquisa de forma mais humana
        for (const char of keywords) {
            await page.type(SELECTORS.SEARCH.SEARCH_INPUT, char);
            await randomDelay(50, 150);
        }
        
        await randomDelay(500, 1000);
        
        // Pressiona Enter em vez de clicar no botão de pesquisa
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
            page.keyboard.press('Enter'),
        ]);
        
        // Aguarda os resultados carregarem
        await page.waitForSelector(SELECTORS.SALES_NAVIGATOR.LEAD_RESULTS, { timeout: 30000 });
        
        log.info('Busca realizada com sucesso!');
    } catch (error) {
        log.error('Erro durante a busca:', error);
        
        // Tente capturar uma screenshot para diagnóstico
        try {
            await page.screenshot({ path: 'error-search.png', fullPage: true });
            log.info('Screenshot de erro salvo como error-search.png');
        } catch (e) {
            log.error('Não foi possível salvar screenshot de erro', e);
        }
        
        throw new Error(`Falha ao realizar busca por "${keywords}"`);
    }
}

/**
 * Função para extrair dados de leads da página atual
 */
async function extractLeadsFromPage(page) {
    try {
        log.info('Extraindo leads da página atual...');
        
        // Aguarda o carregamento dos resultados e o desaparecimento do loader
        await page.waitForSelector(SELECTORS.SALES_NAVIGATOR.LEAD_RESULTS);
        await page.waitForFunction(() => !document.querySelector('.artdeco-loader-bars'));
        await randomDelay(1000, 2000);
        
        // Adiciona capturas de informações extras disponíveis no Sales Navigator
        const leads = await page.evaluate((selectors) => {
            const leadElements = document.querySelectorAll(selectors.SALES_NAVIGATOR.LEAD_RESULTS);
            
            return Array.from(leadElements).map(el => {
                const nameElement = el.querySelector(selectors.SALES_NAVIGATOR.LEAD_NAME);
                const titleElement = el.querySelector(selectors.SALES_NAVIGATOR.LEAD_TITLE);
                const locationElement = el.querySelector(selectors.SALES_NAVIGATOR.LEAD_LOCATION);
                const companyElement = el.querySelector(selectors.SALES_NAVIGATOR.LEAD_COMPANY);
                
                // URL do perfil do Sales Navigator
                const profileUrl = nameElement ? nameElement.href : null;
                
                // Extrai o ID do LinkedIn a partir da URL
                let linkedinId = null;
                if (profileUrl && profileUrl.includes('/lead/')) {
                    const matches = profileUrl.match(/\/lead\/([^,]+),/);
                    if (matches && matches[1]) {
                        linkedinId = matches[1];
                    }
                }
                
                // Extrai informações adicionais
                // Captura tags, notas e status de contato se disponíveis
                const tags = Array.from(el.querySelectorAll('.result-lockup__badge-text'))
                    .map(tag => tag.textContent.trim());
                
                // Tenta encontrar outras informações relevantes
                const noteElement = el.querySelector('.result-lockup__annotation');
                const note = noteElement ? noteElement.textContent.trim() : null;
                
                // Verifica status de conexão
                const connectionElement = el.querySelector('.artdeco-entity-lockup__degree');
                const connectionDegree = connectionElement ? connectionElement.textContent.trim() : null;
                
                // Captura informações de contato visíveis
                const emailElement = el.querySelector('[data-anonymize="email"]');
                const phoneElement = el.querySelector('[data-anonymize="phone"]');
                
                return {
                    name: nameElement ? nameElement.textContent.trim() : null,
                    title: titleElement ? titleElement.textContent.trim() : null,
                    location: locationElement ? locationElement.textContent.trim() : null,
                    company: companyElement ? companyElement.textContent.trim() : null,
                    profileUrl,
                    linkedinId,
                    tags: tags.length > 0 ? tags : null,
                    note: note,
                    connectionDegree,
                    email: emailElement ? emailElement.textContent.trim() : null,
                    phone: phoneElement ? phoneElement.textContent.trim() : null,
                    salesNavUrl: profileUrl,
                    timestamp: new Date().toISOString(),
                };
            });
        }, SELECTORS);
        
        log.info(`Extraídos ${leads.length} leads.`);
        return leads;
    } catch (error) {
        log.error('Erro ao extrair leads:', error);
        
        // Tente capturar uma screenshot para diagnóstico
        try {
            await page.screenshot({ path: 'error-extraction.png', fullPage: true });
            log.info('Screenshot de erro salvo como error-extraction.png');
        } catch (e) {
            log.error('Não foi possível salvar screenshot de erro', e);
        }
        
        return [];
    }
}

/**
 * Função para enfileirar próximas páginas para scraping
 */
async function enqueueNextPages(page, requestQueue, maxPages, currentPage = 1) {
    try {
        await randomDelay(1000, 2000);
        
        // Verifica se existe botão de próxima página
        const hasNextPage = await page.evaluate((selector) => {
            const nextButton = document.querySelector(selector);
            return nextButton && !nextButton.disabled;
        }, SELECTORS.SALES_NAVIGATOR.PAGINATION_NEXT);
        
        if (hasNextPage && currentPage < maxPages) {
            log.info(`Enfileirando página ${currentPage + 1} para scraping...`);
            
            // Obtém URL da próxima página
            const nextPageUrl = await page.evaluate((selector) => {
                const nextButton = document.querySelector(selector);
                return nextButton ? nextButton.href : null;
            }, SELECTORS.SALES_NAVIGATOR.PAGINATION_NEXT);
            
            if (nextPageUrl) {
                await requestQueue.addRequest({
                    url: nextPageUrl,
                    userData: {
                        label: 'SEARCH_RESULTS',
                        pageNumber: currentPage + 1,
                    },
                });
                
                log.info(`Página ${currentPage + 1} enfileirada com sucesso.`);
            }
        } else {
            log.info('Não há mais páginas para enfileirar ou atingiu o limite máximo.');
        }
    } catch (error) {
        log.error('Erro ao enfileirar próximas páginas:', error);
        
        // Tente capturar uma screenshot para diagnóstico
        try {
            await page.screenshot({ path: 'error-pagination.png', fullPage: true });
            log.info('Screenshot de erro salvo como error-pagination.png');
        } catch (e) {
            log.error('Não foi possível salvar screenshot de erro', e);
        }
    }
}