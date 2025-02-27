// reply-editor.js - Refactored Version

// -----------------------
// Global State Objects
// -----------------------
let mailData = {
    html: "",
    text: "",
    title: "",
    sender: "",
    pastHtml: "",
    receiveTime: "",
    now: ""
};

let personalInformation = {
    fullName: "",
    email: "",
    affiliation: "",
    language: "",
    role: "",
    signature: "",
    otherInfo: ""
};

let customizeReply = {
    sender: "",
    recipient: "",
    formality: "",
    tone: "",
    urgency: "",
    length: "",
    purpose: "",
    additionalRequest: ""
};

let selectedOptions = {};
let thisReplyEditorTabId = 0;
let contentTabId = 0;

// -----------------------
// utility functions
// -----------------------
const getElement = id => document.getElementById(id);

const updateElementText = (element, text) => {
    if (element) element.innerText = text;
};

const updateElementHTML = (element, html) => {
    if (element) element.innerHTML = html;
};

const toggleDisplay = (element, displayStyle) => {
    if (element) element.style.display = displayStyle;
};

const scrollIntoViewSmooth = element => {
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
};

const setDisabled = (element, disabled) => {
    if (element) element.disabled = disabled;
};

// 日付・時刻のフォーマット（例：日本時間の文字列）
const getJapanTimeFormatted = () => {
    const now = new Date();
    return now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
};

const getFormattedTime = (timeZone) => {
    const now = new Date();
    return timeZone ? now.toLocaleString('en-US', { timeZone: timeZone }) : now.toLocaleString('en-US');
};

// -----------------------
// DOM Elements
// -----------------------
const elements = {
    highlightedMessageDiv: getElement('originalContent'),
    replyBox: getElement('replyBox'),
    finalizeButton: getElement('finalizeButton'),
    regenerateQuestionsButton: getElement('regenerateQuestionsButton'),
    generateReplyButton: getElement('generateReplyButton'),
    subject: getElement('originalMessageTitle'),
    to: getElement('originalMessageSender'),
    receiveTime: getElement('originalMessageReceiveTime'),
    scenario: getElement('scenario'),
    addInfo: getElement('addInfo'),
    copyButton: getElement('copyButton'),
    deleteButton: getElement('deleteButton'),
    settingsButton: getElement('settingsButton'),
    settingsModal: getElement('settingsModal'),
    originalMessagePastButton: getElement('originalMessagePastButton'),
    customizeFormalityButtons: document.querySelectorAll('input[name="btnradio-formality"]'),
    customizeToneButtons: document.querySelectorAll('input[name="btnradio-tone"]'),
    customizeLengthButtons: document.querySelectorAll('input[name="btnradio-length"]'),
    senderRole: getElement('senderRole'),
    recipientRole: getElement('recipientRole'),
    mailNum: getElement('mail-num')
};

// -----------------------
// Helper Functions
// -----------------------
function updateFromRequest(request) {
    mailData = {
        ...mailData,
        html: request.originalContent_html,
        text: request.originalContent_text,
        title: request.subject,
        sender: request.sender,
        receiveTime: request.receiveTime,
        // now: getJapanTimeFormatted(),
        now: getFormattedTime(request.timeZone),
        pastHtml: request.originalContentPast_html
    };
    contentTabId = request.contentTabId;

    // UI更新
    updateElementText(elements.subject, 'Subject: ' + request.subject);
    updateElementText(elements.to, 'Sender: ' + request.sender);
    updateElementText(elements.receiveTime, 'Received Time: ' + request.receiveTime);
    document.title = request.subject;
    updateElementHTML(elements.highlightedMessageDiv, mailData.html);

    // 更新: ユーザ情報
    if (request.personalInformation) {
        Object.assign(personalInformation, request.personalInformation);
    }

    // 過去のやり取りの表示制御
    const pastEl = getElement('originalMessagePast');
    const pastBtn = getElement('originalMessagePastButton');
    if (!mailData.pastHtml || /^<br\s*\/?>$/.test(mailData.pastHtml)) {
        toggleDisplay(pastEl, 'none');
        toggleDisplay(pastBtn, 'none');
    } else {
        updateElementHTML(pastEl, `<div class="email-content">${mailData.pastHtml}</div>`);
        toggleDisplay(pastEl, 'none'); // 初期状態は非表示
    }
}

async function generateQuestions(mailData, personalInformation, customizeReply) {
    try {
        const result = await getLocalStorage([
        'fullName', 'email', 'affiliation', 'language',
        'role', 'signature', 'otherInfo'
        ]);
        if (result.fullName) personalInformation.fullName = result.fullName;
        if (result.email) personalInformation.email = result.email;
        if (result.affiliation) personalInformation.affiliation = result.affiliation;
        if (result.language) personalInformation.language = result.language;
        if (result.role) personalInformation.role = result.role;
        if (result.otherInfo) personalInformation.otherInfo = result.otherInfo;

        const conversationHistory = [
        {
            role: "system",
            content: "###Incoming Mail### " + mailData.html
        },
        {
            role: "system",
            content: "###Mail Information### sender:" + mailData.sender +
                    ", title:" + mailData.title +
                    ", receive time:" + mailData.receiveTime +
                    ", current time:" + mailData.now
        },
        {
            role: "system",
            content: "###Audience Information### name:" + personalInformation.fullName +
                    ", affiliation:" + personalInformation.affiliation +
                    ", mail:" + personalInformation.email +
                    ", native language:" + personalInformation.language +
                    ", role:" + personalInformation.role +
                    ",otherInfo:" + personalInformation.otherInfo
        }
        ];

        chrome.runtime.sendMessage({
        action: 'generate_questions',
        conversationHistory: conversationHistory,
        });
    } catch (error) {
        console.error(error);
    }
}

async function generateReply(mailData, customizeReply, personalInformation, selectedChoices, replyBoxValue, elements) {
    try {
        const result = await getLocalStorage([
        'fullName', 'email', 'affiliation', 'language',
        'role', 'signature', 'otherInfo'
        ]);
        if (result.fullName) personalInformation.fullName = result.fullName;
        if (result.email) personalInformation.email = result.email;
        if (result.affiliation) personalInformation.affiliation = result.affiliation;
        if (result.language) personalInformation.language = result.language;
        if (result.role) personalInformation.role = result.role;
        if (result.signature) personalInformation.signature = result.signature;
        if (result.otherInfo) personalInformation.otherInfo = result.otherInfo;

        if (!result.signature) {
        personalInformation.signature =
            "------------------------------------------" + "<br>" +
            personalInformation.fullName + "<br>" +
            personalInformation.affiliation + "<br>" +
            personalInformation.email + "<br>" +
            "------------------------------------------";
        }

        const generateReplyPrompt = [
        {
            role: "system",
            content: "###Instruction### Your role is to compose a email reply on behalf of the user. You MUST generate a reply in the same language as the incoming mail"
        },
        {
            role: "system",
            content: "###Incoming Mail### " + mailData.html
        },
        {
            role: "system",
            content: "###Past Mail Correspondence###" + mailData.pastHtml
        },
        {
            role: "system",
            content: "###Mail Information### sender:" + mailData.sender +
                    ", title:" + mailData.title +
                    ", receive time:" + mailData.receiveTime +
                    ", current time:" + mailData.now
        },
        {
            role: "system",
            content: "###Audience Information### name:" + personalInformation.fullName +
                    ", affiliation:" + personalInformation.affiliation +
                    ", mail:" + personalInformation.email +
                    ", native language:" + personalInformation.language +
                    ", role:" + personalInformation.role +
                    ",otherInfo:" + personalInformation.otherInfo
        },
        {  
            role: "system",
            content: "###Signature###" + personalInformation.signature
        }
        ];

        // 質問とその選択肢をプロンプトに追加
        for (let quesId in selectedChoices) {
        if (selectedChoices.hasOwnProperty(quesId)) {
            generateReplyPrompt.push({
            role: "assistant",
            content: selectedChoices[quesId].question
            });
            selectedChoices[quesId].choices.forEach(choice => {
            generateReplyPrompt.push({
                role: "user",
                content: choice
            });
            });
        }
        }

        if (replyBoxValue === '') {
        generateReplyPrompt.push({
            role: "system",
            content: "You MUST consider the following conditions when writing the reply message: " +
                    " Role of the sender: " + customizeReply.sender +
                    ", Role of the recipient: " + customizeReply.recipient +
                    ", Formality of the reply: " + customizeReply.formality +
                    ", Tone of the reply: " + customizeReply.tone +
                    ", Length of the reply:" + customizeReply.length +
                    ", Additional requests: " + customizeReply.additionalRequest
        });
        } else {
        generateReplyPrompt.push({
            role: "system",
            content: "###Current Reply###" + replyBoxValue
        });
        generateReplyPrompt.push({
            role: "system",
            content: "You MUST consider the following conditions when revising the reply message: " +
                    " Role of the sender: " + customizeReply.sender +
                    ", Role of the recipient: " + customizeReply.recipient +
                    ", Formality of the reply: " + customizeReply.formality +
                    ", Tone of the reply: " + customizeReply.tone +
                    ", Length of the reply:" + customizeReply.length +
                    ", Additional requests: " + customizeReply.additionalRequest
        });
        }

        chrome.runtime.sendMessage({
        action: 'generateReply',
        prompt: generateReplyPrompt
        });
    } catch (error) {
        console.error(error);
    }
}

function makeQuestionContainer(questions) {
    const questionsContainer = document.querySelector('.questions');
    questionsContainer.innerHTML = '';

    questions.forEach((question, index) => {
        const questionDiv = createQuestionDiv(question);
        if (index === 0) {
        questionDiv.style.borderTop = '1px solid #cccccc';
        }
        questionsContainer.appendChild(questionDiv);
    });
}

function assignFunctionToQuestionContainer(questions, originalContent_html) {
    let mailcontent_html = originalContent_html;
    const questionContainers = document.querySelectorAll('.question-container');
    const highlightedParts = [];

    questions.forEach((question, index) => {
        const result = lineCorrespondingPart(question, mailcontent_html, index);
        mailcontent_html = result.mailcontent_html;
        highlightedParts.push({ part: result.highlightedPart, id: result.uniqueId });
    });

    document.getElementById('originalContent').innerHTML = mailcontent_html;

    questionContainers.forEach((questionContainer, index) => {
        activateEventListeners(questionContainer, questionContainers, highlightedParts[index].part, highlightedParts[index].id);
    });

    questionContainers.forEach((qd) => {
        qd.querySelector('.option-container').classList.add('collapse');
        qd.querySelector('.new-option-container').classList.add('collapse');
    });
}

// --- Internal Helper Functions ---
function createQuestionDiv(question) {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-container';
    questionDiv.setAttribute('data-question-id', question.id);
    const questionText = document.createElement('p');
    questionText.innerHTML = question.question;
    questionDiv.appendChild(questionText);

    const optionContainer = document.createElement('div');
    optionContainer.className = 'option-container';
    questionDiv.appendChild(optionContainer);

    question.choices.forEach(option => {
        const optionButton = createOptionButton(question, option);
        optionContainer.appendChild(optionButton);
    });

    const newOptionAddContainer = createNewOptionAddContainer(question, optionContainer);
    questionDiv.appendChild(newOptionAddContainer);

    return questionDiv;
    }

    function createOptionButton(question, option) {
    const optionButton = document.createElement('button');
    optionButton.className = 'btn btn-outline-secondary btn-sm mx-1 mt-1 mb-3';
    optionButton.textContent = option;
    optionButton.setAttribute('data-question-id', question.id);
    optionButton.setAttribute('data-option-index', option);
    optionButton.setAttribute('data-question-text', question.question);
    optionButton.addEventListener('click', handleOptionClick);
    return optionButton;
}

function createNewOptionAddContainer(question, optionContainer) {
    const newOptionAddContainer = document.createElement('div');
    newOptionAddContainer.className = 'new-option-container input-group input-group-sm mb-3 w-50 mx-1 mt-2';
    const newOptionInput = document.createElement('input');
    newOptionInput.className = 'new-option-input form-control';
    newOptionInput.type = 'text';
    newOptionInput.placeholder = 'New option';
    newOptionAddContainer.appendChild(newOptionInput);

    const addOptionButton = document.createElement('button');
    addOptionButton.className = 'btn btn-outline-primary';
    addOptionButton.textContent = 'Add';
    newOptionAddContainer.appendChild(addOptionButton);

    addOptionButton.addEventListener('click', () => {
        if (newOptionInput.value.trim() !== '') {
        const newOptionButton = createOptionButton(question, newOptionInput.value);
        optionContainer.appendChild(newOptionButton);
        newOptionButton.click();
        }
        newOptionInput.value = '';
    });

    return newOptionAddContainer;
}

function handleOptionClick(event) {
    const button = event.target;
    const questionId = button.getAttribute('data-question-id');
    const selectedOptionIndex = button.getAttribute('data-option-index');
    const questionText = button.getAttribute('data-question-text');

    if (!window.selectedOptions) {
        window.selectedOptions = {};
    }
    if (!window.selectedOptions[questionId]) {
        window.selectedOptions[questionId] = {
        question: questionText,
        choices: []
        };
    }

    const optionIndex = window.selectedOptions[questionId].choices.indexOf(selectedOptionIndex);
    if (optionIndex > -1) {
        window.selectedOptions[questionId].choices.splice(optionIndex, 1);
        button.classList.remove('selected');
    } else {
        window.selectedOptions[questionId].choices.push(selectedOptionIndex);
        button.classList.add('selected');
    }
}

function lineCorrespondingPart(questionObj, mailcontent_html, i) {
    const correspondinghtml = questionObj.corresponding_part;
    const [begin, end] = findMostSimilarSubstring(mailcontent_html, correspondinghtml);

    if (begin === -1 || end === -1) {
        console.error("No similar substring found.");
        return { mailcontent_html, highlightedPart: "" };
    }

    const uniqueId = `highlight-${i}-${Math.random().toString(36).substr(2, 9)}`;
    const linedHTML = `<span class="line" id="${uniqueId}">${mailcontent_html.slice(begin, end)}</span>`;
    const highlightedPart = mailcontent_html.slice(begin, end);

    mailcontent_html = mailcontent_html.slice(0, begin) + linedHTML + mailcontent_html.slice(end);
    return { mailcontent_html, highlightedPart, uniqueId };
}

function activateEventListeners(questionDiv, questionContainers, highlightedPart, uniqueId) {
    const textElements = document.querySelectorAll('.line');
    textElements.forEach((textElement) => {
        if (textElement.id === uniqueId) {
        questionDiv.addEventListener('click', () => {
            handleQuestionClick(questionDiv, questionContainers, textElement);
        });
        textElement.addEventListener('click', () => {
            handleQuestionClick(questionDiv, questionContainers, textElement);
        });
        }
    });
}

function handleQuestionClick(questionDiv, questionContainers, textElement) {
    questionContainers.forEach((qd) => {
        qd.classList.remove('qd-selected');
        qd.querySelectorAll('.option-container button').forEach((button) => {
        button.classList.remove('collapse');
        });
        qd.querySelector('.new-option-container').classList.add('collapse');
    });

    document.querySelectorAll('.line').forEach((tE) => {
        tE.classList.remove('highlight');
    });

    questionDiv.classList.add('qd-selected');
    textElement.classList.add('highlight');
    questionDiv.querySelector('.option-container').classList.remove('collapse');
    questionDiv.querySelector('.new-option-container').classList.remove('collapse');

    questionContainers.forEach((qd) => {
        if (qd !== questionDiv) {
        qd.querySelectorAll('.option-container button').forEach((button) => {
            if (!button.classList.contains('selected')) {
            button.classList.add('collapse');
            }
        });
        }
    });

    textElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
}

function levenshtein(a, b) {
    const matrix = [];
    let i, j;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
            ? matrix[i - 1][j - 1]
            : Math.min(
                matrix[i - 1][j - 1] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j] + 1
                );
        }
    }
    return matrix[b.length][a.length];
}

function findTagBoundaries(str) {
    const tagBoundaryPattern = /<[^>]*>/g;
    const boundaries = [];
    let match;
    while ((match = tagBoundaryPattern.exec(str)) !== null) {
        boundaries.push([match.index, match.index + match[0].length]);
    }
    return boundaries;
    }

    function isWithinTag(index, tagBoundaries) {
    for (let boundary of tagBoundaries) {
        if (index >= boundary[0] && index < boundary[1]) {
            return true;
        }
    }
    return false;
}

function findMostSimilarSubstring(a, b) {
    let minDistance = b.length + 5;
    let mostSimilarSubstringIndices = [0, 0];
    let len_start = b.length - 5;
    if (len_start < 0) {
        len_start = 0;
    }
    const tagBoundaries = findTagBoundaries(a);
    for (let len = len_start; len <= b.length + 5; len++) {
        for (let i = 0; i < a.length - len + 1; i++) {
        if (isWithinTag(i, tagBoundaries) || isWithinTag(i + len - 1, tagBoundaries)) {
            continue;
        }
        const substring = a.substr(i, len);
        const distance = levenshtein(substring, b);
        if (distance < minDistance) {
            minDistance = distance;
            mostSimilarSubstringIndices = [i, i + len];
        }
        }
    }
    return mostSimilarSubstringIndices;
}

function getLocalStorage(keys) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(keys, function (result) {
        if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
        } else {
            resolve(result);
        }
        });
    });
}

// --- Optional: 定期的なメッセージ送信（必要に応じて利用） ---
setInterval(() => {
    chrome.runtime.sendMessage("何でも良いメッセージ");
}, 25 * 1000);


// -----------------------
// Message Handlers
// -----------------------
const handleReflectMessage = request => {
    console.log(request);
    updateFromRequest(request);
    setDisabled(elements.regenerateQuestionsButton, true);
    setDisabled(elements.generateReplyButton, true);
    // 質問生成を開始
    generateQuestions(mailData, personalInformation, customizeReply);
};

const handleReflectQuestion = request => {
    console.log(request.question);
    const questionData = JSON.parse(request.question);
    makeQuestionContainer(questionData.questions);
    assignFunctionToQuestionContainer(questionData.questions, mailData.html);
    const spinner = getElement('generateReplyProgressSpinner');
    if (spinner) spinner.classList.add('visually-hidden');
    setDisabled(elements.regenerateQuestionsButton, false);
    setDisabled(elements.generateReplyButton, false);
};

const handleFinishGenerateReply = () => {
    setDisabled(getElement('generateReplyButton'), false);
    setDisabled(getElement('replyBox'), false);
    getElement('generateReplyButtonLoading').classList.add('visually-hidden');
    getElement('generateReplyButtonText').innerHTML = 'Generate Reply';
    scrollIntoViewSmooth(elements.finalizeButton);
};

const handleNoContentTab = () => {
    alert("Gmailの返信ボックスが見つかりませんでした。返信をコピーして使用してください。");
};

const handleReflectReply = request => {
    elements.replyBox.value += request.messageContent;
};

const handleShowNotification = request => {
    console.log(request.message);
    alert(request.message);
};

const handleProgressUpdate = request => {
    console.log(`Progress: ${request.currentStep} / ${request.totalSteps}`);
};

// -----------------------
// Chrome Runtime Message Listener
// -----------------------
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (thisReplyEditorTabId === 0 && request.replyEditorTabId !== undefined) {
        thisReplyEditorTabId = request.replyEditorTabId;
    }
    if (thisReplyEditorTabId === request.replyEditorTabId) {
        switch (request.action) {
        case 'ReflectMessage':
            handleReflectMessage(request);
            break;
        case 'ReflectQuestion':
            handleReflectQuestion(request);
            break;
        case 'finish_generate_reply':
            handleFinishGenerateReply();
            break;
        case 'noContentTab':
            handleNoContentTab();
            break;
        case 'reflectReply':
            handleReflectReply(request);
            break;
        case 'showNotification':
            handleShowNotification(request);
            break;
        case 'ProgressUpdate':
            handleProgressUpdate(request);
            break;
        default:
            break;
        }
    }
});

// -----------------------
// UI Event Handlers
// -----------------------
const onGenerateReplyClick = () => {
    const replyBoxValue = elements.replyBox.value;
    elements.replyBox.value = '';
    setDisabled(elements.replyBox, true);
    elements.replyBox.blur();
    customizeReply.additionalRequest = getElement('additionalRequest').value;

    setDisabled(elements.generateReplyButton, true);
    getElement('generateReplyButtonLoading').classList.remove('visually-hidden');
    getElement('generateReplyButtonText').innerHTML = '';

    scrollIntoViewSmooth(elements.finalizeButton);

    // generateReply は非同期関数として定義（ここでは引数として各情報を渡す）
    generateReply(mailData, customizeReply, personalInformation, selectedOptions, replyBoxValue, elements);
};

const onRegenerateQuestionsClick = () => {
    const questionsContainer = document.querySelector('.questions');
    updateElementHTML(questionsContainer, '<div class="d-flex justify-content-center"><div class="spinner-grow mt-4" role="status" id="generateReplyProgressSpinner"><span class="visually-hidden">Loading...</span></div></div>');
    updateElementHTML(elements.highlightedMessageDiv, mailData.html);
    generateQuestions(mailData, personalInformation, customizeReply);
    setDisabled(elements.regenerateQuestionsButton, true);
    setDisabled(elements.generateReplyButton, true);
};

const onFinalizeButtonClick = () => {
    const replyText = elements.replyBox.value;
    chrome.runtime.sendMessage({
        action: 'finalizeReply',
        replyContent: replyText,
        contentTabId: contentTabId,
        replyEditorTabId: thisReplyEditorTabId,
        originalMessageContent_html: mailData.html
    });
};

const onDeleteButtonClick = () => {
    elements.replyBox.value = '';
};

const onTogglePastMessage = () => {
    const pastEl = getElement('originalMessagePast');
    const pastBtn = getElement('originalMessagePastButton');
    if (pastEl.style.display === 'block') {
        toggleDisplay(pastEl, 'none');
        pastBtn.innerText = 'Show previous correspondence';
    } else {
        toggleDisplay(pastEl, 'block');
        pastBtn.innerText = 'Hide previous correspondence';
    }
};

const registerCustomizationListeners = () => {
    elements.customizeFormalityButtons.forEach(button => {
        button.addEventListener('change', () => {
        if (button.checked) customizeReply.formality = button.value;
        });
    });
    elements.customizeToneButtons.forEach(button => {
        button.addEventListener('change', () => {
        if (button.checked) customizeReply.tone = button.value;
        });
    });
    elements.customizeLengthButtons.forEach(button => {
        button.addEventListener('change', () => {
        if (button.checked) customizeReply.length = button.value;
        });
    });
};

const registerSettingsModalListener = () => {
    if (!elements.settingsModal) return;
    elements.settingsModal.addEventListener('shown.bs.modal', () => {
        chrome.storage.local.get(
        ['fullName', 'email', 'affiliation', 'language', 'role', 'signature', 'otherInfo'],
        result => {
            if (result.fullName) getElement('fullName').value = result.fullName;
            if (result.email) getElement('email').value = result.email;
            if (result.affiliation) getElement('affiliation').value = result.affiliation;
            if (result.language) getElement('language').value = result.language;
            if (result.role) getElement('role').value = result.role;
            if (result.signature) getElement('signature').value = result.signature;
            if (result.otherInfo) getElement('otherInfo').value = result.otherInfo;
        }
        );
        getElement('saveSettingsButton').addEventListener('click', () => {
        const data = {
            fullName: getElement('fullName').value,
            email: getElement('email').value,
            affiliation: getElement('affiliation').value,
            language: getElement('language').value,
            role: getElement('role').value,
            signature: getElement('signature').value,
            otherInfo: getElement('otherInfo').value,
        };
        Object.assign(personalInformation, data);
        chrome.runtime.sendMessage({ action: "updatePersonalInformation", data });
        chrome.storage.local.set(data);
        });
    });
};

// -----------------------
// Register UI Listeners
// -----------------------
elements.generateReplyButton.addEventListener('click', onGenerateReplyClick);
elements.regenerateQuestionsButton.addEventListener('click', onRegenerateQuestionsClick);
elements.finalizeButton.addEventListener('click', onFinalizeButtonClick);
elements.deleteButton.addEventListener('click', onDeleteButtonClick);
elements.originalMessagePastButton.addEventListener('click', onTogglePastMessage);

registerCustomizationListeners();
registerSettingsModalListener();