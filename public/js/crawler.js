
const divCrawlingBox = document.querySelector('.js-div-crawling-box');
const inputCPNId = document.querySelector('.js-input-c-p-n-id');
const buttonStartCrawling = document.querySelector('.js-button-start-crawling');
const divCrawlerList = document.querySelector('.js-div-crawler-list');
const selectStatus = document.querySelector('.js-select-status');


function startCrawling() {
    let cPNId = inputCPNId.value.trim();
    if (cPNId === '') {
        alert('네이버 Place 아이디를 입력해주세요.');
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
        getCrawlers();
    });
}


function getCrawlers() {
    fetch('/webapi/get/crawlers?' + new URLSearchParams({
        cStatus: selectStatus.value
    }))
    .then(function(data) { return data.json(); })
    .then(function(response) {
        if (response.status != 'OK') {
            alert('에러가 발생했습니다.');
            return;
        }

        let crawlerList = response.result;
        let html = '';
        for (let i = 0; i < crawlerList.length; i++) {
            let crawler = crawlerList[i];
            html += getCrawlerHtml(crawler);
        }

        if (crawlerList.length > 0) {
            divCrawlerList.insertAdjacentHTML('beforeend', html);
            // 원래 no-data가 updateCrawlers에 의해 있을 수 있으니 제거한다.
            // setInterval 시간과 맞물리면 존재할수도 있음
            if (divCrawlerList.querySelector('.js-div-no-data')) {
                divCrawlerList.querySelector('.js-div-no-data').remove();
            }
        }
        else divCrawlerList.innerHTML = '<div class="js-div-no-data no-data"><i class="fas fa-times-circle"></i>해당되는 크롤러가 없습니다.</div>';
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
            divCrawlerList.innerHTML = '<div class="js-div-no-data no-data"><i class="fas fa-times-circle"></i>해당되는 크롤러가 없습니다.</div>';
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
            let pCreatedDateValue = divCrawler.querySelector('.created-date').querySelector('.value');
            let pUpdatedDateValue = divCrawler.querySelector('.updated-date').querySelector('.value');

            // update value
            divProgress.style.width = ((crawler.c_progress < 10) ? '' : crawler.c_progress + '%');
            divProgressSpan.innerText = crawler.c_progress + '%';
            pNIdValue.innerText = crawler.c_p_n_id;
            pNameValue.innerText = crawler.c_p_name;
            pCategoryValue.innerText = crawler.c_p_category;
            pAddressValue.innerText = crawler.c_p_address;
            pCreatedDateValue.innerText = crawler.c_created_date;
            pUpdatedDateValue.innerText = crawler.c_updated_date;
        }
    });
}


function getCrawlerHtml(crawler) {
    let html = '';
    html += '<div c_id="' + crawler.c_id + '" class="js-div-crawler crawler test">';
        if (crawler.c_status == 'RUNNING') {
            html += '<div class="progress" style="width: ' + ((crawler.c_progress < 10) ? '' : crawler.c_progress + '%') + '"><span>' + crawler.c_progress + '%</span></div>';
        }
        html += '<div class="rows">';
            html += '<div class="row"><p class="col">ID</p>';
                html += '<p class="value">' + crawler.c_id + '</p>';
            html += '</div>';
            html += '<div class="row nid"><p class="col">NID</p>';
                html += '<p class="value">' + crawler.c_p_n_id + '</p>';
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
            html += '<div class="row created-date"><p class="col">CREATED</p>';
                html += '<p class="value">' + crawler.c_created_date + '</p>';
            html += '</div>';
            html += '<div class="row updated-date"><p class="col">UPDATED</p>';
                html += '<p class="value">' + crawler.c_updated_date + '</p>';
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


function initCrawler() {

    buttonStartCrawling.addEventListener('click', startCrawling);

    selectStatus.addEventListener('change', function() {
        divCrawlerList.innerHTML = '';
        getCrawlers();
    });

    getCrawlers();

    // RUNNING 일 경우 progress update를 위해 interval 호출
    setInterval(function() {
        if (selectStatus.value != 'RUNNING') return;
        updateCrawlers();
    }, 500);
}


initCrawler();
