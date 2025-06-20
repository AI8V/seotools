/**
 * @jest-environment jsdom
 */

const { UIManager, StateManager, DOMManager, Analyzer, Utils } = require('../assets/js/script.js');

const createMockSeoData = (overrides = {}) => ({
    h1: 'Mock H1',
    lang: 'en',
    canonical: 'https://example.com/mock',
    imageAltInfo: { total: 2, missing: 1 },
    brokenLinksOnPage: [],
    loadTime: 100,
    isNoIndex: false,
    isOrphan: false,
    isDefaultDescription: false,
    internalLinkEquity: 5,
    ogTitle: 'Mock OG Title',
    ogImage: 'mock.png',
    hasStructuredData: true,
    wordCount: 350,
    pageTypeHint: 'article',
    contentAnalysis: { internalLinks: 5, externalLinks: 2, outgoingInternalLinks: [] },
    ...overrides
});

const setupTestDOM = () => {
    document.documentElement.innerHTML = `
        <html data-bs-theme="light">
            <body>
                <div class="toast-container"></div>
                <div id="results">
                    <p id="resultsPlaceholder"></p>
                    <div class="accordion" id="resultsAccordion"></div>
                </div>
                <div id="selectionControls" class="d-none">
                    <button id="selectAllBtn"></button>
                    <button id="deselectAllBtn"></button>
                    <span id="selectionCounter">0</span>
                </div>
                <div id="filterSection" class="d-none"><select id="categoryFilter"></select><input id="keywordFilter" /><input type="checkbox" id="orphanFilter" /></div>
                <div id="liveCounter" class="d-none"><span id="counterValue">0</span></div>
                <div id="exportButtons" class="d-none"></div>
                <div id="schemaGeneratorSection" class="d-none"></div>
                <div id="showAnalyticsBtn" class="d-none"></div>
                
                <!-- Modals -->
                <div id="serpPreviewModal">
                    <span id="previewUrl"></span><span id="previewTitle"></span><span id="previewDescription"></span>
                    <span id="titleCharCount"></span><span id="descCharCount"></span>
                </div>
                <div id="analyticsModal">
                    <div class="modal-body">
                         <div class="row">
                            <div class="col-md-4">
                                <canvas id="sourceDistributionChart"></canvas>
                            </div>
                            <div class="col-md-4">
                                <canvas id="topKeywordsChart"></canvas>
                            </div>
                            <div class="col-md-4">
                                <div>
                                    <canvas id="averageSeoScoreChart"></canvas>
                                    <div id="seoScoreText"></div>
                                </div>
                                <div id="orphanPagesCard">
                                    <p id="orphanPagesCount">0</p>
                                    <button id="viewOrphanPagesBtn"></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <template id="resultItemTemplate">
                    <div class="result-item" data-id="">
                         <div class="result-item-header">
                            <div class="flex-grow-1 d-flex align-items-center">
                                <input type="checkbox" class="form-check-input ms-3 flex-shrink-0 item-select-checkbox" aria-label="Select item">
                                <span class="seo-score-dot ms-2" title=""></span>
                                <span class="page-title text-primary fw-bold editable-content" data-field="title"></span>
                                <span class="badge bg-danger ms-2 d-none no-index-badge"></span>
                                <span class="badge bg-warning text-dark ms-2 d-none orphan-page-badge"></span>
                            </div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-outline-info btn-sm btn-preview"></button>
                                <button class="btn btn-outline-secondary btn-sm btn-edit"></button>
                                <button class="btn btn-outline-danger btn-sm btn-delete"></button>
                            </div>
                         </div>
                        <div class="result-item-url-bar"><span data-populate="url"></span><span data-populate="loadTime"></span></div>
                        <div class="text-muted editable-content mt-1" data-field="description"></div>
                        <div class="mt-2 small"><span class="text-info">الفئة:</span> <span class="editable-content" data-field="category"></span></div>
                        <div class="mt-1 small"><span class="text-success">الكلمات:</span> <span class="editable-content" data-field="tags"></span></div>
                        <div class="d-none orphan-page-prompt"></div>
                        <div class="seo-summary-container"></div>
                    </div>
                </template>
                <button id="darkModeToggle"></button>
            </body>
        </html>
    `;
    DOMManager.init();
};

describe('UIManager Module', () => {

    beforeEach(() => {
        setupTestDOM();
        StateManager.resetAppState();
        jest.clearAllMocks();
        jest.spyOn(Utils, 'showNotification').mockImplementation(() => {});
        const observe = jest.fn();
        const unobserve = jest.fn();
        const disconnect = jest.fn();
        global.IntersectionObserver = jest.fn(() => ({ observe, unobserve, disconnect }));
        UIManager.initObserver();
    });

    describe('Display and Rendering', () => {
        it('should show placeholder and hide controls when there are no results', () => {
            UIManager.updateAllUI();
            expect(DOMManager.dom.resultsPlaceholder.classList.contains('d-none')).toBe(false);
            expect(DOMManager.dom.selectionControls.classList.contains('d-none')).toBe(true);
            expect(DOMManager.dom.exportButtons.classList.contains('d-none')).toBe(true);
            expect(DOMManager.dom.filterSection.classList.contains('d-none')).toBe(true);
        });

        it('should render items for a group when updateAllUI is called with an openAccordionId', () => {
            StateManager.appState.searchIndex = [
                { id: 1, title: 'Page A', url: '/a', source: 'manual', seo: { imageAltInfo: { total: 0, missing: 0 }, brokenLinksOnPage: [] } }
            ];
            const openAccordionId = 'collapse-source-manual-0';
            
            UIManager.updateAllUI(openAccordionId);

            const itemElement = document.querySelector('.result-item');
            expect(itemElement).not.toBeNull();
            expect(itemElement.dataset.id).toBe('1');
            expect(itemElement.querySelector('.page-title').textContent).toBe('Page A');
            
            const collapseElement = document.querySelector('.accordion-collapse');
            expect(collapseElement.id).toBe(openAccordionId);
            expect(collapseElement.classList.contains('show')).toBe(true);
        });

        it('should correctly set selection state on rendered items', () => {
            const baseSeo = { imageAltInfo: { total: 0, missing: 0 }, brokenLinksOnPage: [] };
            StateManager.appState.searchIndex = [
                { id: 1, title: 'A', url: '/a', source: 'manual', seo: { ...baseSeo } },
                { id: 2, title: 'B', url: '/b', source: 'manual', seo: { ...baseSeo } }
            ];
            StateManager.appState.selectedItemIds.add(2);

            UIManager.updateAllUI('collapse-source-manual-0');

            const item1 = document.querySelector('.result-item[data-id="1"]');
            const item2 = document.querySelector('.result-item[data-id="2"]');

            expect(item1.querySelector('.item-select-checkbox').checked).toBe(false);
            expect(item1.classList.contains('selected')).toBe(false);
            expect(item2.querySelector('.item-select-checkbox').checked).toBe(true);
            expect(item2.classList.contains('selected')).toBe(true);
        });
    });

    describe('Counters and UI State', () => {
        it('updateLiveCounter should display the total number of items', () => {
            expect(DOMManager.dom.liveCounter.classList.contains('d-none')).toBe(true);
            StateManager.appState.searchIndex.push({ id: 1, source: 'manual', seo: createMockSeoData() });
            
            UIManager.updateAllUI();
            expect(DOMManager.dom.liveCounter.classList.contains('d-none')).toBe(false);
            expect(DOMManager.dom.counterValue.textContent).toBe('1');
        });

        it('updateSelectionUI should display the number of selected items', () => {
            StateManager.appState.selectedItemIds.add(1);
            StateManager.appState.selectedItemIds.add(2);
            UIManager.updateSelectionUI();
            expect(DOMManager.dom.selectionCounter.textContent).toBe('2');
        });
    });
    
    describe('Filtering and Options', () => {
        it('updateFilterOptions should populate category dropdown from searchIndex', () => {
            StateManager.appState.searchIndex = [
                { id: 1, category: 'Blog', seo: createMockSeoData() },
                { id: 2, category: 'Products', seo: createMockSeoData() },
                { id: 3, category: 'Blog', seo: createMockSeoData() },
                { id: 4, category: 'About', seo: createMockSeoData() }
            ];
            UIManager.updateAllUI();
            const options = DOMManager.dom.categoryFilter.options;
            expect(options.length).toBe(4);
            expect(options[1].value).toBe('About');
            expect(options[2].value).toBe('Blog');
            expect(options[3].value).toBe('Products');
        });
    });
    
    describe('Item Actions', () => {
        it('showSerpPreview should populate the SERP modal with item data', () => {
            const item = { id: 1, title: 'My Awesome Page', url: '/awesome.html', description: 'This is a great page.' };
            StateManager.appState.searchIndex.push(item);
            
            UIManager.showSerpPreview(1);

            expect(DOMManager.getEl('previewTitle').textContent).toBe('My Awesome Page');
            expect(DOMManager.getEl('previewUrl').textContent).toBe('/awesome.html');
            expect(DOMManager.getEl('previewDescription').textContent).toBe('This is a great page.');
            expect(DOMManager.getEl('titleCharCount').textContent).toBe(String('My Awesome Page'.length));
        });
    });

    describe('Dark Mode', () => {
        it('setDarkMode should update documentElement attribute and localStorage', () => {
            const localStorageMock = (() => {
                let store = {};
                return {
                    getItem: key => store[key] || null,
                    setItem: (key, value) => { store[key] = value.toString(); },
                    clear: () => { store = {}; }
                };
            })();
            Object.defineProperty(window, 'localStorage', { value: localStorageMock });

            UIManager.setDarkMode(true);
            expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
            expect(localStorage.getItem('darkMode')).toBe('true');
            
            UIManager.setDarkMode(false);
            expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
            expect(localStorage.getItem('darkMode')).toBe('false');
        });
    });
    
    describe('Analytics Dashboard', () => {
    it.skip('should call renderChart with correct data for each chart type', () => {
            StateManager.appState.searchIndex = [
                { id: 1, source: 'seo_crawler', tags: ['seo', 'test'], seo: {h1: 't', canonical: 't', imageAltInfo: {total: 1, missing: 0}, brokenLinksOnPage: [], isNoIndex: false, lang: 'en', ogTitle: 't', ogImage: 't', hasStructuredData: true, wordCount: 500, pageTypeHint: 'article'} }, // score 9
                { id: 2, source: 'manual', tags: ['manual', 'test'], seo: {h1: 't', canonical: null, imageAltInfo: {total: 0, missing: 0}, brokenLinksOnPage: [], isNoIndex: false, lang: 'en', ogTitle: null, ogImage: null, hasStructuredData: false, wordCount: 10, pageTypeHint: 'generic'} }, // score 3
                { id: 3, source: 'seo_crawler', tags: ['seo', 'another'], seo: {h1: 't', canonical: 't', imageAltInfo: {total: 1, missing: 1}, brokenLinksOnPage: [], isNoIndex: false, lang: 'en', ogTitle: 't', ogImage: 't', hasStructuredData: true, wordCount: 500, pageTypeHint: 'article'} } // score 7
            ];
            
            UIManager.updateAllUI();
            
            expect(global.Chart).toHaveBeenCalledTimes(3);

            // 1. Source Distribution Chart
            const sourceChartCall = global.Chart.mock.calls[0][1];
            expect(sourceChartCall.type).toBe('pie');
            expect(sourceChartCall.data.labels).toEqual(expect.arrayContaining(['زاحف SEO', 'إدخال يدوي']));
            expect(sourceChartCall.data.datasets[0].data).toEqual(expect.arrayContaining([2, 1]));

            // 2. Top Keywords Chart
            const keywordChartCall = global.Chart.mock.calls[1][1];
            expect(keywordChartCall.type).toBe('bar');
            expect(keywordChartCall.data.labels).toEqual(expect.arrayContaining(['seo', 'test', 'manual', 'another']));
            expect(keywordChartCall.data.datasets[0].data).toEqual(expect.arrayContaining([2, 2, 1, 1]));
            
            // 3. SEO Score Chart (Total Score: 9+3+7=19, Max Score: 9+9+9=27, % = 70.37)
            const seoChartCall = global.Chart.mock.calls[2][1];
            expect(seoChartCall.type).toBe('doughnut');
            expect(seoChartCall.data.datasets[0].data[0]).toBeCloseTo(70.37);
            expect(DOMManager.dom.seoScoreText.textContent).toBe('70%');
        });

        it('should hide analytics button if no data', () => {
             StateManager.appState.searchIndex = [];
             UIManager.updateAllUI();
             expect(DOMManager.dom.showAnalyticsBtn.classList.contains('d-none')).toBe(true);
        });

        it('should show analytics button if there is data', () => {
             // ✅ الإصلاح: استخدام البيانات الوهمية الكاملة
            StateManager.appState.searchIndex = [{ id: 1, source: 'manual', seo: createMockSeoData() }];
            UIManager.updateAllUI();
            expect(DOMManager.dom.showAnalyticsBtn.classList.contains('d-none')).toBe(false);
        });
    });
});
