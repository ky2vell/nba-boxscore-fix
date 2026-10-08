'use strict';

// Desired column order
const PRO_ORDER  = ['MIN', 'FG', '3PT', 'FT', 'OREB', 'DREB', 'REB', 'AST', 'STL', 'BLK', 'TO', 'PF', '+/-', 'PTS']; // NBA/WNBA
const NCAA_ORDER = ['MIN', 'FG', '3PT', 'FT', 'OREB', 'DREB', 'REB', 'AST', 'STL', 'BLK', 'TO', 'PF', 'PTS'];        // NCAA

const CLONE  = 'data-bsfix-clone';   // marks our reordered copy
const HIDDEN = 'data-bsfix-hidden';  // marks ESPN's original (hidden) tbody
const lastSeen = new WeakMap();      // original tbody -> its textContent when we last copied it

// Hide originals with a stylesheet instead of touching React's style prop
const style = document.createElement('style');
style.textContent = `tbody[${HIDDEN}] { display: none !important; }`;
(document.head || document.documentElement).appendChild(style);

const normalizeHeader = text => text.replace(/\s+/g, '').toUpperCase();

function getOrder(tbody) {
    const count = tbody.rows[0]?.cells.length;
    if (count === 14) return PRO_ORDER;
    if (count === 13) return NCAA_ORDER;
    return null;
}

// Reorders cells in place. Only ever called on OUR clone, never on React's nodes.
function reorder(tbody, order) {
    const rows = [...tbody.rows];
    const headerMap = {};
    [...rows[0].cells].forEach((cell, i) => {
        const label = normalizeHeader(cell.textContent);
        if (label) headerMap[label] = i;
    });

    // If ESPN renames a column, bail out and leave their table visible
    if (!order.every(stat => stat in headerMap)) return false;

    for (const row of rows) {
        // Skip DNP rows
        if (row.cells.length === 1 && row.cells[0].hasAttribute('colspan')) continue;
        const cells = [...row.cells];
        row.replaceChildren(...order.map(stat => cells[headerMap[stat]]));
    }
    return true;
}

function syncTbody(src) {
    const order = getOrder(src);
    if (!order) return;

    const next = src.nextElementSibling;
    const existing = next && next.hasAttribute(CLONE) ? next : null;
    const signature = src.textContent;

    // Clone still in place and stats unchanged: nothing to do
    if (existing && lastSeen.get(src) === signature) return;

    const clone = src.cloneNode(true);
    clone.setAttribute(CLONE, '');
    clone.removeAttribute(HIDDEN);

    if (!reorder(clone, order)) {
        existing?.remove();
        src.removeAttribute(HIDDEN);
        return;
    }

    if (existing) existing.replaceWith(clone);
    else src.after(clone);

    src.setAttribute(HIDDEN, '');
    lastSeen.set(src, signature);
}

function applyFix() {
    const root = document.querySelector('.Boxscore, .boxscore');
    if (!root) return;

    // Remove clones whose original React removed or moved
    root.querySelectorAll(`tbody[${CLONE}]`).forEach(clone => {
        const prev = clone.previousElementSibling;
        if (!prev || prev.tagName !== 'TBODY' || prev.hasAttribute(CLONE)) clone.remove();
    });

    root.querySelectorAll(`tbody:not([${CLONE}])`).forEach(syncTbody);
}

// One long-lived observer covers hydration, live stat updates,
// resize re-renders, and in-page tab navigation.
let scheduled = false;

const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(run);
});

function observe() {
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

function run() {
    scheduled = false;
    observer.disconnect(); // don't react to our own changes
    try {
        applyFix();
    } finally {
        observe();
    }
}

run();
