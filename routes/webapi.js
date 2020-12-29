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

            let command = 'python ' + process.env.DIR + '/python/naver.py';
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

    // let query = "INSERT INTO t_crawlers (c_p_n_id, c_admin) VALUES (?, ?)";
    // let params = [cPNId, req.session.adminId];
    // o.mysql.query(query, params, function(error, result) {
    //     if (error) {
    //         console.log(error);
    //         res.json({ status: 'ERR_MYSQL' });
    //         return;
    //     }

    //     // for windows python3 -> python
    //     let command = 'python ' + process.env.DIR + '/python/naver.py';
    //     exec(command + ' ' + result.insertId, function(error, stdout, stderr) {
    //         if (error) {
    //             console.log(error);
    //             console.log('stderr', stderr);
    //             return;
    //         }
    //     });
    
    //     // res.json({ status: 'OK', cId: result.insertId });
    //     res.json({ status: 'OK' });
    // });
});


router.get('/get/crawlers', function(req, res) {
    if (!req.session.isAdmin) {
        res.json({ status: 'ERR_PERMISSION' });
        return;
    }

    let cStatus = req.query.cStatus;
    let page = req.query.page;
    let count = 10;
    if (f.isNone(cStatus) || (cStatus != 'RUNNING' && cStatus != 'DUPLICATED' && cStatus != 'FINISHED' && cStatus != 'ERROR' && cStatus != 'NO_PLACE' && cStatus != 'ALL')) {
        res.json({ status: 'ERR_WRONG_PARAMS' });
        return;
    }

    if (f.isNone(page)) page = 0;
    if (f.isNone(count)) count = 10;

    page = parseInt(page);

    let query = "SELECT SQL_CALC_FOUND_ROWS * FROM t_crawlers";
    let params = [];
    if (cStatus != 'ALL') {
        query += " WHERE c_status = ?";
        params.push(cStatus);
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

    // o.mysql.query(query, params, function(error, result) {
    //     if (error) {
    //         console.log(error);
    //         res.json({ status: 'ERR_MYSQL' });
    //         return;
    //     }

    //     let crawlerList = result;

    //     query = "SELECT FOUND_ROWS() AS totalCount";
    //     o.mysql.query(query, params, function(error, result) {
    //         if (error) {
    //             console.log(error);
    //             res.json({ status: 'ERR_MYSQL' });
    //             return;
    //         }

    //         res.json({ status: 'OK', result: {
    //             totalCount: result[0].totalCount,
    //             crawlerList: crawlerList
    //         }});
    //     });
    // });
});


router.post('/get/crawler/progress', function(req, res) {
    if (!req.session.isAdmin) {
        res.json({ status: 'ERR_PERMISSION' });
        return;
    }

    let cIdList = req.body.cIdList;
    if (f.isNone(cIdList)) {
        res.json({ status: 'ERR_WRONG_PARAMS' });
        return;
    }

    if (cIdList.length == 0) {
        res.json({ status: 'OK', result: [] });
        return;
    }

    let query = "SELECT * FROM t_crawlers";
    let params = [];
    for (let i = 0; i < cIdList.length; i++) {
        let cId = cIdList[i];
        if (i == 0) query += " WHERE c_id = ?";
        else query += " OR c_id = ?";
        params.push(cId);
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

    // o.mysql.query(query, params, function(error, result) {
    //     if (error) {
    //         console.log(error);
    //         res.json({ status: 'ERR_MYSQL' });
    //         return;
    //     }

    //     res.json({ status: 'OK', result: result });
    // });

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

    // o.mysql.query(query, params, function(error, result) {
    //     if (error) {
    //         console.log(error);
    //         res.json({ status: 'ERR_MYSQL' });
    //         return;
    //     }

    //     res.json({ status: 'OK' });
    // });
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
