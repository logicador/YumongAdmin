
const divLogout = document.querySelector('.js-div-logout');
const navSideMenu = document.querySelector('.js-nav-side-menu');
const divMobileMenu = document.querySelector('.js-div-mobile-menu');


function noneToDash(value) {
    if (isNone(value)) return '-';
    else return value;
}


function isNone(value) {
    if (typeof value == 'undefined' || value == null || value === '') return true;
    return false;
}


function intComma(value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


function toggleSideMenu() {
    if (navSideMenu.classList.contains('mobile')) {
        document.querySelector('.js-div-overlay').remove();
        navSideMenu.classList.remove('mobile');
    } else {
        let html = '<div class="js-div-overlay overlay" onclick="toggleSideMenu()"></div>';
        document.querySelector('body').insertAdjacentHTML('beforeend', html);
        navSideMenu.classList.add('mobile');
    }
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

    divMobileMenu.addEventListener('click', toggleSideMenu);

    window.addEventListener('resize', function() {
        let width = document.body.clientWidth;
        
        if (width > 800) {
            if (navSideMenu.classList.contains('mobile')) {
                document.querySelector('.js-div-overlay').remove();
                navSideMenu.classList.remove('mobile');
            }
        }
    });
}
initCommon();
