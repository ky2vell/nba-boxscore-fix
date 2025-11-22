function normalizeHeader(text) {
    return text.replace(/\s+/g, '').toUpperCase();
}

// Desired column order
const desiredOrder = new Set(['MIN', 'FG', '3PT', 'FT', 'OREB', 'DREB', 'REB', 'AST', 'STL', 'BLK', 'TO', 'PF', '+/-', 'PTS']);

// Determine whether <tbody> is NBA boxscore
function isBoxScore(tbody) {
    const firstCell = tbody.rows[0].cells[0];
    if (!firstCell) return false;

    const label = normalizeHeader(firstCell.innerText || '');
    return desiredOrder.has(label);
}

// Reorder single <tr> at a time
function reorderBoxScore(tbody) {
    const rows = Array.from(tbody.rows);
    if (!rows.length) return;

    // Build existing header/column map from first row
    const headerCells = Array.from(rows[0].children);
    const headerMap = {};

    headerCells.forEach((cell, index) => {
        const label = normalizeHeader(cell.innerText.trim());
        if (label) headerMap[label] = index;
    });

    // Reorder all rows
    rows.forEach(row => {
        // Ignore DNP rows
        if (row.children.length === 1 && row.children[0].hasAttribute('colspan')) {
            return;
        }

        const cells = Array.from(row.children);
        const newCells = [];

        desiredOrder.forEach(stat => {
            const idx = headerMap[stat];
            if (idx != null && cells[idx]) newCells.push(cells[idx]);
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
