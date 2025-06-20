// /assets/js/SiteVisualizer.js (النسخة النهائية والمُصلحة بالفعل)

(function(exports) {
    'use strict';

    let network = null;

    function createGraphData(searchIndex) {
        if (!searchIndex) return { nodes: [], edges: [] };

        if (typeof vis === 'undefined') {
            console.error("vis.js is not loaded.");
            return { nodes: [], edges: [] };
        }

        const nodes = new vis.DataSet(searchIndex.map(page => ({
            id: page.url,
            label: page.title,
            value: 1 + (page.seo?.internalLinkEquity || 0),
            title: `<b>${page.title}</b><br>التقييم: ${page.seo?.score || 'N/A'}<br>الروابط الواردة: ${page.seo?.internalLinkEquity || 0}`,
            color: page.seo?.isOrphan ? '#f0ad4e' : (page.seo?.isNoIndex ? '#d9534f' : '#5bc0de'),
            font: { size: 14 }
        })));
        
        const edges = [];
        const pageUrls = new Set(searchIndex.map(p => p.url));

        searchIndex.forEach(sourcePage => {
            (sourcePage.seo?.contentAnalysis?.outgoingInternalLinks || []).forEach(targetUrl => {
                const cleanTargetUrl = targetUrl.startsWith('/') ? targetUrl : '/' + targetUrl;
                if (pageUrls.has(cleanTargetUrl) && sourcePage.url !== cleanTargetUrl) {
                    edges.push({
                        from: sourcePage.url,
                        to: cleanTargetUrl,
                        arrows: { to: { enabled: true, scaleFactor: 0.5 } }
                    });
                }
            });
        });

        return { nodes, edges: new vis.DataSet(edges) };
    }

    function populateSidebar(searchIndex, edges) {
        const projectName = document.getElementById('projectNameInput')?.value || "المشروع الحالي";
        document.getElementById('visualizer-project-name').textContent = projectName;
        document.getElementById('visualizer-total-pages').textContent = searchIndex.length;
        document.getElementById('visualizer-total-links').textContent = edges.length;

        const pageList = document.getElementById('visualizer-page-list');
        pageList.innerHTML = '';
        const fragment = document.createDocumentFragment();

        searchIndex.sort((a, b) => (b.seo?.internalLinkEquity || 0) - (a.seo?.internalLinkEquity || 0)).forEach(page => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.dataset.nodeId = page.url;
            li.dataset.pageTitle = page.title.toLowerCase(); 
            li.innerHTML = `<span class="text-truncate">${page.title}</span><span class="badge bg-secondary rounded-pill">${page.seo?.internalLinkEquity || 0}</span>`;
            li.addEventListener('click', () => focusOnNode(page.url));
            fragment.appendChild(li);
        });
        pageList.appendChild(fragment);
        
        // استدعاء دالة البحث مرة واحدة فقط بعد ملء القائمة
        setupSidebarSearch();
    }
    
    function setupSidebarSearch() {
        const searchInput = document.getElementById('visualizer-search');
        if (!searchInput || searchInput.dataset.listenerAttached === 'true') return;        
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const listItems = document.querySelectorAll('#visualizer-page-list li');
            
            listItems.forEach(item => {
                const pageTitle = item.dataset.pageTitle;
                // ✅ ===================  الإصلاح الحاسم هنا ===================
                // استخدام فئات Bootstrap للإظهار والإخفاء للحفاظ على التنسيق
                const isMatch = pageTitle.includes(searchTerm);
                item.classList.toggle('d-none', !isMatch);
            });
        });
        searchInput.dataset.listenerAttached = 'true';
    }

    function focusOnNode(nodeId) {
        if (network && nodeId) {
            network.focus(nodeId, {
                scale: 1.2,
                animation: { duration: 1000, easingFunction: 'easeInOutQuad' }
            });
            network.selectNodes([nodeId]);
            
            document.querySelectorAll('#visualizer-page-list li').forEach(li => {
                li.classList.toggle('active', li.dataset.nodeId === nodeId);
            });
        }
    }

    function render(container, searchIndex) {
        if (!container || typeof vis === 'undefined') {
            console.error("Container or Vis.js library not found.");
            return;
        }

        if (network) {
            network.destroy();
        }

        const { nodes, edges } = createGraphData(searchIndex);
        
        // ✅ الاستدعاء الوحيد والصحيح. لا حاجة لاستدعاء setupSidebarSearch هنا.
        populateSidebar(searchIndex, edges.get ? edges.get() : edges); 
        
        const options = {
            // ... (باقي الخيارات تبقى كما هي)
            nodes: { /* ... */ },
            edges: { /* ... */ },
            physics: { /* ... */ },
            interaction: {
                tooltipDelay: 200,
                hideEdgesOnDrag: true,
                navigationButtons: true,
            },
        };

        network = new vis.Network(container, { nodes, edges }, options);
        
        // معالجة مشكلة التلميح في Cypress (إن وجدت)
        network.on('showPopup', function (nodeId) {
            const popup = document.querySelector('.vis-tooltip');
            if (popup) {
                const node = nodes.get(nodeId);
                if (node && node.title) {
                    popup.innerHTML = node.title;
                }
            }
        });
        
        // ربط حدث تحديد العقدة لتحديث الشريط الجانبي
        network.on("selectNode", function (params) {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                 document.querySelectorAll('#visualizer-page-list li').forEach(li => {
                    const isActive = li.dataset.nodeId === nodeId;
                    li.classList.toggle('active', isActive);
                    if (isActive) {
                        li.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
            }
        });
    }

    // ✅ الإصلاح النهائي لطريقة التصدير
    const publicInterface = { 
        render,
        __test_only__: { createGraphData }
    };

    if (typeof exports !== 'undefined') {
        // بيئة الاختبار (Node.js)
        exports.SiteVisualizer = publicInterface;
    } else {
        // بيئة المتصفح: قم بتعريف SiteVisualizer على window
        // مع حذف الجزء الخاص بالاختبار فقط
        exports.SiteVisualizer = { render: publicInterface.render };
    }
    
})(typeof exports === 'undefined' ? (window) : exports);
