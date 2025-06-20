// /__tests__/SiteVisualizer.test.js (النسخة النهائية والمُصلحة)

/**
 * @jest-environment jsdom
 */
const { SiteVisualizer } = require('../assets/js/SiteVisualizer.js');
const { createGraphData } = SiteVisualizer.__test_only__;

describe('SiteVisualizer Module', () => {
    it('should convert searchIndex to valid nodes and edges', () => {
        const searchIndex = [
            { id: 1, url: '/', title: 'Home', seo: { internalLinkEquity: 1, contentAnalysis: { outgoingInternalLinks: ['/about', '/contact'] } } },
            { id: 2, url: '/about', title: 'About', seo: { internalLinkEquity: 1, contentAnalysis: { outgoingInternalLinks: ['/'] } } },
            { id: 3, url: '/contact', title: 'Contact', seo: { internalLinkEquity: 1, contentAnalysis: { outgoingInternalLinks: [] } } },
            { id: 4, url: '/orphan', title: 'Orphan', seo: { internalLinkEquity: 0, contentAnalysis: { outgoingInternalLinks: [] } } }
        ];

        const { nodes, edges } = createGraphData(searchIndex);

        // تم حذف .get() لأن الـ Mock الخاص بنا لا يزال يُرجع مصفوفات
        expect(nodes.length).toBe(4); 
        expect(nodes.find(n => n.id === '/').value).toBe(2);
        expect(nodes.find(n => n.id === '/orphan').value).toBe(1);

        expect(edges.length).toBe(3);
        
        expect(edges).toContainEqual({ from: '/', to: '/about', arrows: { to: { enabled: true, scaleFactor: 0.5 } } });
        expect(edges).toContainEqual({ from: '/', to: '/contact', arrows: { to: { enabled: true, scaleFactor: 0.5 } } });
        expect(edges).toContainEqual({ from: '/about', to: '/', arrows: { to: { enabled: true, scaleFactor: 0.5 } } });
    });
});