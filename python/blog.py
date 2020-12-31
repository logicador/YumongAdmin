import sys
import requests
import pymysql
import os
import random
import traceback
import time
import shutil
import platform
from itertools import count
from datetime import date, timedelta, datetime


def get_user_agent():
    ret = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
    with open(os.path.expanduser(get_env_path()), 'r') as f:
        lines = f.readlines()
        for line in lines:
            if 'USER_AGENT' in lines:
                ret = line.split('=')[1].replace('\n', '')
                break
    return ret


def get_env_path():
    env_path = 'D:/YumongAdmin/.env'
    if 'macOS' in platform.platform(): env_path = '~/VSCodeProjects/YumongAdmin/.env'
    return env_path


def generate_random_id():
    return datetime.now().strftime("%y%m%d%H%M%S") + str(random.randrange(1, 9999)).zfill(4)


def get_random_sleep():
    return random.randrange(5, 21) * 0.1


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


def main():
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

    query = "SELECT * FROM t__places as pTab LEFT JOIN (SELECT pb_p_id, COUNT(*) as pbCnt FROM t_place_blogs GROUP BY pb_p_id) AS pbTab ON pTab.p_id = pbTab.pb_p_id"
    cursor.execute(query)
    results = cursor.fetchall()

    for result in results:
        pbCnt = result['pbCnt']
        
        if pbCnt: continue

        user_agent = get_user_agent()
        p_id = str(result['p_id'])
        p_n_id = str(result['p_n_id'])
        
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
            if len(items) == 0: break
            
            for item in items:
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

                blog = [
                    p_id,
                    item['title'],
                    item['name'],
                    item['contents'],
                    item['url'],
                    pb_thumbnail,
                    writed_date.strftime("%Y-%m-%d"),
                    str(item)
                ]
                blog_list.append(blog)

        # MYSQL INSERT 블로그
        query = """
            INSERT INTO t_place_blogs 
                (pb_p_id, pb_title, pb_name, pb_contents, pb_url, pb_thumbnail, pb_writed_date, pb_data) 
            VALUES 
                (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.executemany(query, blog_list)
        conn.commit()


if __name__ == '__main__':
    main()

