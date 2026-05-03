(function () {
    const transportBackofficePath = '/modules/transport/view/back/';

    if (window.location.pathname.toLowerCase().includes(transportBackofficePath)) {
        return;
    }

    const pendingWords = [
        'en attente',
        'ouvert',
        'visible',
        'recherche de financement',
        'en_recherche_financement',
        'non traite',
        'non traité'
    ];
    const doneWords = [
        'approuve',
        'approuvée',
        'approuvee',
        'confirme',
        'confirmé',
        'resolu',
        'résolu',
        'termine',
        'terminé',
        'valide',
        'validé'
    ];

    document.querySelectorAll('.admin-content .admin-card').forEach(enhanceCard);

    function enhanceCard(card) {
        if (card.dataset.adminEnhanced === 'true') return;

        const table = card.querySelector('table');
        const tbody = table ? table.querySelector('tbody') : null;
        if (!table || !tbody) return;

        card.dataset.adminEnhanced = 'true';

        const headers = Array.from(table.querySelectorAll('thead th'))
            .map((th, index) => ({ index, label: th.textContent.trim() }))
            .filter(header => header.label && !/actions?/i.test(header.label));

        const ui = buildEnhancementUi(card, headers);

        let sortState = {
            column: ui.sortSelect ? Number(ui.sortSelect.value || 0) : 0,
            direction: 'asc'
        };

        function rows() {
            return Array.from(tbody.querySelectorAll('tr')).filter(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length < 2) return false;
                const text = normalize(row.textContent);
                return text !== '' && !text.includes('chargement') && !text.includes('aucun');
            });
        }

        function applySearch() {
            if (!ui.searchInput) {
                refreshStats();
                return;
            }

            const query = ui.searchInput ? normalize(ui.searchInput.value) : '';

            rows().forEach(row => {
                const hidden = query !== '' && !normalize(row.textContent).includes(query);
                row.dataset.adminEnhancerHidden = hidden ? 'true' : 'false';
                row.style.display = hidden ? 'none' : '';
            });

            refreshStats();
        }

        function applySort() {
            const currentRows = rows();
            const column = sortState.column;
            const direction = sortState.direction === 'desc' ? -1 : 1;

            currentRows
                .sort((a, b) => compareCellText(cellText(a, column), cellText(b, column)) * direction)
                .forEach(row => tbody.appendChild(row));

            applySearch();
        }

        function refreshStats() {
            const allRows = rows();
            const visibleRows = allRows.filter(row => row.style.display !== 'none');
            const pendingCount = allRows.filter(row => containsAny(row.textContent, pendingWords)).length;
            const doneCount = allRows.filter(row => containsAny(row.textContent, doneWords)).length;

            ui.totalValue.textContent = String(allRows.length);
            ui.visibleValue.textContent = String(visibleRows.length);
            ui.pendingValue.textContent = String(pendingCount);
            ui.doneValue.textContent = String(doneCount);
        }

        if (ui.searchInput) {
            ui.searchInput.addEventListener('input', applySearch);
        }

        if (ui.sortSelect) {
            ui.sortSelect.addEventListener('change', function () {
                sortState.column = Number(this.value || 0);
                applySort();
            });
        }

        if (ui.directionButton) {
            ui.directionButton.addEventListener('click', function () {
                sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
                this.innerHTML = sortState.direction === 'asc'
                    ? '<i class="bi bi-sort-alpha-down"></i>'
                    : '<i class="bi bi-sort-alpha-up"></i>';
                applySort();
            });
        }

        card.querySelectorAll('input, select').forEach(control => {
            if (!control.closest('.admin-lite-panel')) {
                control.addEventListener('input', refreshStats);
                control.addEventListener('change', refreshStats);
            }
        });

        const observer = new MutationObserver(debounce(function () {
            applySearch();
            refreshStats();
        }, 80));
        observer.observe(tbody, { childList: true, subtree: true, characterData: true });

        refreshStats();
    }

    function buildEnhancementUi(card, headers) {
        const headerBlock = card.querySelector('.d-flex.justify-content-between, h2');
        const toolbar = card.querySelector('.toolbar-card');
        const panel = document.createElement('div');
        panel.className = 'admin-lite-panel';

        panel.innerHTML = `
            <div class="admin-lite-stats">
                <div class="admin-lite-stat">
                    <span>Total</span>
                    <strong data-stat="total">0</strong>
                </div>
                <div class="admin-lite-stat">
                    <span>Affichés</span>
                    <strong data-stat="visible">0</strong>
                </div>
                <div class="admin-lite-stat">
                    <span>À traiter</span>
                    <strong data-stat="pending">0</strong>
                </div>
                <div class="admin-lite-stat muted">
                    <span>Finalisés</span>
                    <strong data-stat="done">0</strong>
                </div>
            </div>
        `;

        if (headerBlock && headerBlock.parentNode) {
            headerBlock.insertAdjacentElement('afterend', panel);
        } else {
            card.insertAdjacentElement('afterbegin', panel);
        }

        const sortSelect = buildSortSelect(headers);
        const directionButton = buildDirectionButton();
        let searchInput = null;

        if (toolbar) {
            const inline = document.createElement('div');
            inline.className = 'admin-lite-inline-sort';
            inline.append(sortSelect, directionButton);
            toolbar.appendChild(inline);
        } else {
            const controls = document.createElement('div');
            controls.className = 'admin-lite-controls';
            searchInput = document.createElement('input');
            searchInput.type = 'search';
            searchInput.className = 'form-control';
            searchInput.placeholder = 'Rechercher...';

            controls.innerHTML = '<div class="admin-lite-search"><i class="bi bi-search"></i></div>';
            controls.querySelector('.admin-lite-search').appendChild(searchInput);
            controls.append(sortSelect, directionButton);
            panel.appendChild(controls);
        }

        return {
            totalValue: panel.querySelector('[data-stat="total"]'),
            visibleValue: panel.querySelector('[data-stat="visible"]'),
            pendingValue: panel.querySelector('[data-stat="pending"]'),
            doneValue: panel.querySelector('[data-stat="done"]'),
            searchInput,
            sortSelect,
            directionButton
        };
    }

    function buildSortSelect(headers) {
        const select = document.createElement('select');
        select.className = 'form-select admin-lite-sort';
        const chosenHeaders = headers.slice(0, 6);

        chosenHeaders.forEach((header, position) => {
            const option = document.createElement('option');
            option.value = String(header.index);
            option.textContent = position === 0 ? `Trier par ${header.label}` : header.label;
            select.appendChild(option);
        });

        if (select.options.length === 0) {
            const option = document.createElement('option');
            option.value = '0';
            option.textContent = 'Trier';
            select.appendChild(option);
        }

        return select;
    }

    function buildDirectionButton() {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-outline-secondary admin-lite-direction';
        button.title = 'Inverser le tri';
        button.innerHTML = '<i class="bi bi-sort-alpha-down"></i>';
        return button;
    }

    function cellText(row, index) {
        const cell = row.children[index];
        return cell ? cell.textContent.trim() : '';
    }

    function compareCellText(a, b) {
        const numA = parseFloat(String(a).replace(',', '.'));
        const numB = parseFloat(String(b).replace(',', '.'));

        if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
            return numA - numB;
        }

        const dateA = Date.parse(a);
        const dateB = Date.parse(b);
        if (!Number.isNaN(dateA) && !Number.isNaN(dateB)) {
            return dateA - dateB;
        }

        return String(a).localeCompare(String(b), 'fr', { sensitivity: 'base', numeric: true });
    }

    function containsAny(text, words) {
        const value = normalize(text);
        return words.some(word => value.includes(normalize(word)));
    }

    function normalize(text) {
        return String(text || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function debounce(fn, delay) {
        let timer = null;
        return function () {
            window.clearTimeout(timer);
            timer = window.setTimeout(fn, delay);
        };
    }
})();
