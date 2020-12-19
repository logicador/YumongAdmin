
const html = document.querySelector('html');
const divCrawlingBox = document.querySelector('.js-div-crawling-box');
const inputCPNId = document.querySelector('.js-input-c-p-n-id');
const buttonStartCrawling = document.querySelector('.js-button-start-crawling');
const divCrawlerList = document.querySelector('.js-div-crawler-list');
const selectStatus = document.querySelector('.js-select-status');
const buttonMoreCrawler = document.querySelector('.js-button-more-crawler');
const divRowCount = document.querySelector('.js-div-row-count');
// let isEndOfCrawler = false;
let page = 0;


function startCrawling() {
    let cPNId = inputCPNId.value.trim();
    if (cPNId === '') {
        alert('네이버 Place 아이디를 입력해주세요.');
        return;
    }

    // http가 포함되었다면 (url이라면)
    if (cPNId.indexOf('http') != -1) {
        let find = /\/.+\?/g.exec(cPNId); // '/' '?' 사이의 문자열 탐색
        let reversed = [];
        if (find) {
            find = find[0]; // 찾은 문자열 0번방에 있음
        } else {
            alert('올바르지 않은 입력값입니다.');
            return;
        }

        // 모바일 url의 경우 '/' 를 두번 걸러야하기 때문에 flag로 확인
        let mFlag = true;
        if (find.indexOf('m.place.naver.com') != -1) mFlag = false;
        // 뒤에서부터 돌면서 ?, h, o, m, e 거름
        for (let i = find.length - 1; i > 0; i--) {
            let n = find[i];
            if (n == '?' || n == 'h' || n == 'o' || n == 'm' || n == 'e') continue;

            if (mFlag) {
                if (n == '/') break;
            } else { // 모바일일 경우 '/' 한번 더
                if (n == '/') continue;
                mFlag = true;
            }
            
            reversed.push(n);
        }
        // 반복문을 뒤로 돌리며 push하였기때문에 reverse()해줌
        cPNId = reversed.reverse().join('');
    }

    // 숫자인지 체크 (정규식)
    if (!/^[0-9]*$/.test(cPNId)) {
        alert('올바르지 않은 입력값입니다.');
        return;
    }

    fetch('/webapi/start/crawling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            cPNId: cPNId
        })
    })
    .then(function(data) { return data.json(); })
    .then(function(response) {
        if (response.status != 'OK') {
            alert('에러가 발생했습니다.');
            return;
        }

        inputCPNId.value = '';
        selectStatus.value = 'RUNNING';
        divCrawlerList.innerHTML = '';
        // isEndOfCrawler = false;
        page = 0;
        getCrawlers();
    });
}


function getCrawlers() {
    fetch('/webapi/get/crawlers?' + new URLSearchParams({
        cStatus: selectStatus.value,
        page: page
    }))
    .then(function(data) { return data.json(); })
    .then(function(response) {
        if (response.status != 'OK') {
            alert('에러가 발생했습니다.');
            return;
        }

        let result = response.result;

        let totalCount = result.totalCount;
        let crawlerList = result.crawlerList;
        let html = '';
        for (let i = 0; i < crawlerList.length; i++) {
            let crawler = crawlerList[i];
            html += getCrawlerHtml(crawler);
        }

        divRowCount.querySelector('span').innerText = intComma(totalCount);

        if (crawlerList.length > 0) {
            divCrawlerList.insertAdjacentHTML('beforeend', html);

            // 마지막인지 확인 (인피니티 스크롤 비활성화 위함)
            // if (totalCount == divCrawlerList.querySelectorAll('.js-div-crawler').length) {
            //     isEndOfCrawler = true;
            // }
            if (totalCount == divCrawlerList.querySelectorAll('.js-div-crawler').length) {
               buttonMoreCrawler.classList.add('hide');
            }

            // 원래 no-data가 updateCrawlers에 의해 있을 수 있으니 제거한다.
            // setInterval 시간과 맞물리면 존재할수도 있음
            if (divCrawlerList.querySelector('.js-div-no-data')) {
                divCrawlerList.querySelector('.js-div-no-data').remove();
            }

            divCrawlerList.querySelectorAll('.js-div-crawler').forEach(function(divCrawler) {
                if (divCrawler.querySelector('.js-div-remove')) {
                    divCrawler.querySelector('.js-div-remove').addEventListener('click', function() {
                        divCrawler.remove();
    
                        if (divCrawlerList.querySelectorAll('.js-div-crawler').length == 0) {
                            buttonMoreCrawler.classList.add('hide');
                            divCrawlerList.innerHTML = getNoDataHtml();
                        }
    
                        fetch('/webapi/remove/crawler', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                cId: divCrawler.getAttribute('c_id')
                            })
                        })
                        .then(function(data) { return data.json(); })
                        .then(function(response) { });
                    });
                }
            });
        } else {
            divCrawlerList.innerHTML = getNoDataHtml();
        }

        // 마지막인지 확인 후 더보기 버튼 없애기
        if (totalCount == divCrawlerList.querySelectorAll('.js-div-crawler').length) {
            buttonMoreCrawler.classList.add('hide');
        } else {
            if (buttonMoreCrawler.classList.contains('hide')) {
                buttonMoreCrawler.classList.remove('hide');
            }
        }
    });
}


function updateCrawlers() {
    let cIdList = [];
    divCrawlerList.querySelectorAll('.js-div-crawler').forEach(function(divCrawler) {
        cIdList.push(divCrawler.getAttribute('c_id'));
    });

    // RUNNING 상태인 크롤러가 없음.
    if (cIdList.length == 0) {
        if (!divCrawlerList.querySelector('.js-div-no-data')) {
            divCrawlerList.innerHTML = getNoDataHtml();
        }
        return;
    }

    fetch('/webapi/get/crawler/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            cIdList: cIdList
        })
    })
    .then(function(data) { return data.json(); })
    .then(function(response) {
        if (response.status != 'OK') return;

        let crawlerList = response.result;
        for (let i = 0; i < crawlerList.length; i++) {
            let crawler = crawlerList[i];
            let divCrawler = divCrawlerList.querySelector('.js-div-crawler[c_id="' + crawler.c_id + '"]');
            
            // RUNNING이 아닌 크롤러 제거
            if (crawler.c_status != 'RUNNING') { divCrawler.remove(); }
            
            let divProgress = divCrawler.querySelector('.progress');
            let divProgressSpan = divProgress.querySelector('span');
            let pNIdValue = divCrawler.querySelector('.nid').querySelector('.value');
            let pNameValue = divCrawler.querySelector('.name').querySelector('.value');
            let pCategoryValue = divCrawler.querySelector('.category').querySelector('.value');
            let pAddressValue = divCrawler.querySelector('.address').querySelector('.value');
            let pBlogCountValue = divCrawler.querySelector('.blog-count').querySelector('.value');
            let pImageCountValue = divCrawler.querySelector('.image-count').querySelector('.value');
            let pCreatedDateValue = divCrawler.querySelector('.created-date').querySelector('.value');
            let pUpdatedDateValue = divCrawler.querySelector('.updated-date').querySelector('.value');

            // update value
            divProgress.style.width = ((crawler.c_progress < 10) ? '' : crawler.c_progress + '%');
            divProgressSpan.innerText = crawler.c_progress + '%';
            pNIdValue.innerText = crawler.c_p_n_id;
            pNameValue.innerText = crawler.c_p_name;
            pCategoryValue.innerText = crawler.c_p_category;
            pAddressValue.innerText = crawler.c_p_address;
            pBlogCountValue.innerText = crawler.c_blog_count;
            pImageCountValue.innerText = crawler.c_image_count;
            pCreatedDateValue.innerText = crawler.c_created_date;
            pUpdatedDateValue.innerText = crawler.c_updated_date;
        }

        divRowCount.querySelector('span').innerText = intComma(crawlerList.length);
    });
}


function getCrawlerHtml(crawler) {
    let html = '';
    html += '<div c_id="' + crawler.c_id + '" class="js-div-crawler crawler test">';
        if (crawler.c_status == 'RUNNING') {
            html += '<div class="progress" style="width: ' + ((crawler.c_progress < 10) ? '' : crawler.c_progress + '%') + '"><span>' + crawler.c_progress + '%</span></div>';
        } else if (crawler.c_status == 'DUPLICATED' || crawler.c_status == 'NO_PLACE' || crawler.c_status == 'ERROR') {
            html += '<div class="js-div-remove remove"><i class="fal fa-times"></i></div>';
        }
        // html += '<div class="js-div-remove remove"><i class="fal fa-times"></i></div>';
        html += '<div class="rows">';
            html += '<div class="row"><p class="col">ID</p>';
                html += '<p class="value">' + crawler.c_id + '</p>';
            html += '</div>';
            html += '<div class="row nid"><p class="col">NID</p>';
                html += '<p class="value">' + noneToDash(crawler.c_p_n_id) + '</p>';
            html += '</div>';
            html += '<div class="row name"><p class="col">NAME</p>';
                html += '<p class="value">' + noneToDash(crawler.c_p_name) + '</p>';
            html += '</div>';
            html += '<div class="row category"><p class="col">CATEGORY</p>';
                html += '<p class="value">' + noneToDash(crawler.c_p_category) + '</p>';
            html += '</div>';
            html += '<div class="row address"><p class="col">ADDRESS</p>';
                html += '<p class="value">' + noneToDash(crawler.c_p_address) + '</p>';
            html += '</div>';
            html += '<div class="row status"><p class="col">STATUS</p>';
                html += '<p class="value" c_status="' + crawler.c_status + '">' + crawler.c_status + '</p>';
            html += '</div>';
            html += '<div class="row blog-count"><p class="col">BLOG</p>';
                html += '<p class="value">' + intComma(crawler.c_blog_count) + '</p>';
            html += '</div>';
            html += '<div class="row image-count"><p class="col">IMAGE</p>';
                html += '<p class="value">' + intComma(crawler.c_image_count) + '</p>';
            html += '</div>';
            html += '<div class="row created-date"><p class="col">CREATED</p>';
                html += '<p class="value">' + crawler.c_created_date + '</p>';
            html += '</div>';
            html += '<div class="row updated-date"><p class="col">UPDATED</p>';
                html += '<p class="value">' + crawler.c_updated_date + '</p>';
            html += '</div>';
            html += '<div class="row admin"><p class="col">ADMIN</p>';
                html += '<p class="value">' + crawler.c_admin + '</p>';
            html += '</div>';
        html += '</div>';
        if (crawler.c_status == 'ERROR') {
            html += '<div class="error">';
                html += crawler.c_error_log;
            html += '</div>';
        }
        if (crawler.c_status == 'FINISHED') {
            html += '<a href="javascript:void(0)"><div class="place">' + crawler.c_p_name + ' 보러가기<i class="fas fa-chevron-right"></i></div></a>';
        }
    html += '</div>';
    return html;
}


function getNoDataHtml() {
    return '<div class="js-div-no-data no-data"><i class="fas fa-times-circle"></i>해당되는 크롤러가 없습니다.</div>';
}


function initCrawler() {

    buttonStartCrawling.addEventListener('click', startCrawling);

    selectStatus.addEventListener('change', function() {
        divCrawlerList.innerHTML = '';
        // isEndOfCrawler = false;
        page = 0;
        getCrawlers();
    });

    // RUNNING 일 경우 progress update를 위해 interval 호출
    setInterval(function() {
        if (selectStatus.value != 'RUNNING') return;
        updateCrawlers();
    }, 500);

    // window.addEventListener('scroll', function() {
    //     if (html.scrollTop + html.clientHeight >= html.scrollHeight && !isEndOfCrawler) {
    //         page++;
    //         getCrawlers();
    //     }
    // });

    buttonMoreCrawler.addEventListener('click', function() {
        page++;
        getCrawlers();
    });

    getCrawlers();
}


initCrawler();
