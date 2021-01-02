from PIL import Image
import os


# 사진들 


def main():
    dirname = '~/VSCodeProjects/YumongAdmin/python/'
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


def main2():
    dirname = '~/VSCodeProjects/YumongAdmin/public/images/places/'
    file_list = os.listdir(os.path.expanduser(dirname))
    for file in file_list:
        p_id = file
        
        image_list = os.listdir(os.path.expanduser(dirname + p_id))


if __name__ == "__main__":
    main2()
