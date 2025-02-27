let contentTabId = null;
let replyEditorWindowId = null;
let replyEditorTabId = null;
let window_left, window_top;
let conversationHistory = [];
let prompt = [];
let personalInformation = {fullName: "", email: "", affiliation: "", language: "", role: "", mode: "", signature: "", otherInfo: "", user_id: ""};
let isListenerAdded = false;

const generateQuestionStream = async (conversationHistory, user_id) => {
    try {
        // 'http://35.77.96.110:8000/api/chrome_generate_questions_stream'
        // http://localhost:8000/api/chrome_generate_questions_stream
        const response = await fetch('https://rgbsqxnbb2eigg7qr2de3phvdq0ieanq.lambda-url.ap-northeast-1.on.aws/api/chrome_generate_questions_stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ conversationhistory: conversationHistory, user_id: user_id, replyEditorTabId: replyEditorTabId, contentTabId: contentTabId}),
            duplex: 'half'
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        let question = "";
        // let lastReportedStep = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                // console.log(question);
                executeWhenTabIsActive(replyEditorTabId, "質問を作成しました！", function() {
                    chrome.tabs.sendMessage(replyEditorTabId, { action: 'ReflectQuestion', question: question, replyEditorTabId: replyEditorTabId});
                    conversationHistory.push({
                        role: "assistant",
                        content: question
                    });
                });
                break;
            }
            const messageContent = new TextDecoder().decode(value);
            question += messageContent;

            // replyEditorTabIdに進捗を伝える
            // step1: 文字列questionの最後尾が "1 out of n(数字)" という形になっていたら、nの値を読み取り、replyEditorTabIdに送信する
            // step2: 次は"2 out of n"を探し、見つかったら見つかったことをreplyEditorTabIdに送信する
            // step3: step2をn out of n まで繰り返す
            // lastReportedStep = await checkAndUpdateProgress(question, replyEditorTabId, lastReportedStep);
        }

    } catch (error) {
        chrome.tabs.remove(replyEditorTabId);
        // contentTabIdのページにアラートを表示する
        chrome.tabs.sendMessage(contentTabId, { action: 'serverError' });
        console.error('Error generating question:', error);
        return { error: true, message: `エラーが発生しました: ${error.message}` };
    }
};
// http://localhost:8000/api/chrome_generate_reply_stream
const generateReplyStream = async (prompt, user_id) =>{
    try {
        const response = await fetch('https://rgbsqxnbb2eigg7qr2de3phvdq0ieanq.lambda-url.ap-northeast-1.on.aws/api/chrome_generate_reply_stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt, user_id: user_id, replyEditorTabId: replyEditorTabId, contentTabId: contentTabId}),
            duplex: 'half'
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`)
        }

        const reader = response.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                executeWhenTabIsActive(replyEditorTabId, "返信を作成しました！", function() {
                    chrome.tabs.sendMessage(replyEditorTabId, { action: 'finish_generate_reply', replyEditorTabId: replyEditorTabId});
                });
                break;
            }
            const messageContent = new TextDecoder().decode(value);
            // console.log(new TextDecoder().decode(value));
            chrome.tabs.sendMessage(replyEditorTabId, { action: 'reflectReply', messageContent: messageContent, replyEditorTabId: replyEditorTabId});
        }

    } catch (error) {
        console.error('Error generating reply:', error);
        return null; // エラー時の処理
    }
};

async function recordOpenEditor(user_id, replyEditorTabId, contentTabId) {
    // console.log(user_id)
    try {
        await fetch('http://localhost:8000/api/chrome_open_editor', {
            method: 'POST',
            body: JSON.stringify({ user_id: user_id, replyEditorTabId: replyEditorTabId, contentTabId: contentTabId }),
        });
    } catch (error) {
        console.error('Error recording open editor:', error);
        return null; // エラー時の処理
    }
};

async function recordCloseEditor(user_id, replyEditorTabId, contentTabId) {
    // console.log(user_id)
    try {
        await fetch('http://localhost:8000/api/chrome_close_editor', {
            method: 'POST',
            body: JSON.stringify({ user_id: user_id, replyEditorTabId: replyEditorTabId, contentTabId: contentTabId }),
        });
    } catch (error) {
        console.error('Error recording open editor:', error);
        return null; // エラー時の処理
    }
};


chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js'],
    });
});

addMessageListener();

function addMessageListener() {

    if(!isListenerAdded){

        chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {

            // console.log(request.action)

            if (request.action === 'openEditor') {
                // console.log('openEditor');
                // もしcontentに対応するreplyeditorが開いていなかったら開く
                chrome.storage.local.get(['fullName', 'email', 'affiliation', 'language', 'role', 'mode', 'signature', 'otherInfo', 'user_id'], function(result) {
                    if (result.fullName) personalInformation.fullName = result.fullName;
                    if (result.email) personalInformation.email = result.email;
                    if (result.affiliation) personalInformation.affiliation= result.affiliation;
                    if (result.language) personalInformation.language = result.language;
                    if (result.role) personalInformation.role = result.role;
                    if (result.mode) personalInformation.mode = result.mode;
                    if (result.signature) personalInformation.signature = result.signature;
                    if (result.otherInfo) personalInformation.otherInfo = result.otherInfo;
                    if (result.user_id) personalInformation.user_id = result.user_id;

                    // ユーザ情報が設定されているかチェック
                    if (!personalInformation.fullName || !personalInformation.affiliation || !personalInformation.email || !personalInformation.user_id) {
                        // console.log('ユーザ情報が設定されていません。')
                        chrome.windows.create({
                            type: 'popup',
                            url: 'settings.html',
                            width: 800,
                            height: 600, 
                        }, (window) => {
                            setTimeout(() => {
                                chrome.tabs.query({ windowId: window.id }, (tabs) => {
                                    chrome.tabs.sendMessage(tabs[0].id, { action: 'setPersonalInformation', data: personalInformation});
                                });
                            }, 300);
                        });
                    }

                    else if (replyEditorTabId === null && personalInformation.mode === 'Proposed') {
                        conversationHistory = [
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
                                content: "###Audience Information### name:" + personalInformation.fullName + ", affiliation:" + personalInformation.affiliation + ", mail:" + personalInformation.email + ", native language:" + personalInformation.language + ", role:" + personalInformation.role
                            },
                        ];
                        
                        // console.log("recordOpenEditor");
                        openReplyEditorWindow(request);
                    }
                    else if (replyEditorTabId === null && personalInformation.mode === 'Control') {
                        conversationHistory = [
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
                                content: "###Audience Information### name:" + personalInformation.fullName + ", affiliation:" + personalInformation.affiliation + ", mail:" + personalInformation.email + ", native language:" + personalInformation.language + ", role:" + personalInformation.role
                            },
                        ];
                        openReplyEditorWindow_Contorl(request);
                    }
                });
            } else if (request.action === 'updatePersonalInformation') {
                personalInformation.fullName = request.data.fullName;
                personalInformation.email = request.data.email;
                personalInformation.affiliation= request.data.affiliation;
                personalInformation.language = request.data.language;
                personalInformation.role = request.data.role;
                personalInformation.mode = request.data.mode;
                personalInformation.signature = request.data.signature;
                personalInformation.otherInfo = request.data.otherInfo;
                personalInformation.user_id = request.data.user_id;
            } else if (request.action === 'generate_questions') {
                if (sender.tab.id === replyEditorTabId) {
                    generateQuestionStream(request.conversationHistory, request.user_id);
                }
            } else if (request.action === 'finalizeReply') {
                // contentTabIdが存在したら、そのタブにreplyを反映する
                if (sender.tab.id === replyEditorTabId) {
                    checkTabExists(request.contentTabId).then((exists) => {
                        if (chrome.runtime.lastError) {
                            console.error(chrome.runtime.lastError.message);
                        }
                        if (exists) {
                            // console.log("Content tab exists");
                            // console.log(request.originalMessageContent_html)
                            chrome.tabs.sendMessage(request.contentTabId, { 
                                action: 'reflectReply', 
                                replyContent: request.replyContent, 
                                contentTabId: request.contentTabId, 
                                originalContent_html: request.originalMessageContent_html, 
                                correspondingReplyTabId: request.replyEditorTabId 
                            }, (response) => {
                                // console.log("Response from content tab:", response.status);
                                recordCloseEditor(personalInformation.user_id, request.replyEditorTabId, request.contentTabId);
                                if (response.status === 'false') {
                                    chrome.tabs.sendMessage(request.replyEditorTabId, { 
                                        action: 'noContentTab', 
                                        replyEditorTabId: request.replyEditorTabId 
                                    });
                                }
                                else if (response.status === 'true') {
                                    chrome.tabs.remove(request.replyEditorTabId);
                                }
                            });
                        }
                        else {
                            // console.log("Content tab does not exist");
                            chrome.tabs.sendMessage(request.replyEditorTabId, { 
                                action: 'noContentTab', 
                                replyEditorTabId: request.replyEditorTabId 
                            });
                        }
                    });
                }
                return true;
            } else if (request.action === 'storeContentTabId') {
                contentTabId = sender.tab.id;
                sendResponse({ contentTabId: contentTabId});
            } else if (request.action === 'generateReply') {
                if (sender.tab.id === replyEditorTabId) {
                    var prompt = request.prompt;
                    generateReplyStream(prompt, request.user_id);
                    // console.log(prompt);
                }
            } else if (request.action === 'generateReplyControl'){
                if (sender.tab.id === replyEditorTabId) {
                    // const selectedChoices = request.choices;
                    // const additionalRequest = request.additionalRequest;
                    const customizeReply = request.customizeReply;
                    // console.log("customizeReply:", customizeReply);
                    const generateReplyPrompt = [
                        {
                            role: "system",
                            content: "###Instruction### Your role is to compose email replies on behalf of the user."
                        },
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
                            content: "###Audience Information### name:" + personalInformation.fullName + ", affiliation:" + personalInformation.affiliation + ", mail:" + personalInformation.email
                        },
                    ];

                    generateReplyPrompt.push({
                        role: "user",
                        content: "You MUST consider the following conditions when writing your reply message: " + "Sender: " + customizeReply.sender + "Formality: " + customizeReply.formality + "Tone: " + customizeReply.tone + "Additional requests: " + customizeReply.additionalRequest
                    });

                    generateReplyStream(generateReplyPrompt, request.user_id);
                    // console.log("generateReplyControl");
                }
            } else if (request.action === 'openSettings') {
                openSettingsWindow();
            }
            return true;
        });

        isListenerAdded = true;

        return true;
    }
}

// 新しいウィンドウを開く関数
function openReplyEditorWindow(request) {
    chrome.tabs.create({ url: 'reply-editor.html' }, (tab) => {
        replyEditorTabId = tab.id; // タブIDを保存
        setTimeout(() => {
            chrome.tabs.sendMessage(replyEditorTabId, { 
                action: 'ReflectMessage', 
                originalContent_text: request.originalContent_text, 
                originalContent_html: request.originalContent_html, 
                subject: request.subject, 
                sender: request.sender,
                receiveTime: request.receiveTime,
                replyEditorTabId: replyEditorTabId, 
                contentTabId: contentTabId, 
                originalContentPast_html: request.originalContentPast_html,
                personalInformation: personalInformation
            });
            recordOpenEditor(personalInformation.user_id, replyEditorTabId, contentTabId);
        }, 300);
    });
}

function openReplyEditorWindow_Contorl(request) {
    chrome.tabs.create({ url: 'reply-editor-control.html' }, (tab) => {
        replyEditorTabId = tab.id; // タブIDを保存
        setTimeout(() => {
            chrome.tabs.sendMessage(replyEditorTabId, { action: 'ReflectMessage', originalContent_text: request.originalContent_text, originalContent_html: request.originalContent_html, subject: request.subject, sender: request.sender, replyEditorTabId: replyEditorTabId, contentTabId: contentTabId, originalContentPast_html: request.originalContentPast_html});
        }, 300);
    });
}

// ウィンドウが閉じられたときにウィンドウIDをクリアする
chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === replyEditorTabId) {
        replyEditorTabId = null;
    }
});

var unicodeUnescape = function(str) {
	var result = '', strs = str.match(/\\u.{4}/ig);

	if (!strs) return '';

	for (var i = 0, len = strs.length; i < len; i++) {
		result += String.fromCharCode(strs[i].replace('\\u', '0x'));
	}

	return result;
};

function executeWhenTabIsActive(tabId, message, action) {
    chrome.tabs.get(tabId, function(tab) {
        // console.log("Tab:", tab); 
        if (tab.active) {
            // タブが既にアクティブな場合は、アクションを直接実行
            action();
        } else {
            // console.log("Tab is not active");
    
            // タブが非アクティブの場合、タブIDに通知アイコン（バッジ）を表示
            chrome.action.setBadgeText({text: '!' });
            chrome.action.setBadgeBackgroundColor({ color: [0, 0, 255, 100]});

            chrome.tabs.sendMessage(tabId, { action: 'showNotification', replyEditorTabId: tabId, message: message});
    
            // タブが非アクティブの場合、タブの状態変更を監視
            const onActivatedListener = function(activeInfo) {
                // console.log("Tab activated")
                if (activeInfo.tabId === tabId) {
                    // 指定されたタブがアクティブになったら、アクションを実行してリスナーを削除
                    action();
    
                    // 通知アイコン（バッジ）をクリア
                    chrome.action.setBadgeText({text: ''});
                    chrome.action.setBadgeBackgroundColor({ color: [0, 0, 0, 0]});
    
                    chrome.tabs.onActivated.removeListener(onActivatedListener);
                }
            };
            chrome.tabs.onActivated.addListener(onActivatedListener);
        }
    });
    
}

function checkTabExists(tabId) {
    return new Promise((resolve) => {
        chrome.tabs.query({}, (tabs) => {
        const exists = tabs.some(tab => tab.id === tabId);
        resolve(exists);
        });
    });
}

function openSettingsWindow() {
    chrome.windows.create({
        type: 'popup',
        url: 'settings.html',
        width: 800,
        height: 600, 
    });
}

async function checkAndUpdateProgress(question, tabId, lastReportedStep) {
    const stepRegex = /(\d+) out of (\d+)/g;
    let match;

    while ((match = stepRegex.exec(question)) !== null) {
        const currentStep = parseInt(match[1]);
        const totalSteps = parseInt(match[2]);

        // console.log("Step:", currentStep, "out of", totalSteps);

        // Ensure the message is only sent once per step by tracking last reported step
        if (lastReportedStep < currentStep) {
            lastReportedStep = currentStep;
            // Send message to replyEditorTabId about the current step
            chrome.tabs.sendMessage(tabId, {
                replyEditorTabId: tabId,
                action: 'ProgressUpdate',
                currentStep: currentStep,
                totalSteps: totalSteps
            });

            // console.log("Step:", currentStep, "out of", totalSteps);
        }
    }

    return lastReportedStep;
}