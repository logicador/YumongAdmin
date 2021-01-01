import pymysql
import os
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

    query = "SELECT * FROM t__places"
    cursor.execute(query)
    results = cursor.fetchall()

    for result in results:
        p_id = result['p_id']
        p_name = result['p_name']
        p_keywords = result['p_keywords']

        query = "UPDATE t__places SET p_keywords = %s WHERE p_id = %s"
        cursor.execute(query, (p_name + "|" + p_keywords, p_id))
        conn.commit()


if __name__ == '__main__':
    main()
