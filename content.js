'use strict';

function normalizeHeader(text) {
    return text.replace(/\s+/g, '').toUpperCase();
}

// Desired column order
const desiredOrder = ['MIN', 'FG', '3PT', 'FT', 'OREB', 'DREB', 'REB', 'AST', 'STL', 'BLK', 'TO', 'PF', '+/-', 'PTS'];

// Determine whether <tbody> is NBA boxscore
function isBoxScore(tbody) {
    const firstRow = tbody.rows[0];
    if (!firstRow) return false;

    // Boxscores always have 14 stat columns
    return firstRow.cells.length === 14;
}

// Reorder single <tr> at a time
function reorderBoxScore(tbody) {
    const rows = [...tbody.rows];

    // Build existing header/column map from first row
    const headerCells = [...rows[0].children];
    const headerMap = {};

    headerCells.forEach((cell, index) => {
        const label = normalizeHeader(cell.innerText);
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

        desiredOrder.forEach(stat => {
            const idx = headerMap[stat];
            if (idx != null) newCells.push(cells[idx]);
        });

        row.innerHTML = '';
        newCells.forEach(cell => row.appendChild(cell));
    });
}

function applyFix() {
    document.querySelectorAll('tbody').forEach(tbody => {
        if (isBoxScore(tbody)) {
            reorderBoxScore(tbody);
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
