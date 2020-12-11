
const inputId = document.querySelector('.js-input-id');
const inputPassword = document.querySelector('.js-input-password');
const buttonLogin = document.querySelector('.js-button-login');


function initLogin() {

    buttonLogin.addEventListener('click', function() {
        let id = inputId.value.trim();
        let password = inputPassword.value.trim();

        if (id === '' || password === '') {
            alert('아이디 또는 비밀번호를 입력해주세요.');
            return;
        }

        fetch('/webapi/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: id,
                password: password
            })
        })
        .then(function(data) {
            return data.json();
        })
        .then(function(response) {
            if (response.status != 'OK') {
                alert('아이디 또는 비밀번호가 잘못되었습니다.');
                return;
            }
    
            location.href = '/';
        });
    });

}
initLogin();
