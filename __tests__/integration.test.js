
/**
 * @jest-environment jsdom
 */

jest.mock('../assets/js/script.js', () => {
    const originalModule = jest.requireActual('../assets/js/script.js');
    return {
        ...originalModule,
        CoreFeatures: {
            ...originalModule.CoreFeatures,
            startSeoCrawler: jest.fn().mockResolvedValue(undefined),
        },
    };
});

describe('Full Application Integration Scenarios', () => {
    
    const { 
        DOMManager,
        UIManager, 
        StateManager,
        CoreFeatures
    } = require('../assets/js/script.js');

    beforeEach(() => {
        // 1. Create the mock DOM
        document.body.innerHTML = `
            <input id="seoCrawlerUrl" value="https://example.com" />
            <input id="seoCrawlerDepth" value="2" />
            <input id="seoCrawlerConcurrency" value="5" />
            <input id="seoCrawlerDelay" value="50" />
            <input type="checkbox" id="seoCrawlerNoSaveHtml" />
            <button id="startCrawlerBtn"></button>
            <div class="toast-container"></div>
            <div id="results"><div id="resultsAccordion"></div></div>
            <p id="resultsPlaceholder"></p>
            <div id="selectionControls"><span id="selectionCounter"></span></div>
            <div id="exportButtons"></div>
            <div id="schemaGeneratorSection"></div>
            <div id="filterSection"></div>
            <div id="liveCounter"><span id="counterValue"></span></div>
            <div id="showAnalyticsBtn"></div>
        `;
        
        // 2. Initialize the DOMManager's cache AFTER the DOM is built.
        DOMManager.init();
        
        // 3. Reset state for a clean test
        StateManager.resetAppState();
        
        // 4. Clear mock history
        jest.clearAllMocks();
    });

    it('should call startSeoCrawler with correct config when triggered', async () => {
        const config = UIManager.getSeoCrawlerConfig();
        await CoreFeatures.startSeoCrawler(config);
        
        // Assertions
        expect(CoreFeatures.startSeoCrawler).toHaveBeenCalledTimes(1);
        
        expect(CoreFeatures.startSeoCrawler).toHaveBeenCalledWith(
            expect.objectContaining({
                baseUrl: 'https://example.com',
                maxDepth: 2,
                concurrency: 5,
                crawlDelay: 50,
                saveHtmlContent: true
            })
        );
    });
});
