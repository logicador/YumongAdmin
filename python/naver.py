import sys
import requests
import pymysql
import os
import json
import random
import traceback
import time
import shutil
import platform
from itertools import count
from datetime import date, timedelta, datetime


def get_env_path():
    env_path = 'D:/YumongAdmin/.env'
    if 'macOS' in platform.platform(): env_path = '~/VSCodeProjects/YumongAdmin/.env'
    return env_path


def get_mysql_info():
    ret = {
        'MYSQL_USER': '',
        'MYSQL_PASSWORD': '',
        'MYSQL_DATABASE': '',
        'MYSQL_HOST': '',
        'MYSQL_PORT': ''
    }
    with open(os.path.expanduser(get_env_path()), 'r') as f:
        lines = f.readlines()
        for line in lines:
            if 'MYSQL_USER' in line: ret['MYSQL_USER'] = line.split('=')[1].replace('\n', '')
            elif 'MYSQL_PASSWORD' in line: ret['MYSQL_PASSWORD'] = line.split('=')[1].replace('\n', '')
            elif 'MYSQL_DATABASE' in line: ret['MYSQL_DATABASE'] = line.split('=')[1].replace('\n', '')
            elif 'MYSQL_HOST' in line: ret['MYSQL_HOST'] = line.split('=')[1].replace('\n', '')
            elif 'MYSQL_PORT' in line: ret['MYSQL_PORT'] = line.split('=')[1].replace('\n', '')
    return ret


def get_user_agent():
    ret = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
    with open(os.path.expanduser(get_env_path()), 'r') as f:
        lines = f.readlines()
        for line in lines:
            if 'USER_AGENT' in lines:
                ret = line.split('=')[1].replace('\n', '')
                break
    return ret


def generate_random_id():
    return datetime.now().strftime("%y%m%d%H%M%S") + str(random.randrange(1, 9999)).zfill(4)


def get_random_sleep():
    return random.randrange(5, 21) * 0.1


def main(argv):
    # MySQL Connection Settings
    mysql_info = get_mysql_info()
    conn = pymysql.connect(
        host=mysql_info['MYSQL_HOST'],
        user=mysql_info['MYSQL_USER'],
        passwd=mysql_info['MYSQL_PASSWORD'],
        db=mysql_info['MYSQL_DATABASE'],
        port=int(mysql_info['MYSQL_PORT']),
        charset='utf8'
    )
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    progress = 0

    c_id = argv[1]

    # 크롤러 가져오기
    query = "SELECT * FROM t_crawlers WHERE c_id = %s"
    cursor.execute(query, (c_id))
    results = cursor.fetchall()

    c_p_n_id = str(results[0]['c_p_n_id'])

    # MYSQL SELECT 크롤러 중복 확인용
    # FINISHED와 RUNNING인 Place라면 크롤링 중지
    query = "SELECT * FROM t_crawlers WHERE c_p_n_id = %s AND (c_status LIKE 'FINISHED' OR c_status LIKE 'RUNNING')"
    cursor.execute(query, (c_p_n_id))
    results = cursor.fetchall()

    c_status = 'RUNNING'
    # 크롤러가 단 한개만 있어야 함.
    if len(results) > 1: c_status = 'DUPLICATED'

    # 중복된 데이터면 크롤링 진행 중지
    if c_status == 'DUPLICATED':
        query = "UPDATE t_crawlers SET c_status = 'DUPLICATED', c_updated_date = NOW() WHERE c_id = %s"
        cursor.execute(query, (c_id))
        conn.commit()
        return

    user_agent = get_user_agent()

    try:
        # Request
        url = 'https://map.naver.com/v5/api/sites/summary/' + c_p_n_id
        params = { 'lang': 'ko' }
        headers = {
            'user-agent': user_agent,
            'referer': 'https://map.naver.com/',
            'expires': 'Sat, 01 Jan 2000 00:00:00 GMT',
            'pragma': 'no-cache',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin'
        }
        time.sleep(get_random_sleep())

        while True:
            response = requests.get(url, params=params, headers=headers)
            if response.status_code == 200: break
            time.sleep(10) # 10초 대기

        response = response.json()
        n_place = response

        try: del n_place['previewImages']
        except: pass
        try: del n_place['datalab']['popularity']
        except: pass
        try: del n_place['datalab']['alsosearched']
        except: pass

        p_n_id = c_p_n_id
        try: p_n_id = str(n_place['id'])
        except:
            # 없는 Place
            query = "UPDATE t_crawlers SET c_status = %s, c_updated_date = NOW() WHERE c_id = %s"
            cursor.execute(query, ('NO_PLACE', c_id))
            conn.commit()
            return
        
        c_p_name = n_place['name']
        c_p_category = n_place['category']
        address = n_place['fullAddress']
        try: road_address = n_place['fullRoadAddress']
        except: road_address = ''
        c_p_address = road_address if road_address else address
                
        # MYSQL UPDATE 크롤러 정보
        query = """
            UPDATE t_crawlers SET 
                c_p_name = %s, 
                c_p_category = %s, 
                c_p_address = %s, 
                c_updated_date = NOW() 
            WHERE c_id = %s
        """
        cursor.execute(query, (c_p_name, c_p_category, c_p_address, c_id))
        conn.commit()

        p_name = c_p_name
        p_keywords = c_p_name + "|" + p_name.replace(' ', '')
        p_category = c_p_category

        p_thumbnail = ''
        images = n_place['images']
        # if len(images) > 0: p_thumbnail = images[0]['url']

        p_latitude = n_place['y']
        p_longitude = n_place['x']
        p_address = address
        p_road_address = road_address
        p_phone = n_place['phone']
        try: del n_place['images']
        except: pass
        p_data = str(n_place)

        splited_address = p_address.split(' ')
        splited_road_address = p_road_address.split(' ')
        p_ploc_code = ''
        p_cloc_code = ''

        parent_locations = dict()
        location_dir = 'D:/YumongAdmin/python/'
        if 'macOS' in platform.platform(): location_dir = '~/VSCodeProjects/YumongAdmin/python/'
        with open(os.path.expanduser(location_dir + 'parent_location.json'), encoding='utf-8') as f:
            parent_locations = json.load(f)

        # 부모 지역코드 세팅
        for key, value in parent_locations.items():
            if len(splited_address) == 0: break
            
            pname = splited_address[0]

            code = key
            name = value['name']
            mname = value['mname']
            sname = value['sname']

            if name == pname or mname == pname or sname == pname:
                p_ploc_code = code
                break

        if p_ploc_code == '':
            for key, value in parent_locations.items():
                if len(splited_road_address) == 0: break
                
                pname = splited_road_address[0]

                code = key
                name = value['name']
                mname = value['mname']
                sname = value['sname']

                if name == pname or mname == pname or sname == pname:
                    p_ploc_code = code
                    break

        if p_ploc_code != '':
            child_locations = dict()
            with open(os.path.expanduser(location_dir + 'child_location.json'), encoding='utf-8') as f:
                child_locations = json.load(f)
            selected_child_locations = child_locations[p_ploc_code]
            # 자식 지역코드 세팅
            for cloc in selected_child_locations:
                if len(splited_address) == 0: break

                cname = splited_address[1]

                code = cloc['code']
                name = cloc['name']
                sname = cloc['sname']
                
                if name == cname or sname == cname:
                    p_cloc_code = code
                    break

            if p_cloc_code == '':
                for cloc in selected_child_locations:
                    if len(splited_road_address) == 0: break

                    cname = splited_road_address[1]

                    code = cloc['code']
                    name = cloc['name']
                    sname = cloc['sname']
                    
                    if name == cname or sname == cname:
                        p_cloc_code = code
                        break

        # MYSQL INSERT 플레이스
        query = """
            INSERT INTO t__places 
                (p_n_id, p_name, p_keywords, p_category, p_thumbnail, p_latitude, p_longitude, 
                p_geometry, p_address, p_road_address, p_phone, p_ploc_code, p_cloc_code, p_data) 
            VALUES 
                (%s, %s, %s, %s, %s, %s, POINT(%s, %s), %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (p_n_id, p_name, p_keywords, p_category, p_thumbnail, p_latitude, p_longitude, p_longitude, p_latitude, p_address, p_road_address, p_phone, p_ploc_code, p_cloc_code, p_data))
        conn.commit()

        p_id = cursor.lastrowid

        # MYSQL UPDATE 썸네일
        query = "UPDATE t__places SET p_thumbnail = '/images/places/%s/thumbnail.jpg' WHERE p_id = %s"
        cursor.execute(query, (p_id, p_id))
        conn.commit()

        progress = 10
        query = "UPDATE t_crawlers SET c_progress = %s, c_updated_date = NOW() WHERE c_id = %s"
        cursor.execute(query, (progress, c_id))
        conn.commit()

        # Start 이미지

        os.mkdir('public/images/places/' + str(p_id))
        os.mkdir('public/images/places/' + str(p_id) + '/blog')
        image_list = list()
        is_set_thumbnail = False
        for image in images:
            url = image['url']

            if not 'ldb-phinf' in url: continue

            # Request
            headers = {
                'user-agent': user_agent,
                'referer': 'https://map.naver.com/',
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': 'none',
                'sec-fetch-user': '?1',
                'upgrade-insecure-requests': '1'
            }
            time.sleep(get_random_sleep())

            while True:
                response = requests.get(url, headers=headers)
                if response.status_code == 200 or response.status_code == 404: break
                time.sleep(10)

            if response.status_code == 404: continue

            image_path = '/images/places/' + str(p_id) + '/' +  generate_random_id() + '.jpg'
            image_file = open('public' + image_path, 'wb')
            image_file.write(response.content)
            image_file.close()

            # 썸네일 이미지 저장
            if not is_set_thumbnail:
                thumb_image_path = '/images/places/' + str(p_id) + '/thumbnail.jpg'
                thumb_image_file = open('public' + thumb_image_path, 'wb')
                thumb_image_file.write(response.content)
                thumb_image_file.close()
                is_set_thumbnail = True

            image_list.append([p_id, image_path])
            progress += 30 / len(images)
            query = "UPDATE t_crawlers SET c_progress = %s, c_image_count = c_image_count + 1, c_updated_date = NOW() WHERE c_id = %s"
            cursor.execute(query, (progress, c_id))
            conn.commit()

        query = """
            INSERT INTO t_place_images 
                (pi_p_id, pi_image) 
            VALUES 
                (%s, %s)
        """
        cursor.executemany(query, image_list)
        conn.commit()

        # End 이미지

        # Progress 40%


        # Start 블로그 후기

        # Request
        url = 'https://pcmap-api.place.naver.com/graphql'
        today = date.today().strftime("%Y%m%d")
        headers = {
            'user-agent': user_agent,
            'referer': 'https://pcmap.place.naver.com/place/' + p_n_id + '/review/ugc?entry=pll&from=map&ts=' + today,
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site'
        }

        blog_list = list()
        for page in count():
            data = [{"operationName":"getFsasReviews","variables":{"input":{"businessId":p_n_id,"businessType":"place","page":page,"display":10,"deviceType":"mobile","query":None}},"query":"query getFsasReviews($input: FsasReviewsInput) {\n  fsasReviews(input: $input) {\n    ...FsasReviews\n    __typename\n  }\n}\n\nfragment FsasReviews on FsasReviewsResult {\n  total\n  maxItemCount\n  items {\n    name\n    type\n    typeName\n    url\n    home\n    id\n    title\n    rank\n    contents\n    bySmartEditor3\n    hasNaverReservation\n    thumbnailUrl\n    date\n    thumbnailCount\n    isOfficial\n    isRepresentative\n    profileImageUrl\n    isVideoThumbnail\n    __typename\n  }\n  __typename\n}\n"}]
            time.sleep(get_random_sleep())

            while True:
                response = requests.post(url, json=data, headers=headers)
                if response.status_code == 200: break
                time.sleep(10)

            response = response.json()

            items = response[0]['data']['fsasReviews']['items']
            maxItemCount = int(response[0]['data']['fsasReviews']['maxItemCount'])
            if len(items) == 0: break
            
            for item in items:
                # 카페 수집 X
                if item['type'] == 'cafe': continue

                writed_date_splited = item['date'].split('.')

                if len(writed_date_splited) > 1:
                    writed_date = date(int(writed_date_splited[0]), int(writed_date_splited[1]), int(writed_date_splited[2]))
                else:
                    diff = int(writed_date_splited[0][0])
                    writed_date = date.today() - timedelta(diff)

                pb_thumbnail = '' 
                
                # 블로그 이미지 가져오기
                # Request
                _url = item['thumbnailUrl']

                # 블로그 썸네일이 있으면 다운로드
                if _url:
                    time.sleep(get_random_sleep())

                    while True:
                        _response = requests.get(_url, headers={ 'user-agent': user_agent })
                        if _response.status_code == 200 or _response.status_code == 404: break
                        time.sleep(10)

                    if _response.status_code == 200:
                        pb_thumbnail = '/images/places/' + str(p_id) + '/blog/' + generate_random_id() + '.jpg'
                        image_file = open('public' + pb_thumbnail, 'wb')
                        image_file.write(_response.content)
                        image_file.close()

                        query = "UPDATE t_crawlers SET c_image_count = c_image_count + 1, c_updated_date = NOW() WHERE c_id = %s"
                        cursor.execute(query, (c_id))
                        conn.commit()

                blog = [
                    p_id,
                    item['title'],
                    item['name'],
                    item['contents'],
                    item['url'],
                    pb_thumbnail,
                    writed_date.strftime("%Y-%m-%d")
                ]
                blog_list.append(blog)

                progress += 60 / maxItemCount
                if progress > 99: progress = 99
                query = "UPDATE t_crawlers SET c_progress = %s, c_blog_count = c_blog_count + 1, c_updated_date = NOW() WHERE c_id = %s"
                cursor.execute(query, (progress, c_id))
                conn.commit()

        # MYSQL INSERT 블로그
        query = """
            INSERT INTO t_place_blogs 
                (pb_p_id, pb_title, pb_name, pb_contents, pb_url, pb_thumbnail, pb_writed_date) 
            VALUES 
                (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.executemany(query, blog_list)
        conn.commit()

        # End 블로그 후기

        query = "UPDATE t_crawlers SET c_progress = %s, c_status = %s, c_updated_date = NOW() WHERE c_id = %s"
        cursor.execute(query, (100, 'FINISHED', c_id))
        conn.commit()

    # 수집 중 에러 발생
    except Exception as e:
        print(e)

        # 크롤러 에러 처리
        query = "UPDATE t_crawlers SET c_progress = %s, c_status = %s, c_error_log = %s, c_updated_date = NOW() WHERE c_id = %s"
        cursor.execute(query, (0, 'ERROR', traceback.format_exc(), c_id))
        conn.commit()

        # 플레이스 지우기
        query = "DELETE FROM t__places WHERE p_id = %s"
        cursor.execute(query, (p_id))
        conn.commit()

        # 블로그 지우기 (사실상 가장 마지막에 블로그를 insert 하기 때문에 안해줘도 되긴 함)
        query = "DELETE FROM t_place_blogs WHERE pb_p_id = %s"
        cursor.execute(query, (p_id))
        conn.commit()

        # 이미지 지우기
        query = "DELETE FROM t_place_images WHERE pi_p_id = %s"
        cursor.execute(query, (p_id))
        conn.commit()

        # 폴더 삭제 (rmdir은 하위파일 등이 삭제가 잘 안됨)
        shutil.rmtree('public/images/places/' + str(p_id))


if __name__ == '__main__':
    main(sys.argv)
