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
// let mysql = require('mysql');

// let conn = mysql.createConnection({
//     user:'kanozo12',
//     password:'1234',
//     host:'http://gondr.asuscomm.com/phpmyadmin/'
// });

// conn.query('USE kanozo12');
//MySQL 연결 부분 종료

//바디 파서 미들웨어
let bodyParser = require('body-parser').urlencoded({extended: true});
app.use(bodyParser);
//바디 파서 미들웨어 종료

app.post('/register', function(req, res) {
    //body-parser를 앱에서 사용하도록 설정 -> post로 넘어온 값을 다음과 같이 처리
    let uid = req.body.uid;
    let uname = req.body.uname;
    let upw = req.body.upw;
    let upwc = req.body.upwc;

    if(upw !== upwc) {
        //경고메세지 session에 flashMsg에 담음
        req.session.flashMsg = {type:'warning', msg:'비밀번호와 확인이 일치하지 않습니다.'}
        //특정 페이지를 보내는 기능 (back:이전에 페이지로 보냄)
        res.redirect('back');
        return;
    }
});

// 세션 미들웨어 구성
//세션을 사용하기 위한 설정
let session = require('express-session');
let cookieSecret = "yyhs";

app.use(session({resave:false, saveUninitialized:false, secret:cookieSecret}));
//위와 같이 설정시 세션 사용가능
// 세션 미들웨어 종료

//플래시 메시지 처리 미들웨어
app.use(function(req, res, next) {
    if(req.session.flashMsg != undefined) {  //1. 세션에 플래시 메시지가 있을 경우 
        //뷰에 랜더링 되는 데이터가 들은 객체 (여기에 값을 넣어두면 차후 가져다 쓸수 있음)
        res.locals.flash = req.session.flashMsg; //2. 이를 res.locals에 옮겨 저장 
        delete req.session.flashMsg; //3. 세션에 있는 값은 지워줌
    }
    //요청을 처리후 끝내지 않고 다음 코드로 넘겨라 !
    next();
});
//플래시 메시지 처리 미들웨어 종료

app.get('/', function(req, res) {
    res.render('index');
});

app.get('/register', function(req, res) {
    res.render('join');
});

app.get('/page', function(req, res) {
    res.render('main', {header : "NodeJS 배우기", msg:"노드제이에스로 게시판 만들기"});
});

http.createServer(app).listen(app.get('port'), function() {
    console.log("Express 엔진이 port" + app.get('port') + "에서 실행중입니다.");
})