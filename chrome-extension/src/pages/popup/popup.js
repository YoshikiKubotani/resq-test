document.addEventListener('DOMContentLoaded', () => {
    // ページ読み込み時に保存された情報をフォームにセット
    chrome.storage.local.get(['fullName', 'email', 'affiliation', 'language', 'role', 'signature', 'otherInfo', 'user_id'], function(result) {
        if (result.fullName) document.getElementById('fullName').value = result.fullName;
        if (result.email) document.getElementById('email').value = result.email;
        if (result.affiliation) document.getElementById('affiliation').value = result.affiliation;
        if (result.language) document.getElementById('language').value = result.language;
        if (result.role) document.getElementById('role').value = result.role;
        if (result.otherRole) document.getElementById('otherRoleDiv').value = result.otherRole;
        if (result.signature) document.getElementById('signature').value = result.signature;
        if (result.otherInfo) document.getElementById('otherInfo').value = result.otherInfo;
        if (result.user_id) document.getElementById('user_id').value = result.user_id;
    });

    var roleSelect = document.getElementById('role');
    var otherRoleDiv = document.getElementById('otherRoleDiv');

    roleSelect.addEventListener('change', function() {
        if (document.getElementById('role').value === 'その他') {
            otherRoleDiv.style.display = 'block';
        } else {
            otherRoleDiv.style.display = 'none';
        }
    });
    
    document.getElementById('userInfoForm').addEventListener('submit', function(e) {
        e.preventDefault();
    
        var fullName = document.getElementById('fullName').value;
        var email = document.getElementById('email').value;
        var affiliation = document.getElementById('affiliation').value;
        var language = document.getElementById('language').value;
        var role = document.getElementById('role').value;
        if (role === 'その他') {
            role = document.getElementById('otherRoleDiv').value;
        }
        var signature = document.getElementById('signature').value;
        var otherInfo = document.getElementById('otherInfo').value;
        var user_id = document.getElementById('user_id').value;
    
        // background.jsへ情報を送信
        chrome.runtime.sendMessage({
            action: "updatePersonalInformation",
            data: { fullName, email, affiliation, language, role, signature, otherInfo, user_id}
        });

        // 情報をchrome.storageに保存
        chrome.storage.local.set({fullName: fullName, email: email, affiliation: affiliation, language: language, role: role, signature: signature, otherInfo: otherInfo, user_id: user_id})

        if (!fullName || !affiliation || !email || !user_id) {
            alert("User inofrmation is not enough.");
        } else {
            alert("Settings have been saved!");
        }
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if ( request.action === 'setPersonalInformation' ){
            alert("Please set the user information.");
            console.log(request.data);
        }
    });
});