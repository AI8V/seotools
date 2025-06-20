// This file runs before each test file, ensuring mocks are globally available.

// Mock Chart.js
const mockChartInstance = {
    update: jest.fn(),
    destroy: jest.fn(),
    data: { labels: [], datasets: [] },
    canvas: { id: 'mock-chart' }
};
global.Chart = jest.fn(() => mockChartInstance);

// Mock HTMLCanvasElement.prototype.getContext
if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
        // Return a mock context object. It can be empty for our purposes.
    }));
}

// Mock Bootstrap
global.bootstrap = {
    Toast: jest.fn().mockImplementation(() => ({ show: jest.fn() })),
    Modal: jest.fn().mockImplementation(() => ({ show: jest.fn(), hide: jest.fn() })),

    Collapse: jest.fn().mockImplementation(() => ({
        show: jest.fn(),
        hide: jest.fn(),
        toggle: jest.fn(),
        dispose: jest.fn(),
    })),
};

bootstrap.Modal.getInstance = jest.fn().mockImplementation(() => ({ hide: jest.fn() }));

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
global.IntersectionObserver = mockIntersectionObserver;

// ✅ =========================================================================
// ✅ START: NEW MOCK FOR VIS.JS
// ✅ =========================================================================
global.vis = {
    // We only need to mock DataSet for the current test.
    // In vis.js, DataSet takes an array and returns an array-like object.
    // For our purposes, we can simply return the array itself.
    DataSet: jest.fn(data => data),

    // For future tests, we might need to mock the Network as well.
    // For now, we'll leave it as an empty function.
    Network: jest.fn(() => ({
        on: jest.fn(),
        destroy: jest.fn(),
        focus: jest.fn(),
        selectNodes: jest.fn(),
    })),
};
// ✅ =========================================================================
// ✅ END: NEW MOCK FOR VIS.JS
// ✅ =========================================================================