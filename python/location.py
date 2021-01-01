import pymysql
import json
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
    parent_locations = dict()
    child_locations = dict()
    with open(os.path.expanduser('~/VSCodeProjects/YumongAdmin/python/parent_location.json'), encoding='utf-8') as f:
        parent_locations = json.load(f)
    with open(os.path.expanduser('~/VSCodeProjects/YumongAdmin/python/child_location.json'), encoding='utf-8') as f:
        child_locations = json.load(f)
    
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
        p_address = result['p_address']
        p_road_address = result['p_road_address']

        splited_address = p_address.split(' ')
        splited_road_address = p_road_address.split(' ')

        p_parent_location_code = ''
        p_child_location_code = ''
        
        for key, value in parent_locations.items():
            if len(splited_address) == 0: break
            
            pname = splited_address[0]

            code = key
            name = value['name']
            mname = value['mname']
            sname = value['sname']

            if name == pname or mname == pname or sname == pname:
                p_parent_location_code = code
                break

        if p_parent_location_code == '':
            for key, value in parent_locations.items():
                if len(splited_road_address) == 0: break
                
                pname = splited_road_address[0]

                code = key
                name = value['name']
                mname = value['mname']
                sname = value['sname']

                if name == pname or mname == pname or sname == pname:
                    p_parent_location_code = code
                    break

        # 부모 지역코드 못찾음...
        if p_parent_location_code == '': continue

        selected_child_locations = child_locations[p_parent_location_code]
        
        for cloc in selected_child_locations:
            if len(splited_address) == 0: break

            cname = splited_address[1]

            code = cloc['code']
            name = cloc['name']
            sname = cloc['sname']
            
            if name == cname or sname == cname:
                p_child_location_code = code
                break

        if p_child_location_code == '':
            for cloc in selected_child_locations:
                if len(splited_road_address) == 0: break

                cname = splited_road_address[1]

                code = cloc['code']
                name = cloc['name']
                sname = cloc['sname']
                
                if name == cname or sname == cname:
                    p_child_location_code = code
                    break

        query = "UPDATE t__places SET p_ploc_code = %s, p_cloc_code = %s WHERE p_id = %s"
        cursor.execute(query, (p_parent_location_code, p_child_location_code, p_id))
        conn.commit()


if __name__ == "__main__":
    main()
