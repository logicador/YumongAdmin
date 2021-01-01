var express = require('express');
var router = express.Router();
const exec = require('child_process').exec;
const getConnection = require('../base/database');


router.post('/start/crawling', function(req, res) {
    if (!req.session.isAdmin) {
        res.json({ status: 'ERR_PERMISSION' });
        return;
    }

    let cPNId = req.body.cPNId;
    if (f.isNone(cPNId)) {
        res.json({ status: 'ERR_WRONG_PARAMS' });
        return;
    }

    // 숫자인지 체크 (정규식)
    if (!/^[0-9]*$/.test(cPNId)) {
        res.json({ status: 'ERR_WRONG_PARAMS' });
        return;
    }

    getConnection((error, conn) => {
        if (error) {
            console.log(error);
            res.json({ status: 'ERR_MYSQL_POOL' });
            return;
        }

        let query = "INSERT INTO t_crawlers (c_p_n_id, c_admin) VALUES (?, ?)";
        let params = [cPNId, req.session.adminId];

        conn.query(query, params, (error, result) => {
            if (error) {
                console.log(error);
                res.json({ status: 'ERR_MYSQL' });
                return;
            }

            conn.release();

            let cmd = 'python D:/YumongAdmin';
            if (process.platform == 'darwin') {
                cmd = 'python3 ~/VSCodeProjects/YumongAdmin';
            }

            let command = cmd + '/python/naver.py';

            console.log(command, result.insertId);

            exec(command + ' ' + result.insertId, (error, stdout, stderr) => {
                if (error) {
                    console.log(error);
                    console.log('stderr', stderr);
                    return;
                }
            });

            res.json({ status: 'OK' });
        });
    });
});


router.get('/get/crawlers', function(req, res) {
    if (!req.session.isAdmin) {
        res.json({ status: 'ERR_PERMISSION' });
        return;
    }

    let cStatus = req.query.cStatus;
    let cAdmin = req.query.cAdmin;
    let page = req.query.page;
    let count = 20;
    if (f.isNone(cStatus) || (cStatus != 'RUNNING' && cStatus != 'DUPLICATED' && cStatus != 'FINISHED' && cStatus != 'ERROR' && cStatus != 'NO_PLACE' && cStatus != 'ALL')) {
        res.json({ status: 'ERR_WRONG_PARAMS' });
        return;
    }

    if (f.isNone(cAdmin)) cAdmin = 'ALL';

    if (f.isNone(page)) page = 0;

    page = parseInt(page);

    let query = "SELECT SQL_CALC_FOUND_ROWS cTab.*, pTab.p_id FROM t_crawlers AS cTab JOIN t__places AS pTab ON pTab.p_n_id = cTab.c_p_n_id WHERE 1=1";
    let params = [];
    if (cStatus != 'ALL') {
        query += " AND c_status = ?";
        params.push(cStatus);
    }
    if (cAdmin != 'ALL') {
        query += " AND c_admin = ?";
        params.push(cAdmin);
    }

    // RUNNING일 경우 전부 다 가져옴
    if (cStatus != 'RUNNING') {
        query += " ORDER BY c_id DESC LIMIT ?, ?";
        params.push(page * count);
        params.push(count);
    }

    getConnection((error, conn) => {
        if (error) {
            console.log(error);
            res.json({ status: 'ERR_MYSQL_POOL' });
            return;
        }

        conn.query(query, params, (error, result) => {
            if (error) {
                console.log(error);
                res.json({ status: 'ERR_MYSQL' });
                return;
            }

            let crawlerList = result;

            query = "SELECT FOUND_ROWS() AS totalCount";
            conn.query(query, params, (error, result) => {
                if (error) {
                    console.log(error);
                    res.json({ status: 'ERR_MYSQL' });
                    return;
                }

                conn.release();
    
                res.json({ status: 'OK', result: {
                    totalCount: result[0].totalCount,
                    crawlerList: crawlerList
                }});
            });
        });
    });
});


router.post('/get/crawler/progress', function(req, res) {
    if (!req.session.isAdmin) {
        res.json({ status: 'ERR_PERMISSION' });
        return;
    }

    let cIdList = req.body.cIdList;
    let cAdmin = req.query.cAdmin;
    if (f.isNone(cIdList)) {
        res.json({ status: 'ERR_WRONG_PARAMS' });
        return;
    }

    if (f.isNone(cAdmin)) cAdmin = 'ALL';

    if (cIdList.length == 0) {
        res.json({ status: 'OK', result: [] });
        return;
    }

    let query = "SELECT cTab.*, pTab.p_id FROM t_crawlers AS cTab JOIN t__places AS pTab ON pTab.p_n_id = cTab.c_p_n_id WHERE 1=1";
    let params = [];
    for (let i = 0; i < cIdList.length; i++) {
        query += " OR c_id = ?";
        params.push(cIdList[i]);
    }
    if (cAdmin != 'ALL') {
        query += " AND c_admin = ?";
        params.push(cAdmin);
    }
    

    getConnection((error, conn) => {
        if (error) {
            console.log(error);
            res.json({ status: 'ERR_MYSQL_POOL' });
            return;
        }

        conn.query(query, params, (error, result) => {
            if (error) {
                console.log(error);
                res.json({ status: 'ERR_MYSQL' });
                return;
            }

            conn.release();
    
            res.json({ status: 'OK', result: result });
        });
    });
});


router.post('/remove/crawler', (req, res) => {
    if (!req.session.isAdmin) {
        res.json({ status: 'ERR_PERMISSION' });
        return;
    }

    let cId = req.body.cId;
    if (f.isNone(cId)) {
        res.json({ status: 'ERR_WRONG_PARAMS' });
        return;
    }

    let query = "DELETE FROM t_crawlers WHERE c_id = ?";
    let params = [cId];

    getConnection((error, conn) => {
        if (error) {
            console.log(error);
            res.json({ status: 'ERR_MYSQL_POOL' });
            return;
        }

        conn.query(query, params, (error, result) => {
            if (error) {
                console.log(error);
                res.json({ status: 'ERR_MYSQL' });
                return;
            }

            conn.release();
    
            res.json({ status: 'OK' });
        });
    });
});


router.post('/login', (req, res) => {
    let id = req.body.id;
    let password = req.body.password;

    if ((id === process.env.ADMIN_ID_1 || id === process.env.ADMIN_ID_2 || id === process.env.ADMIN_ID_3) && password === process.env.ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        req.session.adminId = id;
        req.session.save(function() {
            res.json({ status: 'OK' });
        });
    } else {
        res.json({ status: 'ERR_FAILED_LOGIN' });
    }
});


router.post('/logout', (req, res) => {
    req.session.isAdmin = false;
    req.session.save(function() {
        res.json({ status: 'OK' });
    });
});


module.exports = router;
