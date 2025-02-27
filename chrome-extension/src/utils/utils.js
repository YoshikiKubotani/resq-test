// utils.js
// 共通ユーティリティ関数

// DOM 操作ヘルパー
export const getElement = id => document.getElementById(id);

export const updateElementText = (element, text) => {
    if (element) element.innerText = text;
};

export const updateElementHTML = (element, html) => {
    if (element) element.innerHTML = html;
};

export const toggleDisplay = (element, displayStyle) => {
    if (element) element.style.display = displayStyle;
};

export const scrollIntoViewSmooth = element => {
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
};

export const setDisabled = (element, disabled) => {
    if (element) element.disabled = disabled;
};

// 日付・時刻のフォーマット（例：日本時間の文字列）
export const getJapanTimeFormatted = () => {
    const now = new Date();
    return now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
};

// HTML フィルタリング関数
// 入力された HTML 文字列から全属性を削除し、特定のタグ（br, div, p, pre, hr）の場合は適宜改行を挿入する
export const filterHTML = inputHTML => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(inputHTML, 'text/html');
    const allElements = doc.body.getElementsByTagName('*');
    // すべての属性を削除
    for (let element of allElements) {
        while (element.attributes.length > 0) {
        element.removeAttribute(element.attributes[0].name);
        }
    }
    let result = [];
    const walker = document.createTreeWalker(
        doc.body,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
        {
        acceptNode: node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();
            if (['br', 'div', 'p', 'pre', 'hr'].includes(tag)) {
                return NodeFilter.FILTER_ACCEPT;
            }
            } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
            return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_SKIP;
        }
        }
    );
    while (walker.nextNode()) {
        if (walker.currentNode.nodeType === Node.ELEMENT_NODE) {
        const tag = walker.currentNode.tagName.toLowerCase();
        if (tag === 'br' || tag === 'hr') {
            result.push(`<${tag}>`);
        } else {
            // div, p, pre の場合、前に改行を入れる
            if (result[result.length - 1] !== '<br>') {
            result.push('<br>');
            }
        }
        } else if (walker.currentNode.nodeType === Node.TEXT_NODE) {
        result.push(walker.currentNode.textContent);
        }
    }
    if (result[0] === '<br>') result.shift();
    result.push('<br>');
    return result.join('');
};

// 指定したセレクタ内の全子要素のうち、文字色が白の場合に削除する
export const removeWhiteText = selector => {
    const elems = document.querySelectorAll(selector + ' *');
    elems.forEach(el => {
        if (window.getComputedStyle(el).color === 'rgb(255, 255, 255)') {
        el.remove();
        }
    });
};

// Chrome タブの存在確認関数
// 指定のタブIDが存在するかを Promise で返す
export const checkTabExists = tabId => {
    return new Promise(resolve => {
        chrome.tabs.get(tabId, tab => {
        resolve(!!tab);
        });
    });
};
