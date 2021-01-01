
const inputPlaceName = document.querySelector('.js-input-place-name');
const buttonSearchPlace = document.querySelector('.js-button-search-place');
const divPlaceList = document.querySelector('.js-div-place-list');
const selectParentLocation = document.querySelector('.js-select-parent-location');
const selectChildLocation = document.querySelector('.js-select-child-location');
const buttonMorePlace = document.querySelector('.js-button-more-place');
const divRowCount = document.querySelector('.js-div-row-count');
let page = 0;


function getPlaceList() {
    let pName = inputPlaceName.value.trim();
    let pLocCode = selectParentLocation.value;
    let cLocCode = selectChildLocation.value;

    if (pLocCode == '') pLocCode = 'ALL';
    if (cLocCode == '') cLocCode = 'ALL';

    fetch('/webapi/get/places?' + new URLSearchParams({
        pName: pName,
        pLocCode: pLocCode,
        cLocCode: cLocCode,
        page: page
    }))
    .then((data) => { return data.json(); })
    .then((response) => {
        if (response.status != 'OK') {
            alert('에러가 발생했습니다.');
            return;
        }

        let result = response.result;

        let totalCount = result.totalCount;
        let placeList = result.placeList;
        let html = '';
        for (let i = 0; i < placeList.length; i++) {
            let place = placeList[i];

            html += '<a href="javascript:void(0)"><div class="js-div-place place">';
            html +=     '<div class="image" style="background-image: url(http://yumong-admin.asuscomm.com' + place.p_thumbnail + '), url(/img/no_image.png);">';
            html +=         '<div class="count-wrapper image-cnt"><i class="fas fa-camera"></i>' + place.imageCnt + '</div>';
            html +=     '</div>';
            html +=     '<div class="desc-wrapper">';
            html +=         '<div class="blog-cnt-category-wrapper">';
            html +=             '<div class="count-wrapper blog-cnt"><i class="fas fa-blog"></i>' + place.blogCnt + '</div>';
            html +=             '<p class="category">' + place.p_category + '</p>';
            html +=         '</div>';
            html +=         '<p class="name">' + place.p_name + '</p>';
            html +=         '<p class="address">' + (place.p_road_address ? place.p_road_address : place.p_address) + '</p>';
            html +=         '<p class="phone">' + place.p_phone + '</p>';
            html +=         '<div class="id-count-list">';
            html +=             '<p>' + place.p_id + ', ' + place.p_n_id + '</p>';
            html +=             '<div class="count-wrapper"><i class="fas fa-route"></i>' + place.p_course_count + '</div>';
            html +=             '<div class="count-wrapper"><i class="fas fa-comment-alt-dots"></i>' + place.p_comment_count + '</div>';
            html +=             '<div class="count-wrapper"><i class="fas fa-thumbs-up"></i>' + place.p_up_count + '</div>';
            html +=             '<div class="count-wrapper"><i class="fas fa-thumbs-down"></i>' + place.p_down_count + '</div>';
            html +=         '</div>';
            html +=     '</div>';
            html += '</div></a>';
        }

        divRowCount.querySelector('span').innerText = intComma(totalCount);

        if (placeList.length > 0) {
            divPlaceList.insertAdjacentHTML('beforeend', html);

            // 마지막인지 확인
            if (totalCount == divPlaceList.querySelectorAll('.js-div-place').length) {
               buttonMorePlace.classList.add('hide');
            }
        } else {
            divPlaceList.innerHTML = '<div class="js-div-no-data no-data"><i class="fas fa-times-circle"></i>해당되는 플레이스가 없습니다.</div>';
        }

        // 마지막인지 확인 후 더보기 버튼 없애기
        if (totalCount == divPlaceList.querySelectorAll('.js-div-place').length) {
            buttonMorePlace.classList.add('hide');
        } else {
            if (buttonMorePlace.classList.contains('hide')) {
                buttonMorePlace.classList.remove('hide');
            }
        }
    });
}


function resetPlaceList() {
    divPlaceList.innerHTML = '';
    page = 0;
}


function initPlace() {
    getPlaceList();

    if (buttonSearchPlace) {
        buttonSearchPlace.addEventListener('click', () => {
            resetPlaceList();
            getPlaceList();
        });
    }

    if (selectParentLocation) {
        let html = '';
        html += '<option value="ALL" selected>전체 (ALL)</option>';
        for (let key in parentLocations) {
            let code = key;
            let name = parentLocations[key].name;
            html += '<option value="' + code + '">' + name + ' (' + code + ')</option>';
        }
        selectParentLocation.innerHTML = html;

        selectParentLocation.addEventListener('change', () => {
            let code = selectParentLocation.value;

            let html = '';
            html += '<option value="ALL" selected>전체 (ALL)</option>';

            if (code == 'ALL') {
                
            } else {
                let selectedChildLocations = childLocations[code];
                for (let i = 0; i < selectedChildLocations.length; i++) {
                    let childLocation = selectedChildLocations[i];
                    let code = childLocation.code;
                    let name = childLocation.name;
                    html += '<option value="' + code + '">' + name + ' (' + code + ')</option>';
                }
            }
            
            selectChildLocation.innerHTML = html;

            // let pLocCode = selectParentLocation.value;
            // let cLocCode = selectChildLocation.value;
            // getPlaceList(pLocCode, cLocCode);
        });
    }

    if (selectChildLocation) {
        let html = '<option value="ALL" selected>전체 (ALL)</option>';
        selectChildLocation.innerHTML = html;

        // selectChildLocation.addEventListener('change', () => {
        //     let pLocCode = selectParentLocation.value;
        //     let cLocCode = selectChildLocation.value;
        //     getPlaceList(pLocCode, cLocCode);
        // });
    }

    if (buttonMorePlace) {
        buttonMorePlace.addEventListener('click', () => {
            page++;
            getPlaceList();
        });
    }

}
initPlace();
