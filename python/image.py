from PIL import Image
import os
import shutil


# 사진들 


def resize(originpath, resizepath):
    p = 0
    while True:
        filesize = os.path.getsize(os.path.expanduser(resizepath))
        if filesize > 200000:
            p = p + 2
            Image.MAX_IMAGE_PIXELS = None
            im = Image.open(os.path.expanduser(originpath))
            w, h = im.size
            rw = int(w * ((100 - p) / 100))
            rh = int(h * ((100 - p) / 100))
            rim = im.resize((rw, rh), Image.ANTIALIAS)
            rim.convert('RGB').save(os.path.expanduser(resizepath), 'JPEG', quality=95)
        else: break


def main():
    dirname = 'D:/YumongAdmin/python/'
    filename = 'ey2.jpg'
    rfilename = filename
    filesize = os.path.getsize(os.path.expanduser(dirname + filename))
    p = 0

    while True:
        filesize = os.path.getsize(os.path.expanduser(dirname + rfilename))
        if filesize > 200000:
            p = p + 5

            rfilename = 'rey2.jpg'

            im = Image.open(os.path.expanduser(dirname + filename))
            w, h = im.size
            rw = int(w * ((100 - p)/100))
            rh = int(h * ((100 - p)/100))

            print(rw, rh)

            rim = im.resize((rw, rh), Image.ANTIALIAS)
            rim.save(os.path.expanduser(dirname + rfilename), 'JPEG', quality=95)
        else: break


def get_name(file):
    splited = file.split('.')
    return splited[0]


def main2():
    dirname = 'D:/YumongAdmin/public/images/places/'
    file_list = os.listdir(os.path.expanduser(dirname))
    for idx, file in enumerate(file_list):

        if idx < 40: continue

        p_id = file
        dirpath = dirname + p_id + '/'

        print('\n[START] {} {}/{}'.format(p_id, (idx + 1), len(file_list)))
        
        _file_list = os.listdir(os.path.expanduser(dirpath))
        for _file in _file_list:

            if _file == 'blog':
                blog_list = os.listdir(os.path.expanduser(dirpath + 'blog'))
                for blog in blog_list:
                    name = get_name(blog)
                    print('START BLOG', dirpath + 'blog/' + blog)
                    shutil.copy2(os.path.expanduser(dirpath + 'blog/' + blog), dirpath + 'blog/' + name + '_origin.jpg')
                    resize(dirpath + 'blog/' + name + '_origin.jpg', dirpath + 'blog/' + blog)
                    os.remove(dirpath + 'blog/' + name + '_origin.jpg')
                    print('END BLOG', dirpath + 'blog/' + blog)


            elif _file == 'thumbnail.jpg':
                print('START THUMBNAIL', dirpath + _file)
                shutil.copy2(os.path.expanduser(dirpath + _file), dirpath + 'thumbnail_origin.jpg')
                resize(dirpath + 'thumbnail_origin.jpg', dirpath + _file)
                print('END THUMBNAIL', dirpath + _file)

            else:
                name = get_name(_file)
                print('START IMAGE', dirpath + _file)
                shutil.copy2(os.path.expanduser(dirpath + _file), dirpath + name + '_origin.jpg')
                resize(dirpath + name + '_origin.jpg', dirpath + _file)
                print('END IMAGE', dirpath + _file)

        print('[END] {} {}/{}'.format(p_id, (idx + 1), len(file_list)))


if __name__ == "__main__":
    main2()
