const Apify = require('apify');

// Função utilitária para delay aleatório
async function randomDelay(min = 1500, max = 3500) {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Monta a URL do Sales Navigator
function buildSalesNavigatorUrl({ keywords, industry, title, location }) {
    let baseUrl = 'https://www.linkedin.com/sales/search/people?';
    const params = [];
    if (keywords) params.push(`keywords=${encodeURIComponent(keywords)}`);
    if (industry) params.push(`industryIncluded=${encodeURIComponent(industry)}`);
    if (title) params.push(`titleIncluded=${encodeURIComponent(title)}`);
    if (location) params.push(`geoIncluded=${encodeURIComponent(location)}`);
    return baseUrl + params.join('&');
}

// Extrai detalhes do perfil (opcional)
async function extractProfileDetails(page, profileUrl) {
    await page.goto(profileUrl, { waitUntil: 'networkidle2' });
    await randomDelay();
    return page.evaluate(() => {
        const name = document.querySelector('.profile-topcard-person-entity__name')?.innerText || '';
        const headline = document.querySelector('.profile-topcard-person-entity__headline')?.innerText || '';
        const location = document.querySelector('.profile-topcard-person-entity__location')?.innerText || '';
        return { name, headline, location };
    });
}

(async () => {
    let browser;
    try {
        const input = await Apify.getInput();
        Apify.log.info('Input recebido:', input);

        if (!input.sessionCookie) throw new Error('sessionCookie não fornecido!');

        // Configuração de proxy (compatível cloud)
        const proxyConfig = input.proxyConfiguration
            ? await Apify.createProxyConfiguration(input.proxyConfiguration)
            : undefined;

        browser = await Apify.launchPuppeteer({
            proxyUrl: proxyConfig ? await proxyConfig.newUrl() : undefined,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Define o cookie de sessão
        await page.setCookie({
            name: 'li_at',
            value: input.sessionCookie,
            domain: '.linkedin.com',
            httpOnly: true,
            secure: true
        });
        Apify.log.info('Cookie de sessão definido.');

        // Monta e acessa a URL de busca
        const searchUrl = input.searchUrl || buildSalesNavigatorUrl(input);
        Apify.log.info(`Acessando URL de busca: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });
        await randomDelay();

        let results = [];
        let currentPage = 1;
        while (results.length < (input.maxResults || 20)) {
            Apify.log.info(`Extraindo resultados da página ${currentPage}...`);
            const profiles = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('li.artdeco-list__item')).map(item => {
                    const nameElem = item.querySelector('a[data-anonymize="person-name"]');
                    const occupationElem = item.querySelector('dt[data-anonymize="headline"]');
                    const companyElem = item.querySelector('dd[data-anonymize="company-name"]');
                    const locationElem = item.querySelector('dd[data-anonymize="location"]');
                    return {
                        name: nameElem?.innerText || '',
                        profileUrl: nameElem?.href || '',
                        occupation: occupationElem?.innerText || '',
                        company: companyElem?.innerText || '',
                        location: locationElem?.innerText || ''
                    };
                }).filter(p => p.name && p.profileUrl);
            });
            Apify.log.info(`Encontrados ${profiles.length} perfis na página ${currentPage}.`);
            for (const profile of profiles) {
                if (input.extractDetails) {
                    try {
                        const details = await extractProfileDetails(page, profile.profileUrl);
                        Object.assign(profile, details);
                    } catch (e) {
                        profile.error = 'Erro ao extrair detalhes';
                    }
                }
                results.push(profile);
                if (results.length >= (input.maxResults || 20)) break;
            }
            const nextButton = await page.$('button[aria-label="Avançar"]');
            if (nextButton && results.length < (input.maxResults || 20)) {
                Apify.log.info('Avançando para a próxima página...');
                await nextButton.click();
                await randomDelay();
            } else {
                break;
            }
            currentPage++;
        }
        Apify.log.info(`Total de perfis extraídos: ${results.length}`);
        await Apify.pushData(results);
        Apify.log.info('Resultados enviados para o dataset do Apify com sucesso.');
    } catch (error) {
        Apify.log.error('Erro na execução do actor:', { error: error.message, stack: error.stack });
        throw error;
    } finally {
        if (browser) {
            await browser.close();
            Apify.log.info('Browser fechado.');
        }
    }
})();
