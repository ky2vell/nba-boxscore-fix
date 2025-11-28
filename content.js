'use strict';

function normalizeHeader(text) {
    return text.replace(/\s+/g, '').toUpperCase();
}

// Desired column order
const proBoxScore = ['MIN', 'FG', '3PT', 'FT', 'OREB', 'DREB', 'REB', 'AST', 'STL', 'BLK', 'TO', 'PF', '+/-', 'PTS'];
const ncaaBoxScore = ['MIN', 'FG', '3PT', 'FT', 'OREB', 'DREB', 'REB', 'AST', 'STL', 'BLK', 'TO', 'PF', 'PTS'];

function getBoxScoreType(tbody) {
    const firstRow = tbody.rows[0];
    if (!firstRow) return false;

    const count = firstRow.cells.length;
    if (count === 14) return proBoxScore; // NBA and WNBA (has +/-)
    if (count === 13) return ncaaBoxScore; // NCAA (no +/-)

    return false;
}

// Reorder single <tr> at a time
function reorderBoxScore(tbody, newOrder) {
    const rows = [...tbody.rows];

    // Build existing column map from first row
    const headerCells = [...rows[0].children];
    const headerMap = {};

    headerCells.forEach((cell, index) => {
        const label = normalizeHeader(cell.textContent);
        if (label) headerMap[label] = index;
    });

    // Reorder all rows
    rows.forEach(row => {
        // Ignore DNP rows
        if (row.children.length === 1 && row.children[0].hasAttribute('colspan')) {
            return;
        }

        const cells = [...row.children];
        const newCells = [];

        newOrder.forEach(stat => {
            const index = headerMap[stat];
            if (index >= 0) newCells.push(cells[index]);
        });

        row.replaceChildren(...newCells);
    });
}

function applyFix() {
    const boxscore = document.querySelector('.Boxscore, .boxscore');
    if (!boxscore) return;

    boxscore.querySelectorAll('tbody').forEach(tbody => {
        const order = getBoxScoreType(tbody); // returns proBoxScore, ncaaBoxScore, or false
        if (order) {
            reorderBoxScore(tbody, order);
        }
    });
}

// Run
applyFix();

// Re-run in case of browser resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(applyFix, 250);
});

// Listen for Full Box Score clicks in other tabs
document.addEventListener('click', e => {
    const target = e.target.closest('a');
    if (!target) return;

    const href = target.getAttribute('href') || '';
    if (!href.includes('/boxscore/')) return;

    const root = document.querySelector('main') || document.body;

    const observer = new MutationObserver((_, obs) => {
        const container = document.querySelector('.Boxscore, .boxscore');
        if (container) {
            applyFix();
            obs.disconnect();
        }
    });

    observer.observe(root, { childList: true, subtree: true });

    // Stop observing after 5s if weirdness happens
    setTimeout(() => observer.disconnect(), 5000);
});
