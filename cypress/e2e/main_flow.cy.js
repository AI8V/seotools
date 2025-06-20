// cypress/e2e/main_flow.cy.js

describe('Main Application Flow', () => {

    beforeEach(() => {
        const MOCK_URL_MAIN = 'https://example.com'; 
        const MOCK_URL_ABOUT = 'https://example.com/about.html';
        const MOCK_HTML_MAIN = `<!DOCTYPE html><html><head><title>صفحة الاختبار</title></head><body><h1>عنوان رئيسي</h1><a href="/about.html">About</a></body></html>`;
        const MOCK_HTML_ABOUT = `<!DOCTYPE html><html><head><title>صفحة من نحن</title></head><body><h1>About Us</h1></body></html>`;
        
        cy.intercept('GET', `**/raw?url=${encodeURIComponent(MOCK_URL_MAIN)}`, MOCK_HTML_MAIN).as('crawlMain');
        cy.intercept('GET', `**/raw?url=${encodeURIComponent(MOCK_URL_ABOUT)}`, MOCK_HTML_ABOUT).as('crawlAbout');
        
        cy.visit('/');
    });

    it('should perform a crawl and display results correctly', () => {
        cy.get('#seoCrawlerUrl').should('be.visible').type('https://example.com');
        cy.get('#seoCrawlerNoSaveHtml').uncheck();
        cy.get('#startCrawlerBtn').click();
        
        cy.get('#crawlerStatus').should('be.visible');
        cy.wait(['@crawlMain', '@crawlAbout'], { timeout: 15000 });
        
        cy.get('.result-item', { timeout: 10000 }).should('have.length', 2);
        
        cy.contains('.result-item .page-title', 'صفحة الاختبار').should('be.visible');
        cy.contains('.result-item .page-title', 'صفحة من نحن').should('be.visible');
        cy.get('#resultsAccordion .accordion-header button').should('contain.text', 'زاحف SEO (2)');

        cy.get('#crawlerStatus').should('not.be.visible');
    });
    
    it('should toggle dark mode correctly', () => {
        // هذا الاختبار يعمل بشكل صحيح ولا يحتاج لتعديل
        cy.get('html').then($html => {
            const initialTheme = $html.attr('data-bs-theme');
            const oppositeTheme = initialTheme === 'dark' ? 'light' : 'dark';
            cy.get('#darkModeToggle').click();
            cy.get('html').should('have.attr', 'data-bs-theme', oppositeTheme);
            cy.get('#darkModeToggle').click();
            cy.get('html').should('have.attr', 'data-bs-theme', initialTheme);
        });
    });
});