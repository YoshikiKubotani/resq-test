// /src/helpers/ai.js
// AI関連のヘルパー関数群

// --- Exported Functions ---

export async function generateQuestions(mailData, personalInformation, customizeReply) {
    try {
        const result = await getLocalStorage([
        'fullName', 'email', 'affiliation', 'language',
        'role', 'mode', 'signature', 'otherInfo'
        ]);
        if (result.fullName) personalInformation.fullName = result.fullName;
        if (result.email) personalInformation.email = result.email;
        if (result.affiliation) personalInformation.affiliation = result.affiliation;
        if (result.language) personalInformation.language = result.language;
        if (result.role) personalInformation.role = result.role;
        if (result.mode) personalInformation.mode = result.mode;
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

export async function generateReply(mailData, customizeReply, personalInformation, selectedChoices, replyBoxValue, elements) {
    try {
        const result = await getLocalStorage([
        'fullName', 'email', 'affiliation', 'language',
        'role', 'mode', 'signature', 'otherInfo'
        ]);
        if (result.fullName) personalInformation.fullName = result.fullName;
        if (result.email) personalInformation.email = result.email;
        if (result.affiliation) personalInformation.affiliation = result.affiliation;
        if (result.language) personalInformation.language = result.language;
        if (result.role) personalInformation.role = result.role;
        if (result.mode) personalInformation.mode = result.mode;
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

export function makeQuestionContainer(questions) {
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

export function assignFunctionToQuestionContainer(questions, originalContent_html) {
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
