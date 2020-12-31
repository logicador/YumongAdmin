import pymysql
import os
import shutil
import platform


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

    query = "SELECT * FROM t_place_blogs"
    cursor.execute(query)
    results = cursor.fetchall()

    for idx, result in enumerate(results):
        pb_id = result['pb_id']
        print('Start', pb_id, idx + 1, '/', len(results))
        pb_url = result['pb_url']

        res = 'MAINTAIN'

        if 'cafe.naver.com' in pb_url:
            res = 'REMOVE'
            pb_thumbnail = result['pb_thumbnail']
            shutil.rmtree('D:/YumongAdmin/public' + pb_thumbnail)

            query = "DELETE FROM t_place_blogs WHERE pb_id = %s"
            cursor.execute(query, (pb_id))
            conn.commit()
            
            break

        print('FINISH', pb_id, idx + 1, '/', len(results), res)


if __name__ == '__main__':
    main()