const selectedOptions = {};
const linedHTMLs = {};

document.addEventListener('DOMContentLoaded', async () => {
    const selectors = {
        highlightedMessageDiv: document.getElementById('originalContent'),
        replyBox: document.getElementById('replyBox'),
        finalizeButton: document.getElementById('finalizeButton'),
        regenerateQuestionsButton: document.getElementById('regenerateQuestionsButton'),
        generateReplyButton: document.getElementById('generateReplyButton'),
        subject: document.getElementById('originalMessageTitle'),
        to: document.getElementById('originalMessageSender'),
        receiveTime: document.getElementById('originalMessageReceiveTime'),
        scenario: document.getElementById('scenario'),
        addInfo: document.getElementById('addInfo'),
        copyButton: document.getElementById('copyButton'),
        deleteButton: document.getElementById('deleteButton'),
        settingsButton: document.getElementById('settingsButton'),
        settingsModal: document.getElementById('settingsModal'),
        customizeFormalityButtons: document.querySelectorAll('input[name="btnradio-formality"]'),
        customizeToneButtons: document.querySelectorAll('input[name="btnradio-tone"]'),
        customizeLengthButtons: document.querySelectorAll('input[name="btnradio-length"]'),
        senderRole: document.getElementById('senderRole'),
        recipientRole: document.getElementById('recipientRole'),
        mailNum: document.getElementById('mail-num'),
        originalMessagePastButton: document.getElementById('originalMessagePastButton')
    };

    // メールデータ、個人情報、カスタマイズされた返信のデータをオブジェクト化
    const mailData = {};
    const personalInformation = {};
    const customizeReply = {};

    // UIの初期化
    const initQuestionContainer = (questions) => {
        const container = document.querySelector('.questions');
        container.innerHTML = questions.map(q => createQuestionDiv(q)).join('');
    };

    // let mailData = {
    //     html: "",
    //     text: "",
    //     title: "",
    //     sender: "",
    //     pastHtml: "",
    //     receiveTime: "",
    //     now: ""
    // };

    // let personalInformation = {
    //     fullName: "",
    //     email: "",
    //     affiliation: "",
    //     language: "",
    //     role: "",
    //     signature: "",
    //     otherInfo: "",
    //     user_id: ""
    // };

    // let customizeReply = {
    //     sender: "", 
    //     recipient: "", 
    //     formality: "", 
    //     tone: "", 
    //     urgency: "", 
    //     length: "", 
    //     purpose: "", 
    //     additionalRequest: ""
    // };

    let thisReplyEditorTabId = 0;
    let contentTabId = 0;

    chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {

        if (thisReplyEditorTabId === 0 && request.replyEditorTabId !== undefined) {
            thisReplyEditorTabId = request.replyEditorTabId;
        }

        if (thisReplyEditorTabId == request.replyEditorTabId) {

            if (request.action === 'ReflectMessage') {
                mailData.html = request.originalContent_html;
                mailData.text = request.originalContent_text;
                mailData.title = request.subject;
                mailData.sender = request.sender;
                mailData.receiveTime = request.receiveTime;
                mailData.now = getJapanTimeFormatted();
                console.log(request.originalContent_text);
                console.log(request.originalContent_html);
                selectors.subject.innerText = 'Subject: ' + request.subject;
                selectors.to.innerText = 'Sender: ' + request.sender;
                selectors.receiveTime.innerText = 'Received Time: ' + request.receiveTime;
                document.title = request.subject;
                contentTabId = request.contentTabId;

                mailData.pastHtml = request.originalContentPast_html

                selectors.highlightedMessageDiv.innerHTML = mailData.html;

                personalInformation.fullName = request.personalInformation.fullName;
                personalInformation.email = request.personalInformation.email;
                personalInformation.affiliation = request.personalInformation.affiliation;
                personalInformation.language = request.personalInformation.language;
                personalInformation.role = request.personalInformation.role;
                personalInformation.mode = request.personalInformation.mode;
                personalInformation.signature = request.personalInformation.signature;
                personalInformation.otherInfo = request.personalInformation.otherInfo;
                personalInformation.user_id = request.personalInformation.user_id;

                if (mailData.pastHtml === null || /^<br\s*\/?>$/.test(mailData.pastHtml) || mailData.pastHtml === '') {
                    document.getElementById('originalMessagePast').style.display = 'none';
                    document.getElementById('originalMessagePastButton').style.display = 'none';
                }
                
                else {
                    document.getElementById('originalMessagePast').innerHTML = '<div class="email-content">' + mailData.pastHtml + '</div>';
                }
                document.getElementById('originalMessagePast').style.display = 'none';
        
                selectors.regenerateQuestionsButton.disabled = true;
                selectors.generateReplyButton.disabled = true;

                generateQuestions(mailData, personalInformation, customizeReply);
            }

            else if (request.action === 'ReflectQuestion') {
                console.log(request.question);
                const questiondata = JSON.parse(request.question);
                makeQuestionContainer(questiondata.questions);

                assignFunctionToQuestionContainer(questiondata.questions, mailData.html);
                const progressSpinner = document.getElementById('generateReplyProgressSpinner');
                if (progressSpinner) {
                    progressSpinner.classList.add('visually-hidden');
                }
                selectors.regenerateQuestionsButton.disabled = false;
                selectors.generateReplyButton.disabled = false;
            }

            else if (request.action === 'finish_generate_reply'){
                document.getElementById('generateReplyButton').disabled = false;
                document.getElementById('replyBox').disabled = false;
                document.getElementById('generateReplyButtonLoading').classList.add('visually-hidden');
                document.getElementById('generateReplyButtonText').innerHTML = 'Generate Reply';

                selectors.finalizeButton.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
            }

            else if (request.action === 'noContentTab') {
                alert("Gmailの返信ボックスが見つかりませんでした。返信をコピーして使用してください。");
            }

            else if (request.action === 'reflectReply') {
                selectors.replyBox.value += request.messageContent;
            }

            else if (request.action === 'showNotification') {
                alert(request.message);
            }
            
            else if (request.action === 'ProgressUpdate') {
                const currentStep = request.currentStep;
                const totalSteps = request.totalSteps;
            }
        }
    });

    selectors.generateReplyButton.addEventListener('click', () => {
        const replyBoxValue = document.getElementById('replyBox').value;
        selectors.replyBox.value = '';
        selectors.replyBox.disabled = true;
        selectors.replyBox.blur();
        customizeReply.additionalRequest = document.getElementById('additionalRequest').value;

        selectors.generateReplyButton.disabled = true;
        document.getElementById('generateReplyButtonLoading').classList.remove('visually-hidden');
        document.getElementById('generateReplyButtonText').innerHTML = '';

        selectors.finalizeButton.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});

        generateReply(mailData, customizeReply, personalInformation, selectedOptions, replyBoxValue, selectors);
    });

    selectors.regenerateQuestionsButton.addEventListener('click', () => {
        // 既存のquestionsContainerを消し、ローディングを表示
        const questionsContainer = document.querySelector('.questions');
        questionsContainer.innerHTML = '<div class="d-flex justify-content-center"><div class="spinner-grow mt-4" role="status" id="generateReplyProgressSpinner"><span class="visually-hidden">Loading...</span></div></div>';

        // originalMessageのhighlightを削除する
        selectors.highlightedMessageDiv.innerHTML = mailData.html;

        // 新しい質問を生成
        generateQuestions(mailData, personalInformation, customizeReply);

        selectors.regenerateQuestionsButton.disabled = true;
        selectors.generateReplyButton.disabled = true;
    });

    selectors.finalizeButton.addEventListener('click', () => {
        const replyText = selectors.replyBox.value;
        chrome.runtime.sendMessage({ 
            action: 'finalizeReply', 
            replyContent: replyText, 
            contentTabId: contentTabId, 
            replyEditorTabId: thisReplyEditorTabId, 
            originalMessageContent_html: mailData.html 
        });
    });

    // elements.copyButton.addEventListener('click', () => {
    //     const replyText = elements.replyBox.value;
    //     navigator.clipboard.writeText(replyText);
    // });

    selectors.deleteButton.addEventListener('click', () => {
        selectors.replyBox.value = '';
    });

    selectors.originalMessagePastButton.addEventListener('click', () => {
        if (document.getElementById('originalMessagePast').style.display === 'block') {
            document.getElementById('originalMessagePast').style.display = 'none';
            document.getElementById('originalMessagePastButton').innerText = '過去のやり取りを見る';
        }
        else {
            document.getElementById('originalMessagePast').style.display = 'block';
            document.getElementById('originalMessagePastButton').innerText = '過去のやり取りを隠す';
        }
    });

    // elements.customizeSenderButtons.forEach((button) => {
    //     button.addEventListener('change', () => {
    //         if (button.checked) {
    //             customizeReply.sender = button.value;
    //         }
    //     });
    // });

    selectors.customizeFormalityButtons.forEach((button) => {
        button.addEventListener('change', () => {
            if (button.checked) {
                customizeReply.formality = button.value;
            }
        });
    });

    selectors.customizeToneButtons.forEach((button) => {
        button.addEventListener('change', () => {
            if (button.checked) {
                customizeReply.tone = button.value;
            }
        });
    });

    selectors.customizeLengthButtons.forEach((button) => {
        button.addEventListener('change', () => {
            if (button.checked) {
                customizeReply.length = button.value;
            }
        });
    });

    selectors.settingsModal.addEventListener('shown.bs.modal', () => {
        chrome.storage.local.get(['fullName', 'email', 'affiliation', 'language', 'role', 'mode', 'signature', 'otherInfo', 'user_id'], function(result) {
            if (result.fullName) document.getElementById('fullName').value = result.fullName;
            if (result.email) document.getElementById('email').value = result.email;
            if (result.affiliation) document.getElementById('affiliation').value = result.affiliation;
            if (result.language) document.getElementById('language').value = result.language;
            if (result.role) document.getElementById('role').value = result.role;
            // if (result.mode) document.getElementById('mode').value = result.mode;
            if (result.signature) document.getElementById('signature').value = result.signature;
            if (result.otherInfo) document.getElementById('otherInfo').value = result.otherInfo;
            if (result.user_id) document.getElementById('user_id').value = result.user_id;
        });

        document.getElementById('saveSettingsButton').addEventListener('click', () => {
            var fullName = document.getElementById('fullName').value;
            var email = document.getElementById('email').value;
            var affiliation = document.getElementById('affiliation').value;
            var language = document.getElementById('language').value;
            // var mode = document.getElementById('mode').value;
            var mode = 'Proposed';
            var role = document.getElementById('role').value;
            var signature = document.getElementById('signature').value;
            var otherInfo = document.getElementById('otherInfo').value;
            var user_id = document.getElementById('user_id').value;

            personalInformation.fullName = fullName;
            personalInformation.email = email;
            personalInformation.affiliation = affiliation;
            personalInformation.language = language;
            personalInformation.role = role;
            personalInformation.mode = mode;
            personalInformation.signature = signature;
            personalInformation.otherInfo = otherInfo;
            personalInformation.user_id = user_id;

            chrome.runtime.sendMessage({
                action: "updatePersonalInformation",
                data: { fullName, email, affiliation, language, role, mode, signature, otherInfo, user_id }
            });

            chrome.storage.local.set({fullName: fullName, email: email, affiliation: affiliation, language: language, role: role, mode: mode, signature: signature, otherInfo: otherInfo, user_id: user_id});

        });
    });
});

function makeQuestionContainer(questions) {
    const questionsContainer = document.querySelector('.questions');
    questionsContainer.innerHTML = '';

    questions.forEach((question, index) => {
        const questionsDiv = createQuestionDiv(question);

        if (index === 0) {
            questionsDiv.style.borderTop = '1px solid #cccccc';
        }

        questionsContainer.appendChild(questionsDiv);
    });
}

function createQuestionDiv(question) {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-container';
    questionDiv.setAttribute('data-question-id', question.id);  // ユニークIDを設定
    const questionText = document.createElement('p');
    questionText.innerHTML = question.question;
    questionDiv.appendChild(questionText);

    const OptionContainer = document.createElement('div');
    OptionContainer.className = 'option-container';
    questionDiv.appendChild(OptionContainer);

    question.choices.forEach(option => {
        const optionButton = createOptionButton(question, option);
        OptionContainer.appendChild(optionButton);
    });

    const newOptionAddContainer = createNewOptionAddContainer(question, OptionContainer);
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

function createNewOptionAddContainer(question, OptionContainer) {
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
            const newoptionButton = createOptionButton(question, newOptionInput.value);
            OptionContainer.appendChild(newoptionButton);
            newoptionButton.click();
        }
        newOptionInput.value = '';
    });

    return newOptionAddContainer;
}

function assignFunctionToQuestionContainer(questions, originalContent_html) {
    let mailcontent_html = originalContent_html;
    const questionContainers = document.querySelectorAll('.question-container');
    const highlightedParts = [];

    questions.forEach((question, index) => {
        const result = lineCorrespondingPart(question, mailcontent_html, index);
        mailcontent_html = result.mailcontent_html;
        highlightedParts.push({part: result.highlightedPart, id: result.uniqueId});
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

function handleOptionClick(event) {
    const button = event.target;
    const questionId = button.getAttribute('data-question-id');
    const selectedOptionIndex = button.getAttribute('data-option-index');
    const questionText = button.getAttribute('data-question-text');

    if (!selectedOptions[questionId]) {
        selectedOptions[questionId] = {
            question: questionText,
            choices: []
        };
    }

    const optionIndex = selectedOptions[questionId].choices.indexOf(selectedOptionIndex);

    if (optionIndex > -1) {
        selectedOptions[questionId].choices.splice(optionIndex, 1);
        button.classList.remove('selected');
    } else {
        selectedOptions[questionId].choices.push(selectedOptionIndex);
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

    textElement.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
}


// 25秒ごとにchrome.runtime.sendMessageを呼ぶ
setInterval(() => {
    chrome.runtime.sendMessage("何でも良いメッセージ");
}, 25 * 1000);


function highlightCorrespondingPart(questionObj, mailcontent_html) {
    // questiondataを適切な方法で取得
    const correspondinghtml = questionObj.corresponding_part;

    const highlightedHTML = `<span class="highlight">${correspondinghtml}</span>`;
    mailcontent_html = mailcontent_html.replace(correspondinghtml, highlightedHTML);

    document.getElementById('originalMessage').innerHTML = mailcontent_html;
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
            matrix[i][j] = b.charAt(i-1) === a.charAt(j-1) ?
                matrix[i-1][j-1] : Math.min(
                    matrix[i-1][j-1] + 1,
                    matrix[i][j-1] + 1,
                    matrix[i-1][j] + 1
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
    let minDistance = b.length + 5;  // Maximum allowed distance is length of b plus 10
    let mostSimilarSubstringIndices = [0, 0];

    let len_start = b.length - 5;
    if (len_start < 0) {
        len_start = 0;
    }

    const tagBoundaries = findTagBoundaries(a);

    // Check substrings of a that are between length of b - 10 and b + 10
    for (let len = len_start; len <= b.length + 5; len++) {
        for (let i = 0; i < a.length - len + 1; i++) {
            if (isWithinTag(i, tagBoundaries) || isWithinTag(i + len - 1, tagBoundaries)) {
                continue;  // Skip if the start or end of the substring is within a tag
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

async function generateQuestions(mailData, personalInformation) {

    try {
        const result = await getLocalStorage(['fullName', 'email', 'affiliation', 'language', 'role', 'mode', 'signature', 'otherInfo', 'user_id']);
        if (result.fullName) personalInformation.fullName = result.fullName;
        if (result.email) personalInformation.email = result.email;
        if (result.affiliation) personalInformation.affiliation= result.affiliation;
        if (result.language) personalInformation.language = result.language;
        if (result.role) personalInformation.role = result.role;
        if (result.mode) personalInformation.mode = result.mode;
        // if (result.signature) personalInformation.signature = result.signature;
        if (result.otherInfo) personalInformation.otherInfo = result.otherInfo;
        if (result.user_id) personalInformation.user_id = result.user_id;

        const conversationHistory = [
            {
                role: "system",
                content: "###Incoming Mail### " + mailData.html
            },
            // {
            //     role: "system",
            //     content: "###Past Mail Correspondence###" + mailData.pastHtml
            // },
            {
                role: "system",
                content: "###Mail Information### sender:" + mailData.sender + ", title:" + mailData.title + ", receive time:" + mailData.receiveTime + ", current time:" + mailData.now
            },
            {
                role: "system",
                content: "###Audience Information### name:" + personalInformation.fullName + ", affiliation:" + personalInformation.affiliation + ", mail:" + personalInformation.email + ", native language:" + personalInformation.language + ", role:" + personalInformation.role + ",otherInfo:" + personalInformation.otherInfo
            }
        ];
    
        chrome.runtime.sendMessage({ action: 'generate_questions', conversationHistory: conversationHistory, user_id: personalInformation.user_id});
    } catch (error) {
        console.error(error);
    }
}

async function generateReply(mailData, customizeReply, personalInformation, selectedChoices, replyBoxValue, elements) {

    try {
        const result = await getLocalStorage(['fullName', 'email', 'affiliation', 'language', 'role', 'mode', 'signature', 'otherInfo', 'user_id']);
        if (result.fullName) personalInformation.fullName = result.fullName;
        if (result.email) personalInformation.email = result.email;
        if (result.affiliation) personalInformation.affiliation= result.affiliation;
        if (result.language) personalInformation.language = result.language;
        if (result.role) personalInformation.role = result.role;
        if (result.mode) personalInformation.mode = result.mode;
        if (result.signature) personalInformation.signature = result.signature;
        if (result.otherInfo) personalInformation.otherInfo = result.otherInfo;
        if (result.user_id) personalInformation.user_id = result.user_id;

        if (!result.signature) {
            personalInformation.signature = "------------------------------------------" + "<br>" + personalInformation.fullName + "<br>" + personalInformation.affiliation + "<br>" + personalInformation.email + "<br>" + "------------------------------------------";
        }

        const generateReplyPrompt = [
            {
                role: "system",
                content: "###Instruction### Your role is to compose a email repliy on behalf of the user. You MUST generate a reply in the same language as the incoming mail"
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
                content: "###Mail Information### sender:" + mailData.sender + ", title:" + mailData.title + ", receive time:" + mailData.receiveTime + ", current time:" + mailData.now
            },
            {
                role: "system",
                content: "###Audience Information### name:" + personalInformation.fullName + ", affiliation:" + personalInformation.affiliation + ", mail:" + personalInformation.email + ", native language:" + personalInformation.language + ", role:" + personalInformation.role + ",otherInfo:" + personalInformation.otherInfo
            },
            {  
                role: "system",
                content: "###Signature###" + personalInformation.signature
            }
        ];
    
        console.log(selectedChoices);
    
        for (let quesId in selectedChoices) {
            if(selectedChoices.hasOwnProperty(quesId)){
                // 質問をプロンプトに追加
                generateReplyPrompt.push({
                    role: "assistant",
                    content: selectedChoices[quesId].question
                });
        
                // 選択肢をプロンプトに追加
                selectedChoices[quesId].choices.forEach(choice => {
                    generateReplyPrompt.push({
                        role: "user",
                        content: choice
                    });
                });
            }
        }
    
        if (replyBoxValue == ''){
            generateReplyPrompt.push({
                role: "system",
                content: "You MUST consider the following conditions when writing the reply message: " + " Role of the sender: " + customizeReply.sender + ", Role of the recipient: " + customizeReply.recipient + ", Formality of the reply: " + customizeReply.formality + ", Tone of the reply: " + customizeReply.tone + ", Length of the reply;" + customizeReply.length + ", Additional requests: " + customizeReply.additionalRequest
            });
        } else {
            generateReplyPrompt.push({
                role: "system",
                content: "###Current Reply###" + replyBoxValue
            });
    
            generateReplyPrompt.push({
                role: "system",
                content: "You MUST consider the following conditions when revising the reply message: " + " Role of the sender: " + customizeReply.sender + ", Role of the recipient: " + customizeReply.recipient + ", Formality of the reply: " + customizeReply.formality + ", Tone of the reply: " + customizeReply.tone + ", Length of the reply;" + customizeReply.length + ", Additional requests: " + customizeReply.additionalRequest
            });
        }
    
        // generateReplyStream(generateReplyPrompt, mailData, elements, replyBoxValue, customizeReply, selectedChoices);
        chrome.runtime.sendMessage({ action: 'generateReply', prompt: generateReplyPrompt, user_id: personalInformation.user_id});
    } catch (error) {
        console.error(error);
    }
}

function getLocalStorage(keys) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(keys, function(result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result);
            }
        });
    });
}

function getJapanTimeFormatted() {
    const options = {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };

    const formatter = new Intl.DateTimeFormat('ja-JP', options);
    const japanTime = formatter.format(new Date());

    // フォーマット済みの文字列から必要な部分を抽出して再フォーマットします
    const parts = japanTime.match(/(\d+)\/(\d+)\/(\d+)\((.)\)\s(\d+):(\d+)/);
    const [, , month, day, weekday, hour, minute] = parts;

    return `${parseInt(month)}月${parseInt(day)}日(${weekday}) ${hour}:${minute}`;
}