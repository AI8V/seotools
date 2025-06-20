// /assets/js/SiteVisualizer.js (النسخة النهائية والمُصلحة)

(function(exports) {
    'use strict';

    let network = null;

    function createGraphData(searchIndex) {
        if (!searchIndex) return { nodes: [], edges: [] };

        // ✅ التأكد من أن vis معرفة قبل استخدامها
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
            li.innerHTML = `<span class="text-truncate">${page.title}</span><span class="badge bg-secondary rounded-pill">${page.seo?.internalLinkEquity || 0}</span>`;
            li.addEventListener('click', () => focusOnNode(page.url));
            fragment.appendChild(li);
        });
        pageList.appendChild(fragment);
    }
    
    function setupSidebarSearch() {
        const searchInput = document.getElementById('visualizer-search');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const listItems = document.querySelectorAll('#visualizer-page-list li');
            listItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
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
        
        populateSidebar(searchIndex, edges.get()); 
        
        setupSidebarSearch();

        const options = {
            nodes: {
                shape: 'dot',
                scaling: { label: { min: 12, max: 30 } }
            },
            edges: {
                width: 0.5,
                color: { inherit: 'from', opacity: 0.4 },
                smooth: { type: 'continuous' }
            },
            physics: {
                forceAtlas2Based: {
                    gravitationalConstant: -26,
                    centralGravity: 0.005,
                    springLength: 230,
                    springConstant: 0.18
                },
                maxVelocity: 146,
                solver: 'forceAtlas2Based',
                timestep: 0.35,
                stabilization: { iterations: 150 }
            },
            interaction: {
                tooltipDelay: 200,
                hideEdgesOnDrag: true,
                navigationButtons: true
            },
        };

        network = new vis.Network(container, { nodes, edges }, options);
        
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