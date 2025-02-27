// Gmailの返信テキストボックスのセレクター
const replyBoxSelector = 'div.Am.aO9.Al.editable.LW-avf';
const originalContentSelector = 'div.adn.ads > div.gs > div:nth-child(3) > div:nth-child(3) > div';
const aiButtonSelector = 'tr.btC'
const subjectSelector = 'h2.hP';
const senderSelector = 'span.gD';
const receiveTimeSelector = 'span.g3';
let thisContentTabId = null;
let originalContent_html = null;
let originalContentPast_html = null;
let isListenerAdded = false;
let thisReplyBox = null;
let clickedEmail = null;

// // Gmailページが変更されたときにボタンを追加
// const addButtonWhenReady = () => {
//     const observer = new MutationObserver(() => {
//         const buttonContainer = document.querySelector('tr.btC'); // 位置を調整するためのセレクター
//         if (buttonContainer && !buttonContainer.querySelector('.td-aiButton')) {
//             const aiButton = createAIButton();
//             buttonContainer.appendChild(aiButton);
//             // observer.disconnect(); // ボタンが追加されたら監視を終了（必要に応じてコメントアウトを外す）
//         }
//     });

//     observer.observe(document.body, { childList: true, subtree: true });
// };

const addButtonWhenReady = () => {
    const observer = new MutationObserver(() => {
        const buttonContainers = document.querySelectorAll(aiButtonSelector);
        buttonContainers.forEach(buttonContainer => {
            if (buttonContainer && !buttonContainer.querySelector('.td-aiButton')) {
                const aiButton = createAIButton();
                buttonContainer.appendChild(aiButton);
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
};


window.addEventListener('load', addButtonWhenReady);

const createAIButton = () => {
    // td要素を作成
    const tdElement = document.createElement('td');
    tdElement.className = 'td-aiButton';

    // div要素を作成
    const divOuter = document.createElement('div');
    divOuter.className = 'T-I J-J5-Ji aoO v T-I-atl L3';
    divOuter.setAttribute('role', 'button');
    divOuter.setAttribute('tabindex', '1');
    divOuter.setAttribute('aria-label', '返信をAIと作成する');
    divOuter.style.userSelect = 'none';

    // ボタンのテキスト要素を作成
    const buttonText = document.createElement('span');
    buttonText.className = 'buttonText-aiButton';
    buttonText.textContent = 'Reply with AI'; // ここでボタンのテキストを設定

    // すべての要素を組み合わせる
    divOuter.appendChild(buttonText);
    tdElement.appendChild(divOuter);

    // クリックイベントを追加
    divOuter.addEventListener('click', async () => {
        // このタブIDをバックグラウンドスクリプトに送信
        try {
            chrome.runtime.sendMessage({ action: 'storeContentTabId' }, (response) => {
                thisContentTabId = response.contentTabId;
                // console.log('setContentTabId' + thisContentTabId);
            });
        }
        catch (e) {
            // console.log(e);
            alert("ページをリロードしてください");
            return;
        }

        try {
            // console.log(divOuter);
            clickedEmail = divOuter.closest('div.Bk');
            // console.log(clickedEmail);
            const originalContentElements = clickedEmail.querySelectorAll(originalContentSelector);

            thisReplyBox = clickedEmail.querySelector(replyBoxSelector);
            // console.log(thisReplyBox);

            // const originalContentElements = await waitForContent(originalContentSelector);
            const subject = document.querySelector(subjectSelector);
            // const sender = clickedEmail.querySelectorAll(senderSelector)[document.querySelectorAll(senderSelector).length - 1].textContent;
            const sender = clickedEmail.querySelector(senderSelector);
            const receiveTime = clickedEmail.querySelector(receiveTimeSelector);
            
            let originalContentElementNum = 0;
    
            // originalContentElementsのうち'div.yj6qo'の要素を削除する
            for (let i = 0; i < originalContentElements.length; i++) {
                // console.log(originalContentElements[i].classList.contains('yj6qo'));
                if (!originalContentElements[i].classList.contains('yj6qo')) {
                    originalContentElementNum = i;
                }
            }
    
            //白文字で書かれている不必要な文章を削除する
            removeWhiteText();
    
            const originalContentElement = originalContentElements[originalContentElementNum];
            // console.log(originalContentElement.innerHTML);

            const cloneDiv = originalContentElement.cloneNode(true);

            let pastElements = cloneDiv.querySelectorAll('div.h5');
            if (pastElements.length === 0) {
                pastElements = cloneDiv.querySelectorAll('div.im');
            }

            // 対象の要素を削除
            pastElements.forEach(el => el.parentNode.removeChild(el));

            originalContent_html = filterHTML(cloneDiv.innerHTML).replace( /\s|&nbsp;/g , ' ' );
            // console.log(originalContent_html);

            const originalContent_text = cloneDiv.innerText


            originalContentPast_html = filterHTML(Array.from(pastElements).map(el => el.outerHTML).join('')).replace( /\s|&nbsp;/g , ' ' );

            chrome.runtime.sendMessage({ 
                action: 'openEditor', 
                originalContent_text: originalContent_text, 
                originalContent_html: originalContent_html, 
                originalContentPast_html: originalContentPast_html, 
                subject: subject.textContent, 
                sender: sender.textContent,
                receiveTime: receiveTime.textContent,
            });
        }

        catch (e) {
            // console.log(e);
            // alert("ページをリロードしてください");
        }
    });
    return tdElement;
};

const addListener = () => {

    if(!isListenerAdded){
        chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
            if (request.action === 'reflectReply') {
                const result = await findOriginalContent();
                if (result.error) {
                    sendResponse({ status: 'false' });
                }
                else if (request.contentTabId === thisContentTabId) {
                    // const replyBox = document.querySelector(replyBoxSelector);
                    thisReplyBox = clickedEmail.querySelector(replyBoxSelector);
                    if (thisReplyBox !== null) {
                        thisReplyBox.innerHTML = request.replyContent.replace(/\n/g, '<br>');
                        sendResponse({ status: 'true' });
                    }
                    else {
                        sendResponse({ status: 'false' });
                    }
                }
                else {
                    sendResponse({ status: 'differentTab' });
                }
            }
            else if (request.action === 'serverError') {
                // alert("サーバに接続できませんでした。")
                alert("エラーが発生しました。再度お試しください。")
            }
            return true;
        });
        isListenerAdded = true;
    }

}

function filterHTML(inputHTML) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(inputHTML, 'text/html');
    const allElements = doc.body.getElementsByTagName('*');

    for (let element of allElements) {
        // Remove all attributes
        for (let i = element.attributes.length - 1; i >= 0; i--) {
            element.removeAttribute(element.attributes[i].name);
        }
    }

    const newTextHTML = [];
    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
        acceptNode: function (node) {
            if (
                node.nodeType === Node.ELEMENT_NODE && (node.tagName.toLowerCase() === 'br' || node.tagName.toLowerCase() === 'div' || node.tagName.toLowerCase() === 'p' || node.tagName.toLowerCase() === 'pre' || node.tagName.toLowerCase() === 'hr') ||
                node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ''
            ) {
                return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_SKIP;
        }
    }, false);

    while (walker.nextNode()) {
        if (walker.currentNode.nodeType === Node.ELEMENT_NODE) {
            if (walker.currentNode.tagName.toLowerCase() === 'br') {
                newTextHTML.push('<br>');
            } else if (walker.currentNode.tagName.toLowerCase() === 'hr') {
                newTextHTML.push('<hr>');
            } else if ((walker.currentNode.tagName.toLowerCase() === 'div' || walker.currentNode.tagName.toLowerCase() === 'p' || walker.currentNode.tagName.toLowerCase() === 'pre') && newTextHTML[newTextHTML.length - 1] !== '<br>') {
                // Insert a <br> tag before <div> if there isn't one already
                newTextHTML.push('<br>');
            }
        } else if (walker.currentNode.nodeType === Node.TEXT_NODE) {
            newTextHTML.push(walker.currentNode.textContent);
        }
    }

    // Remove the first <br> if it exists, because we always start with a text node
    if (newTextHTML[0] === '<br>') {
        newTextHTML.shift();
    }

    newTextHTML.push('<br>');

    return newTextHTML.join('');
}


function extractTextFromHTML(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    return doc.body.textContent || "";
}

function convertTextToHTML(text) {
    // 改行文字でテキストを行に分割する
    const lines = text.split('\n');

    // 各行をパラグラフタグで囲む
    const htmlLines = lines.map(line => {
        // 空行の場合は改行タグを追加する
        if (line.trim() === '') {
        return '<br>';
        } else {
        // 通常の行はパラグラフタグで囲む
        return `<p>${line}</p>`;
        }
    });

    // HTML文字列を結合する
    return htmlLines.join('');
}

//白文字で書かれている不必要な文章を削除する関数
function removeWhiteText() {
    // 対象の<span>要素を選択します
    var whiteElements = document.querySelectorAll('span[style="font-size:1.0pt;color:white"]');

    // 選択された各<span>要素に対してループを実行します
    whiteElements.forEach(function(element) {
        // 子要素を削除します
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    });
}

const waitForContent = async (selector, retryCount = 0) => {
    return new Promise((resolve, reject) => {
        const content = document.querySelectorAll(selector);

        if (content.length > 0) {
            resolve(content);
        } 
        // else if (retryCount < 10) { // 最大リトライ回数を10回とする
        //     setTimeout(() => resolve(waitForContent(selector, retryCount + 1)), 500); // 500ミリ秒後に再試行
        // } 
        else {
            reject(new Error('Content not found'));
        }
    });
};

const findOriginalContent = async () => {
    try {
        let originalContentElements = await waitForContent(originalContentSelector);
        
        let originalContentElementNum = 0;

        // originalContentElementsのうち'div.yj6qo'の要素を削除する
        for (let i = 0; i < originalContentElements.length; i++) {
            // console.log(originalContentElements[i].classList.contains('yj6qo'));
            if (!originalContentElements[i].classList.contains('yj6qo')) {
                originalContentElementNum = i;
            }
        }
    
        //白文字で書かれている不必要な文章を削除する
        removeWhiteText();
    
        const originalContentElement = originalContentElements[originalContentElementNum];
        // console.log(originalContentElement.innerHTML);
    
        originalContent_html = filterHTML(originalContentElement.innerHTML).replace( /\s|&nbsp;/g , ' ' );
    
        return { originalHTML: originalContent_html, error: false };
    }
    catch (e) {
        // console.log(e);
        return { error: true };
    }
}

function indentHtml(inputHtml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(inputHtml, 'text/html');
    const result = [];

    function walk(node, depth = 0) {
        if (node.nodeType === Node.ELEMENT_NODE) {
        const indent = ' '.repeat(depth * 2); // 深さに基づいてインデントを調整
        result.push(`${indent}<${node.tagName.toLowerCase()}${formatAttributes(node.attributes)}>`);
        
        node.childNodes.forEach(child => walk(child, depth + 1)); // 子ノードのために深さをインクリメント
        
        // 子ノードがあれば閉じタグを追加（単一行タグを避けるため）
        if (node.childNodes.length > 0) {
            result.push(`${indent}</${node.tagName.toLowerCase()}>`);
        }
        } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        const indent = ' '.repeat(depth * 2);
        result.push(`${indent}${node.textContent.trim()}`);
        }
    }

    function formatAttributes(attributes) {
        return Array.from(attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ');
    }

    walk(doc.body); // body要素から開始
    return result.join('\n');
}

addListener();