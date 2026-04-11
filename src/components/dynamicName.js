export function renderDynamicName(text, fontSize = '1.2rem') {
    const el = document.createElement('span');
    el.className = 'brand-dynamic-rainbow';
    el.style.fontSize = fontSize;
    el.textContent = text;
    return el;
}

