// /__tests__/ComparisonEngine.test.js

/**
 * @jest-environment jsdom
 */
// ✅ تعديل طريقة الاستيراد لتناسب الهيكل الجديد
const { ComparisonEngine } = require('../assets/js/ComparisonEngine.js');

describe('ComparisonEngine Module', () => {
    // ... (لا تغيير في بيانات الاختبار)
    const projectA = [
        { id: 1, url: '/home', title: 'Home', seo: { score: 5 } },
        { id: 2, url: '/about', title: 'About Us', seo: { score: 4 } },
        { id: 3, url: '/contact', title: 'Contact', seo: { score: 8 } },
        { id: 4, url: '/old-page', title: 'Old Page', seo: { score: 6 } },
    ];
    const projectB = [
        { id: 5, url: '/home', title: 'Home Page', seo: { score: 5 } },
        { id: 6, url: '/about', title: 'About Our Company', seo: { score: 7 } },
        { id: 7, url: '/contact', title: 'Contact Us', seo: { score: 6 } },
        { id: 8, url: '/new-page', title: 'New Page', seo: { score: 9 } },
    ];

    it('should correctly calculate summary statistics', () => {
        // ✅ تعديل طريقة الاستدعاء
        const result = ComparisonEngine.compare(projectA, projectB);
        expect(result.summary.pagesBefore).toBe(4);
        expect(result.summary.pagesAfter).toBe(4);
        expect(result.summary.pagesAdded).toBe(1);
        expect(result.summary.pagesRemoved).toBe(1);
    });

    it('should correctly identify added and removed pages', () => {
        const result = ComparisonEngine.compare(projectA, projectB);
        expect(result.addedPages.map(p => p.url)).toEqual(['/new-page']);
        expect(result.removedPages.map(p => p.url)).toEqual(['/old-page']);
    });

    it('should correctly identify pages with improved and declined SEO scores', () => {
        const result = ComparisonEngine.compare(projectA, projectB);
        expect(result.improvedPages.length).toBe(1);
        expect(result.improvedPages[0].url).toBe('/about');
        expect(result.improvedPages[0].change).toBe(3);

        expect(result.declinedPages.length).toBe(1);
        expect(result.declinedPages[0].url).toBe('/contact');
        expect(result.declinedPages[0].change).toBe(-2);
    });
});