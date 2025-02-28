document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('userInfoForm');
    
    const loadSettings = () => {
        chrome.storage.local.get(
            ['fullName', 'email', 'affiliation', 'language', 'role', 'signature', 'otherInfo'], 
            (result) => {
                if (result.fullName) document.getElementById('fullName').value = result.fullName;
                if (result.email) document.getElementById('email').value = result.email;
                if (result.affiliation) document.getElementById('affiliation').value = result.affiliation;
                if (result.language) document.getElementById('language').value = result.language;
                if (result.role) document.getElementById('role').value = result.role;
                if (result.signature) document.getElementById('signature').value = result.signature;
                if (result.otherInfo) document.getElementById('otherInfo').value = result.otherInfo;
            }
        );
    };

    const saveSettings = (data) => {
        chrome.runtime.sendMessage({ action: 'updatePersonalInformation', data });
        chrome.storage.local.set(data, () => {
            const message = (!data.fullName || !data.affiliation || !data.email) 
            ? 'User information is not enough.' 
            : 'Settings have been saved!';
            alert(message);
        });
    };

    loadSettings();

    const roleSelect = document.getElementById('role');
    const otherRoleDiv = document.getElementById('otherRoleDiv');
    roleSelect.addEventListener('change', () => {
        if (roleSelect.value === 'その他') {
            otherRoleDiv.style.display = 'block';
        } else {
            otherRoleDiv.style.display = 'none';
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            affiliation: document.getElementById('affiliation').value,
            language: document.getElementById('language').value,
            role: document.getElementById('role').value,
            signature: document.getElementById('signature').value,
            otherInfo: document.getElementById('otherInfo').value,
        };
        saveSettings(data);
    });

    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === 'setPersonalInformation') {
            alert('Please set the user information.');
        }
    }
    );
});