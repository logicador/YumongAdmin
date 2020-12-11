
const divLogout = document.querySelector('.js-div-logout');


function noneToDash(value) {
    if (isNone(value)) return '-';
    else return value;
}


function isNone(value) {
    if (typeof value == 'undefined' || value == null || value == '') return true;
    return false;
}


function initCommon() {

    if (divLogout) {
        divLogout.addEventListener('click', function() {
            if (!confirm('로그아웃 하시겠습니까?')) return;
    
            fetch('/webapi/logout', {
                method: 'POST'
            })
            .then(function(data) {
                return data.json();
            })
            .then(function(response) {
                if (response.status != 'OK') {
                    alert('에러가 발생했습니다.');
                    return;
                }
        
                location.href = '/login';
            });
        });
    }

}
initCommon();
