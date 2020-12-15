
const divLogout = document.querySelector('.js-div-logout');
const navSideMenu = document.querySelector('.js-nav-side-menu');
const divMobileMenu = document.querySelector('.js-div-mobile-menu');


function noneToDash(value) {
    if (isNone(value)) return '-';
    else return value;
}


function isNone(value) {
    if (typeof value == 'undefined' || value == null || value == '') return true;
    return false;
}


function toggleSideMenu() {
    let overlay = document.querySelector('.js-div-overlay');

    if (navSideMenu.classList.contains('mobile')) {
        overlay.remove();
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
                let overlay = document.querySelector('.js-div-overlay');
                overlay.remove();
                navSideMenu.classList.remove('mobile');
            }
        }
    });

    let cPNId = 'https://place.naver.com/place/11622274?entry=ple';
    let find = /\/.+\?/g.exec(cPNId);
    if (cPNId.indexOf('//m.') != -1) {
        find = /\/.+\/home\?/g.exec(cPNId);
    }

    console.log(find);
}
initCommon();
