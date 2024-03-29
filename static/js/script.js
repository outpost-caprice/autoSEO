document.body.style.display = 'none';
window.onload = function() {
  var UserInput = null;

  var cookies = document.cookie;
  var cookiesArray = cookies.split(';');
  var pass = 'b3V0cG9zdA==';

  for(var c of cookiesArray){
    var cArray = c.split('=');
    if(cArray[0].indexOf('cruw-basic') > -1){
      UserInput = decodeURIComponent(cArray[1]);
    }
  }
  if(!(UserInput && UserInput == window.atob(pass))){
    UserInput = prompt("パスワードを入力して下さい:","");
  }

  if(UserInput != window.atob(pass)){
    document.body.innerHTML = "403 Forbidden";
  }else{
    var now = new Date();
    now.setMinutes(now.getMinutes() + 60*24*3);
    document.cookie = "cruw-basic=" + encodeURIComponent(UserInput) + ";expires=" + now.toUTCString()+"; path=/;";
  }
  document.body.style.display = null;
}

// DOMが読み込まれた後にイベントリスナーを設定
document.addEventListener('DOMContentLoaded', function() {
    // 行の追加ボタンにイベントリスナーを追加
    document.getElementById('addRowButton').addEventListener('click', addRow);
    document.getElementById('removeRowButton').addEventListener('click', removeTableRow);
    document.getElementById('seoForm').addEventListener('submit', submitForm);
});

// テーブル行を追加する関数
function addRow() {
    const table = document.getElementById('headerTable').getElementsByTagName('tbody')[0];
    const newRow = table.insertRow();
    newRow.innerHTML = `
        <td>
            <select name="headerLevel[]">
                <option value="h1">H1</option>
                <option value="h2">H2</option>
                <option value="h3">H3</option>
                <option value="h4">H4</option>
                <option value="h5">H5</option>
                <option value="h6">H6</option>
            </select>
        </td>
        <td><textarea name="headerText[]"></textarea></td>
        <td><textarea name="headerCharCount[]" oninput="this.value=this.value.replace(/[^0-9]/g,'');"></textarea></td>
        <td><textarea name="headerSummary[]"></textarea></td>
        <td><textarea name="headerKeywords[]"></textarea></td>
        <td><textarea name="headerNotes[]"></textarea></td>
    `;
}

// テーブル行を削除する関数
function removeTableRow() {
    var table = document.getElementById('headerTable').getElementsByTagName('tbody')[0];
    var rowCount = table.rows.length;
    if (rowCount > 1) { // 最初の入力行は削除しない

        table.deleteRow(-1);
    }
}


// フォーム検証関数
function validateForm(event) {
    event.preventDefault(); // 実際のフォーム送信を阻止

    var isValid = true; // フォームが有効かどうかを追跡するフラグ
    var inputs = document.querySelectorAll('#seoForm input[type="text"], #seoForm textarea');
    
    // 入力フィールドの検証
    inputs.forEach(function(input) {
        if (input.value.trim() === '') {
            isValid = false;
        }
    });

    // エラーメッセージの表示
    var messageElement = document.getElementById('message');
    if (!isValid) {
        messageElement.textContent = '未入力の箇所があります。';
        messageElement.className = 'error'; // エラーメッセージのスタイルクラス
    }
    return isValid;
}

function submitForm(event) {
    event.preventDefault();
    if (validateForm(event)){
        const formData = new FormData(event.target);
        const jsonData = {
            section1: {
                keywords: formData.get('inputKeyword').split(',').map(kw => kw.trim()),
                targetReader: formData.get('inputTarget').trim(),
                searchIntent: formData.get('inputIntent').trim(),
                goal: formData.get('inputGoal').trim(),
                title: formData.get('inputTitle').trim(),
                description: formData.get('inputDescription').trim(),
            },
            section2: {}
        };

        document.querySelectorAll("[name='headerLevel[]']").forEach((header, index) => {
            const level = header.value;
            const text = document.querySelectorAll("[name='headerText[]']")[index].value.trim();
            const charCount = document.querySelectorAll("[name='headerCharCount[]']")[index].value.trim();
            const summary = document.querySelectorAll("[name='headerSummary[]']")[index].value.trim();
            const keywords = document.querySelectorAll("[name='headerKeywords[]']")[index].value.split(',').map(keyword => keyword.trim());
            const notes = document.querySelectorAll("[name='headerNotes[]']")[index].value.trim();

            jsonData.section2[`headline${index + 1}`] = { level, text, charCount, summary, keywords, notes };
        });

        fetch('/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonData),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('POST request failed');
            }
            return response.json();
        })
        .then(data => {
            startSSE('/events');
            document.getElementById('message').textContent = 'データが正常に送信されました。';
            document.getElementById('message').className = 'success';
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('message').textContent = '送信中にエラーが発生しました。';
            document.getElementById('message').className = 'error';
        });
    }
}

function startSSE(endpoint) {
    const eventSource = new EventSource(endpoint);
    const outputFrame = document.getElementById('outputFrame');

    eventSource.onmessage = function(event) {
        const data = JSON.parse(event.data);

        // 見出しを表示
        if (data.midashi) {
            const heading = document.createElement('h2');
            heading.textContent = data.midashi;
            outputFrame.appendChild(heading); // 見出しを即座に追加
        }

        // コンテンツを表示
        if (data.content) {
            // コンテンツのテキストをテキストノードとして追加
            const textNode = document.createTextNode(data.content + " "); // テキストの後にスペースを追加
            outputFrame.appendChild(textNode); // テキストノードを即座に追加
        }
    };

    eventSource.onerror = function(event) {
        console.error('SSE error:', event);
        eventSource.close(); // エラー発生時に接続を閉じる
    };

    eventSource.onclose = function(event) {
        console.log('SSE closed:', event);
    };
}




