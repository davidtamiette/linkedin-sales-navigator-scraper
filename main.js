const Apify = require('apify');
const puppeteer = require('puppeteer');

// Função utilitária para delay aleatório
async function randomDelay(min = 1500, max = 3500) {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para construir a URL do Sales Navigator
function buildSalesNavigatorUrl({ keywords, industry, title, location }) {
    let baseUrl = 'https://www.linkedin.com/sales/search/people?';
    const params = [];
    if (keywords) params.push(`keywords=${encodeURIComponent(keywords)}`);
    if (industry) params.push(`industryIncluded=${encodeURIComponent(industry)}`);
    if (title) params.push(`titleIncluded=${encodeURIComponent(title)}`);
    if (location) params.push(`geoIncluded=${encodeURIComponent(location)}`);
    return baseUrl + params.join('&');
}

// Função para extrair detalhes de um perfil (opcional)
async function extractProfileDetails(page, profileUrl) {
    await page.goto(profileUrl, { waitUntil: 'networkidle2' });
    await randomDelay();
    const details = await page.evaluate(() => {
        const name = document.querySelector('.profile-topcard-person-entity__name')?.innerText || '';
        const headline = document.querySelector('.profile-topcard-person-entity__headline')?.innerText || '';
        const location = document.querySelector('.profile-topcard-person-entity__location')?.innerText || '';
        return { name, headline, location };
    });
    return details;
}

Apify.main(async () => {
    const input = await Apify.getInput();

    if (!input.sessionCookie) {
        throw new Error("sessionCookie não fornecido!");
    }

    // Usa o Puppeteer do Apify para proxy e ambiente cloud
    const browser = await Apify.launchPuppeteer({
        useApifyProxy: input.proxyConfiguration?.useApifyProxy || false,
        proxyUrls: input.proxyConfiguration?.proxyUrls || undefined,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Define o cookie de sessão
