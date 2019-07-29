//노드에서 외부 모듈을 추가 할때 
//require : 외부 모듈을 불러올 때 사용됨

let express = require('express');
let http = require('http');
let path = require('path');

//가져온 모듈을 app에 express의 객체에 할당 
let app = express();

//app의 환경 설정
app.set('port', 80);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//MySQL 연결 부분
let mysql = require('mysql');

let conn = mysql.createConnection({
    user: 'kanozo12',
    password: '1234',
    host: 'gondr.asuscomm.com'
});

conn.query('USE kanozo12');
//MySQL 연결 부분 종료

//바디 파서 미들웨어
let bodyParser = require('body-parser').urlencoded({ extended: true });
app.use(bodyParser);
//바디 파서 미들웨어 종료

// 세션 미들웨어 구성
//세션을 사용하기 위한 설정
let session = require('express-session');
let cookieSecret = "yyhs";

app.use(session({ resave: false, saveUninitialized: false, secret: cookieSecret }));
//위와 같이 설정시 세션 사용가능
// 세션 미들웨어 종료

//플래시 메시지 처리 미들웨어
app.use(function (req, res, next) {
    if (req.session.flashMsg != undefined) {  //1. 세션에 플래시 메시지가 있을 경우 
        //뷰에 랜더링 되는 데이터가 들은 객체 (여기에 값을 넣어두면 차후 가져다 쓸수 있음)
        res.locals.flash = req.session.flashMsg; //2. 이를 res.locals에 옮겨 저장 
        delete req.session.flashMsg; //3. 세션에 있는 값은 지워줌
    }
    //요청을 처리후 끝내지 않고 다음 코드로 넘겨라 !
    next();
});
//플래시 메시지 처리 미들웨어 종료

//로그인 처리를 위한 미들웨어 시작
app.use(function (req, res, next) {
    if (req.session.user != undefined) {
        res.locals.user = req.session.user;
    }
    next();
});
//로그인 처리를 위한 미들웨어 종료

//페이징용 객체 가져오기 미들웨어//
let pager = require('./pager.js');
//페이징용 객체 가져오기 미들웨어 종료//

app.post('/register', function (req, res) {
    //body-parser를 앱에서 사용하도록 설정 -> post로 넘어온 값을 다음과 같이 처리
    let uid = req.body.uid;
    let uname = req.body.uname;
    let upw = req.body.upw;
    let upwc = req.body.upwc;

    if (upw !== upwc) {
        //경고메세지 session에 flashMsg에 담음
        req.session.flashMsg = { type: 'warning', msg: '비밀번호와 확인이 일치하지 않습니다.' }
        //특정 페이지를 보내는 기능 (back:이전에 페이지로 보냄)
        res.redirect('back');
        return;
    }

    if (uid == "" || upw == "" || uname == "") {
        req.session.flashMsg = { type: 'warning', msg: '값에 공백이 있습니다. 모든 값을 채워주세요.' }
        res.redirect('back');
        return;
    }

    let sql = "SELECT * FROM `nodeStudyUser` WHERE `uid` = ?";
    conn.query(sql, [uid], function (error, result) {
        if (error) {
            //SQL 입력중 에러 발생시 에러페이지로 보낸다
            res.render('error', { title: 'DB연결 오류', msg: error.code });
            return;
        } else {
            if (result.length > 0) { //결과 값이 존재함
                req.session.flashMsg = { type: 'warning', msg: '중복된 아이디가 있습니다.' };
                res.redirect('back');
                return;
            }
            sql = "INSERT INTO `nodeStudyUser` (`uid`, `uname`, `upw`) VALUES (?, ?, PASSWORD(?))";

            conn.query(sql, [uid, uname, upw], function (error, result) {
                if (error) {
                    //SQL 입력중 에러 발생시 에러페이지로 보냄
                    res.render('error', { title: 'DB 연결 오류', msg: error.code });
                    return;
                } else {
                    req.session.flashMsg = { type: 'success', msg: '회원가입이 성공적으로 이루어졌습니다.' };
                    res.redirect('/');
                    return;
                }
            });
        }
    });
});

function checkLogin(req, res) {
    if (req.session.user == undefined) {
        req.session.flashMsg = { type: 'warning', msg: '로그인 후 시도하실 수 있습니다.' };
        res.redirect('back');
        return false;
    } return true;
}


app.get('/login', function (req, res) {
    res.render('login');
});

app.post('/login', function (req, res) {
    let uid = req.body.uid;
    let upw = req.body.upw;

    let sql = "SELECT * FROM `nodeStudyUser` WHERE uid = ? AND upw = PASSWORD(?)";
    conn.query(sql, [uid, upw], function (error, result) {
        if (error) {
            //SQL 입력중 에러 발생시 에러페이지로 보냄
            res.render('error', { title: 'DB 연결 오류', msg: error.code });
            return;
        } else {
            if (result.length == 1) {
                //로그인 성공 
                req.session.user = result[0]; //0번째 있는 값을 모두 넣어줌
                req.session.flashMsg = { type: 'success', msg: '로그인 되었습니다.' };
                res.redirect('/');
            } else {
                //로그인 실패
                req.session.flashMsg = { type: 'warning', msg: '아이디와 비밀번호가 다릅니다.' };
                res.redirect('back');
            }
        }
    });
});

app.get('/logout', function (req, res) {
    if (!checkLogin(req, res)) { return; }
    delete req.session.user;
    req.session.flashMsg = { type: 'success', msg: '로그아웃되었습니다.' };
    res.redirect('/');
});

//글쓰기 라우터
app.get('/board/write', function (req, res) {
    if (!checkLogin(req, res)) { return; }

    res.render('board/write');
});

app.post('/board/write', function (req, res) {
    if (!checkLogin(req, res)) { return; }
    let writer = req.session.user.uid;
    let title = req.body.title;
    let content = req.body.content;
    if (title == "" || content == "") {
        req.session.flashMsg = { type: 'warning', msg: '값에 공백이 있습니다. 모든 값을 채워주세요' }
        res.redirect('back');
        return;
    }
    var sql = "INSERT INTO nodeStudyBoard (title, writer, content) VALUES(?, ?, ?)";
    conn.query(sql, [title, writer, content], function (error, result) {
        if (error) {
            console.log(title + ", " + writer + ", " + content);
            res.render('error', { 'title': 'DB 연결 오류', msg: error.code });
            return;
        } else {
            if (result.affectedRows == 1) {
                req.session.flashMsg = { type: 'success', msg: '성공적으로 글이 작성되었습니다.' };
                res.redirect('/board');
            } else {
                req.session.flashMsg = { type: 'warning', msg: '글작성에 실패했습니다.' };

                res.redirect('/board');
            }
        }
    });
});

//글 목록 라우터
app.get('/board', function (req, res) {
    let page = req.query.page;
    if (page == undefined || page < 1) {
        page = 1;
    }

    let cntPromise = new Promise(function (resolve, reject) { //프로미스 패턴
        let sql = "SELECT count(*) as cnt FROM nodeStudyBoard";
        conn.query(sql, function (error, result) {
            if (error) {
                reject(result[0].cnt); 
            }
            resolve(result[0].cnt); //성공적으로 종료시 카운트 값을 돌려줌
        });
    });

    cntPromise.then(function (cnt) {
        let pagingObj = pager.pager(page, cnt, 10, 10);

        let sql = "SELECT id, title, writer FROM nodeStudyBoard ORDER BY id DESC LIMIT ?, 10";

        conn.query(sql, [(page - 1) * 10], function (error, result) {
            if (error) {
                res.render('error', { 'title': 'DB 연결 오류', msg: error.code });
                return;
            } else {
                res.render('board/board', { list: result, pager:pagingObj });
            }
        });
    }, function(err) {
        res.render('error', {'title' : 'DB 연결 오류', msg : error.code});
        return;
    });
});

app.get('/board', function (req, res) {
    res.render('board/board');
});

//개별 글 읽기 라우터
app.get('/board/view/:id', function (req, res) { //해당 id에 맞는 글정보를 불러와서
    let sql = "SELECT * FROM nodeStudyBoard WHERE id = ?";

    conn.query(sql, [req.params.id], function (error, result) {
        if (error) {
            res.render('error', { 'title': 'DB 연결 오류', msg: error.code });
            return;
        } else {
            res.render('board/view', { data: result[0] }); //데이터에 넣어 뷰로 보내줌
        }
    });
});

//글 삭제 라우터
app.get('/board/view/:id', function (req, res) {
    let sql = "SELECT * FROM nodeStudyBoard WHERE id = ?";
    conn.query(sql, [req.params.id], function (error, result) {
        if (error) {
            res.render('error', { 'title': 'DB 연결 오류', msg: error.code });
            return;
        } else {
            if (result.length != 1) {
                req.session.flashMsg = { type: 'warning', msg: '해당 글은 존재하지 않습니다.' };
                res.redirect('back');
                return;
            }
            let delBtn = false;
            if (req.session.user) {
                if (req.session.user.uid == result[0].writer) {
                    delBtn = true;
                }
            }
            res.render('board/view', { 'board': result[0], 'delBtn': 'delBtn' });
        }
    });
});

app.get('board/del/:id', function (req, res) {
    if (!checkLogin(req, res)) { return; }

    let sql = "SELECT * FROM nodeStudyBoard WHERE id = ?";
    conn.query(sql, [req.params.id], function (error, result) {
        if (error) {
            res.render('error', { title: 'DB 연결 오류', msg: error.code });
            return;
        } else {
            if (result[0] && result[0].writer == req.session.user.uid) {
                //올바른 권한이 있다면 DELETE 쿼리를 날림
                sql = "DELETE FROM nodeStudyBoard WHERE id = ?";
                conn.query(sql, [req.params.id], function (error, result) {
                    if (error) {
                        res.render('error', { title: 'DB 연결 오류', msg: error.code });
                        return;
                    }
                    req.session.flashMsg = { type: 'success', msg: '성공적으로 삭제되었습니다.' };
                    res.redirect('/board');
                });
            } else {
                req.session.flashMsg = { type: 'warning', msg: '글을 삭제할 권한이 없습니다.' };
                res.redirect('back');
                return;
            }
        }
    });
});


app.get('/', function (req, res) {
    res.render('index');
});

app.get('/register', function (req, res) {
    res.render('join');
});

app.get('/page', function (req, res) {
    res.render('main', { header: "NodeJS 배우기", msg: "노드제이에스로 게시판 만들기" });
});

http.createServer(app).listen(app.get('port'), function () {
    console.log("Express 엔진이 port" + app.get('port') + "에서 실행중입니다.");
})