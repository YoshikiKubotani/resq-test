// background.js - Refactored Version
console.log('background.js loaded successfully');

// --------------------------------------------------
// グローバル状態管理（stateオブジェクト）
// --------------------------------------------------
const state = {
    contentTabId: null,
    replyEditorWindowId: null,
    replyEditorTabId: null,
    personalInformation: {
        fullName: "",
        email: "",
        affiliation: "",
        language: "",
        role: "",
        signature: "",
        otherInfo: "",
    },
    conversationHistory: [],
    isListenerAdded: false
};

// --------------------------------------------------
// 共通APIリクエスト関数
// --------------------------------------------------
async function requestAPI(url, payload) {
    try {
        const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        duplex: 'half'
        });
        if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        return response;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

const checkTabExists = tabId => {
    return new Promise(resolve => {
        chrome.tabs.get(tabId, tab => {
        resolve(!!tab);
        });
    });
};

// --------------------------------------------------
// 質問生成ストリーム処理
// --------------------------------------------------
async function generateQuestionStream(conversationHistory) {
    const url = 'https://rgbsqxnbb2eigg7qr2de3phvdq0ieanq.lambda-url.ap-northeast-1.on.aws/api/chrome_generate_questions_stream';
    try {
        const response = await requestAPI(url, {
        conversationhistory: conversationHistory,
        replyEditorTabId: state.replyEditorTabId,
        contentTabId: state.contentTabId
        });
        const reader = response.body.getReader();
        let question = "";
        while (true) {
        const { done, value } = await reader.read();
        if (done) {
            // タブがアクティブな場合に最終結果を送信
            executeWhenTabIsActive(state.replyEditorTabId, "Questions have been generated!", () => {
            chrome.tabs.sendMessage(state.replyEditorTabId, {
                action: 'ReflectQuestion',
                question: question,
                replyEditorTabId: state.replyEditorTabId
            });
            state.conversationHistory.push({ role: "assistant", content: question });
            });
            break;
        }
        question += new TextDecoder().decode(value);
        // 進捗更新などが必要な場合はここで処理を追加
        }
    } catch (error) {
        chrome.tabs.remove(state.replyEditorTabId);
        chrome.tabs.sendMessage(state.contentTabId, { action: 'serverError' });
        console.error('Error generating question:', error);
    }
}

// --------------------------------------------------
// 返信生成ストリーム処理
// --------------------------------------------------
async function generateReplyStream(prompt) {
    const url = 'https://rgbsqxnbb2eigg7qr2de3phvdq0ieanq.lambda-url.ap-northeast-1.on.aws/api/chrome_generate_reply_stream';
    try {
        const response = await requestAPI(url, {
            prompt: prompt,
            replyEditorTabId: state.replyEditorTabId,
            contentTabId: state.contentTabId
        });
        const reader = response.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
        if (done) {
            executeWhenTabIsActive(state.replyEditorTabId, "Reply generated!", () => {
            chrome.tabs.sendMessage(state.replyEditorTabId, {
                action: 'finish_generate_reply',
                replyEditorTabId: state.replyEditorTabId
            });
            });
            break;
        }
        const messageContent = new TextDecoder().decode(value);
        chrome.tabs.sendMessage(state.replyEditorTabId, {
            action: 'reflectReply',
            messageContent: messageContent,
            replyEditorTabId: state.replyEditorTabId
        });
        }
    } catch (error) {
        console.error('Error generating reply:', error);
    }
}

// --------------------------------------------------
// タブがアクティブな場合にコールバックを実行（プレースホルダー実装）
// --------------------------------------------------
function executeWhenTabIsActive(tabId, message, callback) {
    // 実際にはタブの状態確認等を行うが、ここでは即時実行
    callback();
}

// --------------------------------------------------
// Chromeアクション（アイコンクリック時）のハンドラー
// --------------------------------------------------
chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/content/content.js']
    });
});

// --------------------------------------------------
// Chromeランタイムメッセージリスナーの登録
// --------------------------------------------------
function addMessageListener() {
    if (!state.isListenerAdded) {
        chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
        if (request.action === 'openEditor') {
            // chrome.storageからユーザ情報を読み込み、stateに更新
            chrome.storage.local.get(
            ['fullName', 'email', 'affiliation', 'language', 'role', 'signature', 'otherInfo'],
                result => {
                    if (result.fullName) state.personalInformation.fullName = result.fullName;
                    if (result.email) state.personalInformation.email = result.email;
                    if (result.affiliation) state.personalInformation.affiliation = result.affiliation;
                    if (result.language) state.personalInformation.language = result.language;
                    if (result.role) state.personalInformation.role = result.role;
                    if (result.signature) state.personalInformation.signature = result.signature;
                    if (result.otherInfo) state.personalInformation.otherInfo = result.otherInfo;

                    // ユーザ情報が不足している場合は設定画面を開く
                    if (!state.personalInformation.fullName || !state.personalInformation.affiliation || !state.personalInformation.email) {
                    chrome.windows.create({
                        type: 'popup',
                        url: 'src/pages/settings/settings.html',
                        width: 800,
                        height: 600
                    }, window => {
                        setTimeout(() => {
                        chrome.tabs.query({ windowId: window.id }, tabs => {
                            chrome.tabs.sendMessage(tabs[0].id, { action: 'setPersonalInformation', data: state.personalInformation });
                        });
                        }, 300);
                    });
                    } else {
                        if (state.replyEditorTabId !== null) {
                            chrome.tabs.get(state.replyEditorTabId, tab => {
                                if (chrome.runtime.lastError || !tab) {
                                    // console.log("Reply editor tab not found. Resetting replyEditorTabId and opening a new window.");
                                    state.replyEditorTabId = null;
                                    openReplyEditorWindow(request);
                                } else if (tab.windowId && chrome.windows && chrome.windows.update) {
                                    // console.log("Reply editor tab exists. Focusing the existing window.");
                                    chrome.windows.update(tab.windowId, { focused: true });
                                    chrome.tabs.update(state.replyEditorTabId, { active: true });
                                    chrome.tabs.sendMessage(state.replyEditorTabId, { 
                                        action: 'showNotification',
                                        message: 'Reply Editor is already open. Please use the existing window.',
                                        replyEditorTabId: state.replyEditorTabId
                                    });
                                } else {
                                    // console.log("Unexpected condition: state.replyEditorTabId exists but window information is not available. Opening new window.");
                                    state.replyEditorTabId = null;
                                    openReplyEditorWindow(request);
                                }
                            });
                        } else {
                            // console.log("No existing reply editor tab. Opening a new window.");
                            state.conversationHistory = [
                                {
                                    role: "system",
                                    content: "###Incoming Mail### " + request.originalContent_html
                                },
                                {
                                    role: "system",
                                    content: "###Past Mail Correspondence###" + request.originalContentPast_html
                                },
                                {
                                    role: "system",
                                    content: "###Audience Information### name:" + state.personalInformation.fullName + 
                                    ", affiliation:" + state.personalInformation.affiliation + 
                                    ", mail:" + state.personalInformation.email + 
                                    ", native language:" + state.personalInformation.language + 
                                    ", role:" + state.personalInformation.role
                                }
                            ];
                            openReplyEditorWindow(request);
                        }
                    }
                }
            );
        } else if (request.action === 'updatePersonalInformation') {
            state.personalInformation = { ...request.data };
        } else if (request.action === 'generate_questions') {
            if (sender.tab && sender.tab.id === state.replyEditorTabId) {
                generateQuestionStream(request.conversationHistory);
            }
        } else if (request.action === 'finalizeReply') {
            if (sender.tab && sender.tab.id === state.replyEditorTabId) {
            checkTabExists(request.contentTabId).then(exists => {
                if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                }
                if (exists) {
                chrome.tabs.sendMessage(request.contentTabId, {
                    action: 'reflectReply',
                    replyContent: request.replyContent,
                    contentTabId: request.contentTabId,
                    originalContent_html: request.originalMessageContent_html,
                    correspondingReplyTabId: request.replyEditorTabId
                }, response => {
                    if (response && response.status === 'false') {
                        chrome.tabs.sendMessage(request.replyEditorTabId, { action: 'noContentTab', replyEditorTabId: request.replyEditorTabId });
                    } else if (response && response.status === 'true') {
                        chrome.tabs.remove(request.replyEditorTabId);
                    }
                });
                } else {
                    chrome.tabs.sendMessage(request.replyEditorTabId, { action: 'noContentTab', replyEditorTabId: request.replyEditorTabId });
                }
            });
            }
            return true;
        } else if (request.action === 'storeContentTabId') {
            state.contentTabId = sender.tab.id;
            sendResponse({ contentTabId: state.contentTabId });
        } else if (request.action === 'generateReply') {
            if (sender.tab && sender.tab.id === state.replyEditorTabId) {
            const prompt = request.prompt;
            generateReplyStream(prompt);
            }
        }
        return true;
        });
        state.isListenerAdded = true;
    }
}

addMessageListener();

// --------------------------------------------------
// エディタウィンドウ起動ヘルパー
// --------------------------------------------------
function openReplyEditorWindow(request) {
    chrome.windows.create({
        url: 'src/pages/reply-editor/reply-editor.html',
        type: 'popup',
        state: 'fullscreen'
    }, window => {
        chrome.tabs.query({ windowId: window.id }, tabs => {
        if (tabs && tabs.length > 0) {
            state.replyEditorTabId = tabs[0].id;
            setTimeout(() => {
                chrome.tabs.sendMessage(state.replyEditorTabId, { 
                    action: 'ReflectMessage', 
                    originalContent_text: request.originalContent_text, 
                    originalContent_html: request.originalContent_html, 
                    subject: request.subject, 
                    sender: request.sender,
                    receiveTime: request.receiveTime,
                    replyEditorTabId: state.replyEditorTabId, 
                    contentTabId: state.contentTabId, 
                    originalContentPast_html: request.originalContentPast_html,
                    personalInformation: state.personalInformation
                });
            }, 300);
        }
        });
    });
}

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (tabId === state.replyEditorTabId) {
        state.replyEditorTabId = null;
    }
});