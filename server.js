const express = require('express')
const app = express()
const { MongoClient, ObjectId } = require('mongodb')
const methodOverride = require('method-override')
const bcrypt = require('bcrypt') 
require('dotenv').config() 

app.use(methodOverride('_method')) 
app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs') 
app.use(express.json())
app.use(express.urlencoded({extended:true})) 

let db;
const url = process.env.DB_URL;
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공')
  db = client.db('tmta');
}).catch((err)=>{
  console.log(err)
})

app.listen(process.env.PORT, () => {
    console.log('http://localhost:8080 에서 서버 실행중')
})

const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const MongoStore = require('connect-mongo')
const KakaoStrategy = require('passport-kakao').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const NaverStrategy = require('passport-naver').Strategy;

app.use(passport.initialize())
app.use(session({
  secret: '1324sign',
  resave : false,
  saveUninitialized : false,
  cookie : { maxAge : 60 * 60 * 1000 },
  store: MongoStore.create({
    mongoUrl : process.env.DB_URL,
    dbName: 'tmta'
  })
}))

app.use(passport.session()) 


app.get('/', (req, res) => {
  res.render('index.ejs', { user: req.user })
}) 

passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
    let result = await db.collection('user').findOne({ username : 입력한아이디})
    if (!result) {
      return cb(null, false, { message: '아이디 DB에 없음' })
    }
    if (await bcrypt.compare(입력한비번, result.password)) {
      return cb(null, result)
    } else {
      return cb(null, false, { message: '비번불일치' });
    }
  }))

// KakaoStrategy 설정
passport.use(new KakaoStrategy({
  clientID: process.env.KAKAO_CLIENT_ID,
  callbackURL: process.env.KAKAO_REDIRECT_URI
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await db.collection('user').findOne({ kakaoId: profile.id })
    if (user) return done(null, user)

    const newUser = {
      kakaoId: profile.id,
      username: profile.username || profile.displayName || '카카오유저'
    }
    await db.collection('user').insertOne(newUser)
    return done(null, newUser)
  } catch (err) {
    return done(err)
  }
}))

// GoogleStrategy 설정
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URI
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await db.collection('user').findOne({ googleId: profile.id });
    if (user) return done(null, user);

    const newUser = {
      googleId: profile.id,
      username: profile.displayName || '구글유저'
    };
    await db.collection('user').insertOne(newUser);
    return done(null, newUser);
  } catch (err) {
    return done(err);
  }
}));

//NaverStrategy 설정
passport.use(new NaverStrategy({
  clientID: process.env.NAVER_CLIENT_ID,
  clientSecret: process.env.NAVER_CLIENT_SECRET,
  callbackURL: process.env.NAVER_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await db.collection('user').findOne({ naverId: profile.id });
    if (user) return done(null, user);

    const newUser = {
      naverId: profile.id,
      username: profile.displayName || profile.emails?.[0] || '네이버유저'
    };
    await db.collection('user').insertOne(newUser);
    return done(null, newUser);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
    //console.log(user)
    process.nextTick(() => {
        done(null, { id: user._id, username: user.username })
    })
})

passport.deserializeUser(async (user, done) => {
  try {
    let result = await db.collection('user').findOne({ _id: new ObjectId(user.id) })
    if (!result) return done(null, false)  // 유저 없음 처리

    if (result.password) delete result.password
    process.nextTick(() => {
      return done(null, result)
    })
  } catch (e) {
    return done(e)
  }
})

app.get('/login', (req, res)=>{
    //console.log(req.user)
    res.render('login.ejs')
}) 

app.post('/login', async (req, res, next) => {

    passport.authenticate('local', (error, user, info) => {
        if (error) return res.status(500).json(error)
        if (!user) return res.status(401).json(info.message)
        req.logIn(user, (err) => {
          if (err) return next(err)
          res.redirect('/')
        })
    })(req, res, next)
}) 

app.get('/register', (req, res)=>{
    res.render('register.ejs')
  })

app.post('/register', async (req, res) => {
    let hash = await bcrypt.hash(req.body.password, 10) 
    await db.collection('user').insertOne({
      username : req.body.username,
      password : hash
    })
    res.redirect('/')
})

// 카카오 로그인 시작
app.get('/auth/kakao', passport.authenticate('kakao'));

// 카카오 로그인 콜백
app.get('/auth/kakao/callback', passport.authenticate('kakao', {
  failureRedirect: '/login'
}), (req, res) => {
  res.redirect('/');
});

//구글 로그인 시작
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile']
}));

//구글 로그인 완료 콜백
app.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/login'
}), (req, res) => {
  res.redirect('/');
});

// 네이버 로그인 시작
app.get('/auth/naver', passport.authenticate('naver'));

// 네이버 완료 콜백
app.get('/auth/naver/callback', passport.authenticate('naver', {
  failureRedirect: '/login'
}), (req, res) => {
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) return next(err)
    res.redirect('/')  // 로그아웃 후 리디렉션
  })
})