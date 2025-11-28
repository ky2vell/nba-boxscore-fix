'use strict';

function normalizeHeader(text) {
    return text.replace(/\s+/g, '').toUpperCase();
}

// Desired column order
const proOrder = ['MIN', 'FG', '3PT', 'FT', 'OREB', 'DREB', 'REB', 'AST', 'STL', 'BLK', 'TO', 'PF', '+/-', 'PTS'];
const collegeOrder = ['MIN', 'FG', '3PT', 'FT', 'OREB', 'DREB', 'REB', 'AST', 'STL', 'BLK', 'TO', 'PF', 'PTS'];

// Determine whether <tbody> is NBA boxscore
function isBoxScore(tbody) {
    const firstRow = tbody.rows[0];
    if (!firstRow) return false;

    const count = firstRow.cells.length;

    if (count === 14) return proOrder; // NBA and WNBA (has +/-)
    if (count === 13) return collegeOrder; // NCAA (no +/-)

    return false;
}

// Reorder single <tr> at a time
function reorderBoxScore(tbody, desiredOrder) {
    const rows = [...tbody.rows];

    // Build existing column map from first row
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
            const index = headerMap[stat];
            if (index != null) newCells.push(cells[index]);
        });

        row.innerHTML = '';
        newCells.forEach(cell => row.appendChild(cell));
    });
}

function applyFix() {
    document.querySelectorAll('tbody').forEach(tbody => {
        const desiredOrder = isBoxScore(tbody);
        if (desiredOrder) reorderBoxScore(tbody, desiredOrder);
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
