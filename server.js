const express = require('express')
const app = express()
const { MongoClient, ObjectId } = require('mongodb')
const methodOverride = require('method-override')
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const upload = multer({
  dest: path.join(__dirname, 'uploads/')
});
require('dotenv').config() 

app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs') 
app.use(express.json())
app.use(express.urlencoded({extended:true})) 
app.use(methodOverride('_method')) 

let db;
const url = process.env.DB_URL;
const FRONT_BASE_URL = "http://localhost:3000"; //프론트 추후 주소 수정
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
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true
}));

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

passport.use(new LocalStrategy(async (username, password, done) => {
  const user = await db.collection('user').findOne({ username });
  if (!user) return done(null, false, { message: '아이디 없음' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return done(null, false, { message: '비밀번호 틀림' });

  return done(null, user);
}));


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
// 로그인 API (로컬)
app.post('/auth/login', (req, res, next) => {
  passport.authenticate('local', (error, user, info) => {
    if (error) return res.status(500).json(error);
    if (!user) return res.status(401).json({ message: info.message });

    req.logIn(user, (err) => {
      if (err) return next(err);
      res.status(200).json({ message: '로그인 성공' });
    });
  })(req, res, next);
});

// 회원가입 API (로컬)
app.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existing = await db.collection('user').findOne({
      $or: [ { username }, { email } ]
    });
    if (existing) return res.status(409).json({ message: '이미 존재하는 사용자입니다.' });

    const hash = await bcrypt.hash(password, 10);
    await db.collection('user').insertOne({
      username,
      email,
      password: hash
    });

    res.status(200).json({ message: '회원가입 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '회원가입 실패' });
  }
});

// 현재 로그인된 사용자 정보
app.get('/me', (req, res) => {
  if (!req.user) return res.status(401).json({ message: '로그인 안됨' });
  res.status(200).json({
    id: req.user._id,
    username: req.user.username
  });
});

app.get('/isAuth', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// 카카오
app.get('/auth/kakao', passport.authenticate('kakao'));
app.get('/auth/kakao/callback', passport.authenticate('kakao', {
  successRedirect: 'http://localhost:3000/GroupPage',
  failureRedirect: '/login'
}), (req, res) => {
  res.redirect(FRONT_BASE_URL);
});

// 구글
app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));
app.get('/auth/google/callback', passport.authenticate('google', {
  successRedirect: 'http://localhost:3000/GroupPage',
  failureRedirect: '/login'
}), (req, res) => {
  res.redirect(FRONT_BASE_URL);
});

// 네이버
app.get('/auth/naver', passport.authenticate('naver'));
app.get('/auth/naver/callback', passport.authenticate('naver', {
  successRedirect: 'http://localhost:3000/GroupPage',
  failureRedirect: '/login'
}), (req, res) => {
  res.redirect(FRONT_BASE_URL);
});

// 로그아웃
app.post('/auth/logout', (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).json({ message: '로그아웃 실패' });
    res.status(200).json({ message: '로그아웃 완료' });
  });
});


app.get('/register', (req, res)=>{
    res.render('register.ejs')
  })

app.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) return next(err)
    res.redirect('/')  // 로그아웃 후 리디렉션
  })
})

// 로그인 확인
app.get('/isAuth', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// 사용자 프로필
app.get('/user/profile', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: '로그인이 필요합니다.' });

  try {
    const user = await db.collection('user').findOne({ _id: new ObjectId(req.user._id) });
    if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });

    res.status(200).json({
      nickname: user.nickname || '',
      profileImage: user.profileImage || ''
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '사용자 정보 조회 실패' });
  }
});

app.put('/user/profile', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: '로그인이 필요합니다.' });

  const userId = new ObjectId(req.user._id);
  const { nickname, profileImage } = req.body;

  try {
    await db.collection('users').updateOne(
      { _id: userId },
      { $set: { nickname: nickname ?? '', profileImage: profileImage ?? '' } }
    );
    res.status(200).json({ message: '프로필 업데이트 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '프로필 업데이트 실패' });
  }
});

// 그룹 명 변경
app.put("/groups/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  const groupId = req.params.id;
  const { groupName } = req.body;

  if (!groupName || typeof groupName !== "string") {
    return res.status(400).json({ message: "유효한 그룹 이름을 입력하세요." });
  }

  try {
    const result = await db.collection("groups").updateOne(
      { _id: new ObjectId(groupId) },
      { $set: { groupName } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "그룹을 찾을 수 없습니다." });
    }

    res.json({ message: "그룹 이름이 성공적으로 변경되었습니다." });
  } catch (err) {
    console.error("그룹 이름 변경 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 그룹장 넘기기
app.post("/groups/:groupId/transfer", async (req, res) => {
  if (!req.isAuthenticated()) {return res.status(401).json({ message: "로그인이 필요합니다." });}
  const groupId = new ObjectId(req.params.groupId);
  const { targetUserId } = req.body;
  try {
    const group = await db.collection("groups").findOne({ _id: groupId });
    if (!group) return res.status(404).json({ message: "그룹을 찾을 수 없습니다." });
    if (String(group.ownerId) !== String(req.user._id)) {return res.status(403).json({ message: "당신은 그룹장이 아닙니다." });}
    await db.collection("groups").updateOne(
      { _id: groupId },
      { $set: { ownerId: new ObjectId(targetUserId) } }
    );
    await db.collection("group_members").updateMany(
      { groupId, userId: { $in: [new ObjectId(req.user._id), new ObjectId(targetUserId)] } },
      [
        {
          $set: {
            role: {
              $cond: [
                { $eq: ["$userId", new ObjectId(targetUserId)] },
                "admin",
                "member"
              ]
            }
          }
        }
      ]
    );
    res.status(200).json({ message: "그룹장을 넘겼습니다." });
  } catch (err) {
    console.error("그룹장 변경 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 그룹원 강퇴
app.post("/groups/:groupId/kick", async (req, res) => {
  if (!req.isAuthenticated()) {return res.status(401).json({ message: "로그인이 필요합니다." });}
  const groupId = new ObjectId(req.params.groupId);
  const { targetUserId } = req.body;
  try {
    const group = await db.collection("groups").findOne({ _id: groupId });
    if (!group) return res.status(404).json({ message: "그룹을 찾을 수 없습니다." });
    if (String(group.ownerId) !== String(req.user._id)) {return res.status(403).json({ message: "당신은 그룹장이 아닙니다." });}
    if (String(req.user._id) === String(targetUserId)) {return res.status(400).json({ message: "자기 자신은 강퇴할 수 없습니다." });}
    const result = await db.collection("group_members").deleteOne({
      groupId,
      userId: new ObjectId(targetUserId)
    });
    if (result.deletedCount === 0) {return res.status(404).json({ message: "이미 탈퇴된 유저입니다." });}
    res.status(200).json({ message: "해당 사용자를 강퇴했습니다." });
  } catch (err) {
    console.error("강퇴 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});
//생성 테스트
app.get('/groups/create', (req, res) => {
  if (!req.user) return res.redirect('/login');
  res.render('create-group.ejs');
});

app.post('/groups', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');

  const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // 랜덤 6자리 코드

  const newGroup = {
    groupName: req.body.groupName,
    inviteCode,
    ownerId: new ObjectId(req.user._id),
    createdAt: new Date()
  };

  try {
    const result = await db.collection('groups').insertOne(newGroup);

    await db.collection('group_members').insertOne({
      groupId: result.insertedId,
      userId: new ObjectId(req.user._id),
      role: 'admin',
      joinedAt: new Date()
    });

    res.status(200).json({
      message: '그룹 생성 완료',
      groupId: result.insertedId,
      inviteCode: inviteCode
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('그룹 생성 중 오류 발생');
  }
});

//그룹 참가 테스트(초대 코드)
app.get('/groups/join', (req, res) => {
  if (!req.user) return res.redirect('/login');
  res.render('join-group.ejs');
});

app.post('/groups/join', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');

  const inviteCode = req.body.inviteCode;

  try {
    // 1. 초대코드로 그룹 찾기
    const group = await db.collection('groups').findOne({ inviteCode: inviteCode });
    if (!group) return res.status(404).send('해당 초대코드의 그룹이 존재하지 않습니다.');

    // 2. 이미 참여한 유저인지 확인
    const alreadyJoined = await db.collection('group_members').findOne({
      groupId: group._id,
      userId: new ObjectId(req.user._id)
    });

    if (alreadyJoined) {
      return res.status(400).send('이미 이 그룹에 참여한 상태입니다.');
    }

    // 3. 그룹에 추가
    await db.collection('group_members').insertOne({
      groupId: group._id,
      userId: new ObjectId(req.user._id),
      role: 'member',
      joinedAt: new Date()
    });

    res.status(200).json({
      message: '그룹에 참여했습니다.',
      groupId: group._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('그룹 참여 중 오류 발생');
  }
});

app.get('/groups', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');

  try {
    // 1. 사용자가 속한 모든 group_members 가져오기
    const memberships = await db.collection('group_members')
      .find({ userId: new ObjectId(req.user._id) })
      .toArray();

    // 2. 그룹 ID 목록 추출
    const groupIds = memberships.map(m => m.groupId);

    // 3. 해당 groupId 들의 그룹 정보 가져오기
    const groups = await db.collection('groups')
      .find({ _id: { $in: groupIds } })
      .toArray();
    
     // + 그룹 멤버 수 계산
    const memberCounts = await Promise.all(groupIds.map(async (groupId) => {
      const count = await db.collection('group_members').countDocuments({ groupId });
      return { groupId: groupId.toString(), count };
    }));

    // 4. 응답 데이터 조합
    const response = memberships.map(member => {
      const group = groups.find(g => g._id.toString() === member.groupId.toString());
      return {
        groupId: member.groupId,
        groupName: group?.groupName || '(삭제된 그룹)',
        inviteCode: group?.inviteCode || null,
        role: member.role,
        joinedAt: member.joinedAt,
        memberCount : memberCounts
      };
    });

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).send('그룹 목록 불러오기 오류');
  }
});

//그룹 리스트 테스트
app.get('/groups/list', async (req, res) => {
  if (!req.user) return res.redirect('/login');

  try {
    const memberships = await db.collection('group_members')
      .find({ userId: new ObjectId(req.user._id) })
      .toArray();

    const groupIds = memberships.map(m => m.groupId);
    const groups = await db.collection('groups')
      .find({ _id: { $in: groupIds } })
      .toArray();

    const combined = memberships.map(member => {
      const group = groups.find(g => g._id.toString() === member.groupId.toString());
      return {
        groupId: member.groupId,
        groupName: group?.groupName || '(삭제된 그룹)',
        role: member.role
      };
    });

    res.render('group-list.ejs', { groups: combined });
  } catch (err) {
    console.error(err);
    res.status(500).send('그룹 리스트 조회 실패');
  }
});


app.get('/groups/:id', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');

  try {
    const groupId = new ObjectId(req.params.id);

    // 1. 그룹 정보 가져오기
    const group = await db.collection('groups').findOne({ _id: groupId });
    if (!group) return res.status(404).send('그룹을 찾을 수 없습니다.');

    // 2. 멤버 목록 가져오기
    const members = await db.collection('group_members')
      .find({ groupId: groupId })
      .toArray();

    // 3. 멤버의 user 정보 가져오기
    const userIds = members.map(m => m.userId);
    const users = await db.collection('user')
      .find({ _id: { $in: userIds } })
      .toArray();

    // 4. 멤버 정보 조합
    const memberDetails = members.map(member => {
      const user = users.find(u => u._id.toString() === member.userId.toString());
      return {
        userId: member.userId,
        username: user?.username || '(알 수 없음)',
        role: member.role,
        joinedAt: member.joinedAt,
      };
    });

    res.status(200).json({
      groupId: group._id,
      groupName: group.groupName,
      inviteCode: group.inviteCode,
      ownerId: group.ownerId,
      meetingDuration: group.meetingDuration || { hours: 1, minutes: 0 }, 
      members: memberDetails
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('그룹 상세 조회 중 오류 발생');
  }
});

app.post('/groups/:id/leave', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');

  const groupId = new ObjectId(req.params.id);
  const userId = new ObjectId(req.user._id);

  try {
    // 1. 그룹 찾기
    const group = await db.collection('groups').findOne({ _id: groupId });
    if (!group) return res.status(404).send('그룹이 존재하지 않습니다.');

    // 2. owner이면 나가지 못하게 막기
    // if (group.ownerId.toString() === userId.toString()) {
    //   return res.status(400).send('그룹 생성자는 그룹을 나갈 수 없습니다.');
    // }

    // 3. 그룹 멤버에서 삭제
    const result = await db.collection('group_members').deleteOne({
      groupId: groupId,
      userId: userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).send('이 그룹에 가입되어 있지 않습니다.');
    }

    res.status(200).json({
      message: '그룹에서 성공적으로 나갔습니다.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('그룹 나가기 처리 중 오류 발생');
  }
});

app.get('/groups/:id/invite', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');

  const groupId = new ObjectId(req.params.id);

  try {
    const group = await db.collection('groups').findOne({ _id: groupId });
    if (!group) return res.status(404).send('그룹을 찾을 수 없습니다.');

    // 본인이 멤버인지 체크
    const isMember = await db.collection('group_members').findOne({
      groupId,
      userId: new ObjectId(req.user._id)
    });
    if (!isMember) return res.status(403).send('해당 그룹의 멤버가 아닙니다.');

    const inviteUrl = `${process.env.BASE_URL}/join/${group.inviteCode}`;
    res.status(200).json({ inviteCode: group.inviteCode, inviteUrl });
  } catch (err) {
    console.error(err);
    res.status(500).send('초대링크 생성 중 오류 발생');
  }
});

app.get('/join/:inviteCode', async (req, res) => {
  if (!req.user) return res.redirect('/login'); // 로그인 필요

  const inviteCode = req.params.inviteCode;

  try {
    const group = await db.collection('groups').findOne({ inviteCode });
    if (!group) return res.status(404).send('잘못된 초대코드입니다.');

    const alreadyMember = await db.collection('group_members').findOne({
      groupId: group._id,
      userId: new ObjectId(req.user._id)
    });
    if (!alreadyMember) {
      await db.collection('group_members').insertOne({
        groupId: group._id,
        userId: new ObjectId(req.user._id),
        role: 'member',
        joinedAt: new Date()
      });
    }

    // 리디렉션 (React일 경우 프론트 라우터 경로로 보낼 수 있음)
    res.redirect(`/groups/${group._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('초대코드 처리 중 오류 발생');
  }
});

// 그룹 이름 수정 API
app.put('/groups/:groupId', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');
  const groupId = new ObjectId(req.params.groupId);
  const { groupName } = req.body;

  try {
    const group = await db.collection('groups').updateOne(
      { _id: new ObjectId(groupId) },
      { $set: { groupName } }
    );
    if (!group) return res.status(404).send('그룹을 찾을 수 없습니다.');
    if (group.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).send('그룹장만 수정할 수 있습니다.');
    }

    await db.collection('groups').updateOne(
      { _id: groupId },
      { $set: { groupName } }
    );

    res.status(200).json({ message: '그룹 이름 수정 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).send('그룹 이름 수정 실패');
  }
});


//초대링크 테스트
app.get('/groups/:id/invite-page', async (req, res) => {
  if (!req.user) return res.redirect('/login');

  const groupId = new ObjectId(req.params.id);

  try {
    const group = await db.collection('groups').findOne({ _id: groupId });
    if (!group) return res.status(404).send('그룹 없음');

    const isMember = await db.collection('group_members').findOne({
      groupId,
      userId: new ObjectId(req.user._id)
    });
    if (!isMember) return res.status(403).send('멤버 아님');

    const inviteUrl = `${process.env.BASE_URL}/join/${group.inviteCode}`;

    res.render('invite.ejs', {
      groupName: group.groupName,
      inviteUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('오류 발생');
  }
});

//회의 길이 설정
app.put('/groups/:groupId/meeting-duration', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');
  const groupId = new ObjectId(req.params.groupId);
  const { hours, minutes } = req.body;

  try {
    await db.collection('groups').updateOne(
      { _id: groupId },
      { $set: { meetingDuration: { hours, minutes } } }
    );

    res.status(200).json({ message: '회의 길이 설정 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).send('회의 길이 설정 실패');
  }
});

//길이 설정 테스트  
app.get('/groups/:groupId/meeting-duration/form', async (req, res) => {
  if (!req.user) return res.redirect('/login');

  const groupId = new ObjectId(req.params.groupId);
  const group = await db.collection('groups').findOne({ _id: groupId });

  if (!group) return res.status(404).send('그룹 없음');

  const duration = group.meetingDuration || { hours: 1, minutes: 0 };

  res.render('meeting-duration-form.ejs', {
    groupId: groupId.toString(),
    hours: duration.hours,
    minutes: duration.minutes
  });
});


//일정 등록
app.post('/schedules', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인 필요');

  const {
    title, type, monthlyStart, monthlyEnd, weeklyStart, weeklyEnd,
    daysOfWeek, tagNames, tagColors
  } = req.body;

  const tags = (tagNames || '').split(',').map((name, i) => ({
    name: name.trim(),
    color: (tagColors || '').split(',')[i]?.trim() || '#000000'
  }));

  try {
    const tagIds = [];

    for (const tag of tags) {
      if (!tag.name) continue;

      const existing = await db.collection('tags').findOne({
        userId: new ObjectId(req.user._id),
        name: tag.name
      });

      if (existing) {
        tagIds.push(existing._id);
      } else {
        const result = await db.collection('tags').insertOne({
          userId: new ObjectId(req.user._id),
          name: tag.name,
          color: tag.color
        });
        tagIds.push(result.insertedId);
      }
    }

    const schedule = {
      userId: new ObjectId(req.user._id),
      title,
      type,
      tagIds,
      createdAt: new Date()
    };

    if (type === 'monthly') {
      schedule.start = new Date(monthlyStart); // ex) 2025-05-22T19:30
      schedule.end = new Date(monthlyEnd);
    } else if (type === 'weekly') {
      const [startHour, startMinute] = String(weeklyStart).split(':').map(Number);
      const [endHour, endMinute] = String(weeklyEnd).split(':').map(Number);

      // 입력된 시각을 KST 기준으로 그대로 저장
      schedule.start = new Date(2000, 0, 1, startHour, startMinute); // KST 21:30 → UTC 자동 변환됨
      schedule.end = new Date(2000, 0, 1, endHour, endMinute);
      schedule.daysOfWeek = daysOfWeek.split(',').map(x => parseInt(x.trim()));
    }
    console.log('💾 저장할 schedule:', schedule);

    await db.collection('schedules').insertOne(schedule);
    res.status(200).json({ message: '일정 등록 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).send('일정 등록 실패');
  }
});

function expandWeeklyToMonth(schedule, monthStart, monthEnd) {
  const instances = [];
  const current = new Date(monthStart);

  while (current <= monthEnd) {
    const dow = current.getDay(); // 요일 (0~6)
    if (schedule.daysOfWeek.includes(dow)) {
      const s = new Date(current);
      s.setHours(
        schedule.start.getHours(),
        schedule.start.getMinutes(),
        schedule.start.getSeconds() || 0
      );

      const e = new Date(current);
      e.setHours(
        schedule.end.getHours(),
        schedule.end.getMinutes(),
        schedule.end.getSeconds() || 0
      );

      instances.push({
        title: schedule.title,
        start: s,
        end: e,
        tagIds: schedule.tagIds
      });
    }
    current.setDate(current.getDate() + 1);
  }

  return instances;
}

//월간 일정 조회
app.get('/schedules/monthly', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인 필요');

  const year = parseInt(req.query.year);
  const month = parseInt(req.query.month);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);

  try {
    const rawSchedules = await db.collection('schedules').find({
      userId: new ObjectId(req.user._id),
      $or: [
        {
          type: 'monthly',
          start: { $lte: monthEnd },
          end: { $gte: monthStart }
        },
        {
          type: 'weekly'
        }
      ]
    }).toArray();

    // 태그 필터 파싱
    const tagNames = (req.query.tagNames || '').split(',').map(x => x.trim()).filter(Boolean);
    let tagFilterIds = [];

    if (tagNames.length > 0) {
      const tagDocs = await db.collection('tags').find({
        userId: new ObjectId(req.user._id),
        name: { $in: tagNames }
      }).toArray();

      tagFilterIds = tagDocs.map(t => t._id.toString());
    }

    // 태그 정보 미리 조회
    const tagIds = [
      ...new Set(rawSchedules.flatMap(s => s.tagIds.map(id => id.toString())))
    ].map(id => new ObjectId(id));

    const tags = await db.collection('tags')
      .find({ _id: { $in: tagIds } })
      .toArray();

    const tagMap = {};
    for (const tag of tags) {
      tagMap[tag._id.toString()] = { name: tag.name, color: tag.color };
    }

    const expanded = [];

    for (const sch of rawSchedules) {
      const relevantTagIds = sch.tagIds.map(id => id.toString());

      // 태그 필터링 조건
      if (tagFilterIds.length > 0 &&
          !relevantTagIds.some(id => tagFilterIds.includes(id))) {
        continue;
      }

      if (sch.type === 'weekly') {
        const instances = expandWeeklyToMonth(sch, monthStart, monthEnd);
        for (const inst of instances) {
          expanded.push({
            title: inst.title,
            start: inst.start,
            end: inst.end,
            tags: inst.tagIds.map(id => tagMap[id.toString()])
          });
        }
      } else {
        expanded.push({
          title: sch.title,
          start: sch.start,
          end: sch.end,
          tags: sch.tagIds.map(id => tagMap[id.toString()])
        });
      }
    }

    res.status(200).json(expanded);
  } catch (err) {
    console.error(err);
    res.status(500).send('월간 일정 조회 실패');
  }
});

app.delete('/schedules/:id', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인 필요');
  const id = req.params.id;

  try {
    await db.collection('schedules').deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(req.user._id)
    });
    res.status(200).json({ message: '삭제 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).send('삭제 실패');
  }
});

app.put('/schedules/:id', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인 필요');

  const scheduleId = req.params.id;
  const {
    title, type, monthlyStart, monthlyEnd,
    tagNames, tagColors
  } = req.body;

  try {
    const tags = (tagNames || '').split(',').map((name, i) => ({
      name: name.trim(),
      color: (tagColors || '').split(',')[i]?.trim() || '#000000'
    }));

    const tagIds = [];
    for (const tag of tags) {
      if (!tag.name) continue;

      const existing = await db.collection('tags').findOne({
        userId: new ObjectId(req.user._id),
        name: tag.name
      });

      if (existing) {
        tagIds.push(existing._id);
      } else {
        const result = await db.collection('tags').insertOne({
          userId: new ObjectId(req.user._id),
          name: tag.name,
          color: tag.color
        });
        tagIds.push(result.insertedId);
      }
    }

    const updateDoc = {
      title,
      tagIds,
      updatedAt: new Date()
    };

    if (type === 'monthly') {
      updateDoc.start = new Date(monthlyStart);
      updateDoc.end = new Date(monthlyEnd);
    }

    await db.collection('schedules').updateOne(
      { _id: new ObjectId(scheduleId), userId: new ObjectId(req.user._id) },
      { $set: updateDoc }
    );

    res.status(200).json({ message: '수정 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).send('수정 실패');
  }
});


function expandWeeklyToWeek(schedule, weekStart, weekEnd) {
  const results = [];
  const current = new Date(weekStart);

  while (current <= weekEnd) {
    const dow = current.getDay();
    if (schedule.daysOfWeek.includes(dow)) {
      const s = new Date(current);
      s.setHours(
        schedule.start.getHours(),
        schedule.start.getMinutes(),
        schedule.start.getSeconds() || 0
      );

      const e = new Date(current);
      e.setHours(
        schedule.end.getHours(),
        schedule.end.getMinutes(),
        schedule.end.getSeconds() || 0
      );

      results.push({
        title: schedule.title,
        start: s,
        end: e,
        tagIds: schedule.tagIds
      });
    }
    current.setDate(current.getDate() + 1);
  }

  return results;
}

//주간 일정 조회
app.get('/schedules/weekly', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');

  const weekStart = new Date(req.query.start);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7); 
  weekEnd.setHours(0, 0, 0, 0);              

  try {
    const rawSchedules = await db.collection('schedules').find({
      userId: new ObjectId(req.user._id),
      $or: [
        { type: 'weekly' },
        {
          type: 'monthly',
          start: { $lte: weekEnd },
          end: { $gte: weekStart }
        }
      ]
    }).toArray();

    const tagNames = (req.query.tagNames || '').split(',').map(x => x.trim()).filter(Boolean);
    let tagFilterIds = [];

    if (tagNames.length > 0) {
      const tagDocs = await db.collection('tags').find({
        userId: new ObjectId(req.user._id),
        name: { $in: tagNames }
      }).toArray();

      tagFilterIds = tagDocs.map(t => t._id.toString());
    }

    const tagIds = [
      ...new Set(rawSchedules.flatMap(s => s.tagIds.map(id => id.toString())))
    ].map(id => new ObjectId(id));

    const tags = await db.collection('tags')
      .find({ _id: { $in: tagIds } })
      .toArray();

    const tagMap = {};
    for (const tag of tags) {
      tagMap[tag._id.toString()] = { name: tag.name, color: tag.color };
    }

    const expanded = [];

    for (const sch of rawSchedules) {
      const relevantTagIds = sch.tagIds.map(id => id.toString());

      if (tagFilterIds.length > 0 &&
          !relevantTagIds.some(id => tagFilterIds.includes(id))) {
        continue;
      }

      if (sch.type === 'weekly') {
        const instances = expandWeeklyToWeek(sch, weekStart, weekEnd);
        for (const inst of instances) {
          expanded.push({
            id: sch._id.toString(),
            title: inst.title,
            start: inst.start,
            end: inst.end,
            tags: inst.tagIds.map(id => tagMap[id.toString()])
          });
        }
      } else if (sch.type === 'monthly') {
        expanded.push({
          id: sch._id.toString(),
          title: sch.title,
          start: sch.start,
          end: sch.end,
          tags: sch.tagIds.map(id => tagMap[id.toString()])
        });
      }
    }

    res.status(200).json(expanded);
  } catch (err) {
    console.error(err);
    res.status(500).send('주간 일정 조회 실패');
  }
});

app.post('/tags', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');

  const { name, color } = req.body;

  try {
    const result = await db.collection('tags').insertOne({
      name,
      color,
      userId: new ObjectId(req.user._id),
      createdAt: new Date()
    });

    res.status(200).json({ message: '태그 생성 완료', insertedId: result.insertedId });
  } catch (err) {
    console.error('태그 생성 오류:', err);
    res.status(500).send('태그 생성 실패');
  }
});


//태그 리스트 
app.get('/tags', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');

  try {
    const tags = await db.collection('tags').find({
      userId: new ObjectId(req.user._id)
    }).toArray();

    res.status(200).json(tags); // [{ _id, name, color }, ...]
  } catch (err) {
    console.error(err);
    res.status(500).send('태그 목록 조회 실패');
  }
});

//일정 등록 테스트 
app.get('/schedules/form', (req, res) => {
  if (!req.user) return res.redirect('/login');
  res.render('schedule-form.ejs');
});

// 그룹 공유 태그 설정
app.post('/groups/:groupId/share-tags', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인 필요');
  
  const groupId = new ObjectId(req.params.groupId);
  const userId = new ObjectId(req.user._id);
  //const tagIds = req.body.tagIds.map(id => new ObjectId(id)); // 프론트에서 태그 ID들 전송
  const raw = req.body.tagIds || []; // undefined 방지
  const tagIds = Array.isArray(raw)
  ? raw.map(id => new ObjectId(id))
  : raw ? [new ObjectId(raw)] : []; // 하나만 체크된 경우 또는 아무것도 없을 때
  
  try {
    await db.collection('group_shared_tags').updateOne(
      { groupId, userId },
      { $set: { tagIds } },
      { upsert: true }
    );
    res.status(200).json({ message: '공유 태그 설정 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).send('공유 태그 설정 실패');
  }
});

// 그룹 공유 태그 조회 
app.get('/groups/:groupId/share-tags', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인 필요');

  const groupId = new ObjectId(req.params.groupId);
  const userId = new ObjectId(req.user._id);

  try {
    const shared = await db.collection('group_shared_tags').findOne({ groupId, userId });
    const allTags = await db.collection('tags').find({ userId }).toArray();

    res.status(200).json({
      allTags, // 전체 태그 리스트
      sharedTagIds: shared?.tagIds.map(id => id.toString()) || []
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('공유 태그 조회 실패');
  }
});

// 공유 태그 설정 테스트  
app.get('/groups/:groupId/share-tags/form', async (req, res) => {
  if (!req.user) return res.redirect('/login');

  const groupId = new ObjectId(req.params.groupId);
  const userId = new ObjectId(req.user._id);

  try {
    const shared = await db.collection('group_shared_tags').findOne({ groupId, userId });
    const allTags = await db.collection('tags').find({ userId }).toArray();

    res.render('share-tags', {
      groupId: groupId.toString(),
      allTags,
      sharedTagIds: shared?.tagIds.map(id => id.toString()) || []
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('공유 태그 설정 폼 로딩 실패');
  }
});

//그룹 캘린더 조회
app.get('/groups/:groupId/weekly-schedules', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');

  const groupId = new ObjectId(req.params.groupId);
  const weekStart = new Date(req.query.start); // ISO string
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  weekEnd.setHours(0, 0, 0, 0);

  try {
    // 1. 그룹 멤버 조회
    const members = await db.collection('group_members')
      .find({ groupId })
      .toArray();

    const memberIds = members.map(m => m.userId);

    // 2. 공유 태그 가져오기
    const sharedTagDocs = await db.collection('group_shared_tags')
      .find({ groupId })
      .toArray();

    const userToSharedTags = {};
    for (const doc of sharedTagDocs) {
      userToSharedTags[doc.userId.toString()] = doc.tagIds.map(id => id.toString());
    }

    // 3. 일정 가져오기 (weekly + 해당 주간에 걸친 monthly)
    const schedules = await db.collection('schedules').find({
      userId: { $in: memberIds },
      $or: [
        { type: 'weekly' },
        {
          type: 'monthly',
          start: { $lte: weekEnd },
          end: { $gte: weekStart }
        }
      ]
    }).toArray();

    // 4. 태그 필터링 적용
    const filtered = schedules.filter(sch => {
      const shared = userToSharedTags[sch.userId.toString()];
      if (!shared) return true; // 설정 안한 경우 전체 공유
      const tagIds = sch.tagIds.map(id => id.toString());
      return tagIds.some(id => shared.includes(id));
    });

    // 5. 태그 정보 불러오기
    const tagIds = [
      ...new Set(filtered.flatMap(s => s.tagIds.map(id => id.toString())))
    ].map(id => new ObjectId(id));

    const tags = await db.collection('tags')
      .find({ _id: { $in: tagIds } })
      .toArray();

    const tagMap = {};
    for (const tag of tags) {
      tagMap[tag._id.toString()] = { name: tag.name, color: tag.color };
    }

    // 6. 주간 확장
    const expanded = [];

    for (const sch of filtered) {
      const relevantTags = sch.tagIds.map(id => tagMap[id.toString()]);
      if (sch.type === 'weekly') {
        const instances = expandWeeklyToWeek(sch, weekStart, weekEnd);
        for (const inst of instances) {
          expanded.push({
            title: inst.title,
            start: inst.start,
            end: inst.end,
            tags: inst.tagIds.map(id => tagMap[id.toString()])
          });
        }
      } else {
        expanded.push({
          title: sch.title,
          start: sch.start,
          end: sch.end,
          tags: sch.tagIds.map(id => tagMap[id.toString()])
        });
      }
    }

    res.status(200).json(expanded);
  } catch (err) {
    console.error(err);
    res.status(500).send('그룹 주간 일정 조회 실패');
  }
});

//빈시간 추출 함수  
function extractAvailableSlots(allSchedules, weekStart, weekEnd) {
  const TIME_BLOCKS_PER_DAY = 48; // 30분 단위 (24시간 * 2)
  const scheduleMap = {};

  // 0~6 → 일~토
  for (let d = 0; d <= 6; d++) {
    scheduleMap[d] = Array(TIME_BLOCKS_PER_DAY).fill(0);
  }

  for (const sch of allSchedules) {
    const start = new Date(sch.start);
    const end = new Date(sch.end);

    // 일정이 주간 범위 넘어가면 클램핑
    const realStart = start < weekStart ? new Date(weekStart) : start;
    const realEnd = end > weekEnd ? new Date(weekEnd) : end;

    let current = new Date(realStart);
    current.setSeconds(0, 0); // 밀리초 제거

    while (current <= realEnd) {
      const day = current.getDay(); // 0~6: 일~토

      const isStartDay = current.toDateString() === realStart.toDateString();
      const isEndDay = current.toDateString() === realEnd.toDateString();

      const startHour = isStartDay ? realStart.getHours() : 0;
      const startMin = isStartDay ? realStart.getMinutes() : 0;
      const endHour = isEndDay ? realEnd.getHours() : 24;
      const endMin = isEndDay ? realEnd.getMinutes() : 0;

      let startIdx = startHour * 2 + (startMin >= 30 ? 1 : 0);
      let endIdx = endHour * 2;

      if (endMin > 30) endIdx += 2;
      else if (endMin > 0) endIdx += 1;

      endIdx = Math.min(endIdx, TIME_BLOCKS_PER_DAY);

      for (let i = startIdx; i < endIdx; i++) {
        scheduleMap[day][i]++;
      }

      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
    }
  }

  const availableSlots = [];

  for (let day = 0; day <= 6; day++) {
    const blocks = scheduleMap[day];
    let i = 0;

    while (i < TIME_BLOCKS_PER_DAY) {
      while (i < TIME_BLOCKS_PER_DAY && blocks[i] > 0) i++; // busy 영역 skip
      const startBlock = i;

      while (i < TIME_BLOCKS_PER_DAY && blocks[i] === 0) i++; // empty 영역 찾기
      const endBlock = i;

      if (startBlock < endBlock) {
        const startHour = Math.floor(startBlock / 2);
        const startMin = startBlock % 2 === 0 ? '00' : '30';
        const endHour = Math.floor(endBlock / 2);
        const endMin = endBlock % 2 === 0 ? '00' : '30';

        availableSlots.push({
          day,
          start: `${String(startHour).padStart(2, '0')}:${startMin}`,
          end: `${String(endHour).padStart(2, '0')}:${endMin}`
        });
      }
    }
  }

  return availableSlots;
}

//빈시간 추출  
app.get('/groups/:groupId/available-slots', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');

  const groupId = new ObjectId(req.params.groupId);

  // 주간 시작: 요청 날짜 기준, 해당 주의 "일요일 00:00"
  const rawDate = new Date(req.query.start);
  const dayOfWeek = rawDate.getDay(); // 0 (일) ~ 6 (토)
  const weekStart = new Date(rawDate);
  weekStart.setDate(rawDate.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  try {
    const members = await db.collection('group_members')
      .find({ groupId })
      .toArray();
    const memberIds = members.map(m => m.userId);

    const sharedTagDocs = await db.collection('group_shared_tags')
      .find({ groupId })
      .toArray();
    const userToSharedTags = {};
    for (const doc of sharedTagDocs) {
      userToSharedTags[doc.userId.toString()] = doc.tagIds.map(id => id.toString());
    }

    const rawSchedules = await db.collection('schedules').find({
      userId: { $in: memberIds },
      $or: [
        { type: 'weekly' },
        {
          type: 'monthly',
          start: { $lte: weekEnd },
          end: { $gte: weekStart }
        }
      ]
    }).toArray();

    const filtered = rawSchedules.filter(sch => {
      const shared = userToSharedTags[sch.userId.toString()];
      if (!shared) return true;
      const tagIds = sch.tagIds.map(id => id.toString());
      return tagIds.some(id => shared.includes(id));
    });

    const expanded = [];

    for (const sch of filtered) {
      if (sch.type === 'weekly') {
        expanded.push(...expandWeeklyToWeek(sch, weekStart, weekEnd));
      } else {
        const realStart = new Date(Math.max(new Date(sch.start).getTime(), weekStart.getTime()));
        const realEnd = new Date(Math.min(new Date(sch.end).getTime(), weekEnd.getTime()));

        let current = new Date(realStart);
        current.setHours(0, 0, 0, 0);

        const last = new Date(realEnd);
        last.setHours(0, 0, 0, 0);
        last.setDate(last.getDate() + 1);

        while (current < last) {
          const instanceStart = new Date(current);
          const instanceEnd = new Date(current);

          const isStartDay = current.toDateString() === new Date(sch.start).toDateString();
          const isEndDay = current.toDateString() === new Date(sch.end).toDateString();

          if (isStartDay) {
            const s = new Date(sch.start);
            instanceStart.setHours(s.getHours(), s.getMinutes(), 0, 0);
          } else {
            instanceStart.setHours(0, 0, 0, 0);
          }

          if (isEndDay) {
            const e = new Date(sch.end);
            instanceEnd.setHours(e.getHours(), e.getMinutes(), 0, 0);
          } else {
            instanceEnd.setHours(24, 0, 0, 0);
          }

          expanded.push({
            title: sch.title || '',
            start: instanceStart,
            end: instanceEnd,
            tagIds: sch.tagIds || []
          });

          current.setDate(current.getDate() + 1);
        }
      }
    }

    const slots = extractAvailableSlots(expanded, weekStart, weekEnd);
    res.status(200).json(slots);
  } catch (err) {
    console.error(err);
    res.status(500).send('겹치지 않는 시간대 추출 실패');
  }
});

//그룹 투표 시작
app.post('/groups/:groupId/vote/start', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');

  const groupId = new ObjectId(req.params.groupId);

  try {
    const group = await db.collection('groups').findOne({ _id: groupId });
    if (!group) return res.status(404).send('그룹 없음');

    if (group.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).send('그룹장만 투표를 시작할 수 있습니다.');
    }

    // 기존 active 투표가 있다면 중복 생성 방지
    const existing = await db.collection('vote_sessions').findOne({
      groupId,
      status: 'active'
    });
    if (existing) return res.status(400).send('이미 진행 중인 투표가 있습니다.');

    // 회의 길이 가져오기
    const duration = group.meetingDuration || { hours: 1, minutes: 0 };

    await db.collection('vote_sessions').insertOne({
      groupId,
      status: 'active',
      duration,
      createdAt: new Date()
    });

    res.status(200).json({ message: '투표가 시작되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('투표 시작 중 오류');
  }
});

//투표 제출
app.post('/groups/:groupId/vote', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인 필요');

  const groupId = new ObjectId(req.params.groupId);
  const userId = new ObjectId(req.user._id);
  const start = new Date(req.body.start);
  const end = new Date(req.body.end); // 프론트에서 직접 계산해서 보냄

  try {
    const session = await db.collection('vote_sessions').findOne({
      groupId,
      status: 'active'
    });
    if (!session) return res.status(400).send('진행 중인 투표가 없습니다.');

    await db.collection('vote_selections').updateOne(
      { voteSessionId: session._id, userId },
      {
        $set: {
          groupId,
          start,
          end,
          updatedAt: new Date()
        },
        $setOnInsert: {
          voteSessionId: session._id,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    res.status(200).json({
      message: '투표가 저장되었습니다.',
      vote: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('투표 저장 실패');
  }
});


//투표 현황 조회
app.get('/groups/:groupId/vote/status', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');

  const { groupId } = req.params;
  if (!ObjectId.isValid(groupId)) {
  return res.status(400).send('올바르지 않은 groupId입니다.');
}

  const groupObjectId = new ObjectId(groupId);
  const userId = new ObjectId(req.user._id);

  try {
    const session = await db.collection('vote_sessions').findOne({
      groupId: groupObjectId,
      status: 'active'
    });
    if (!session) return res.status(400).send('진행 중인 투표 없음');

    // 내 투표
    const myVote = await db.collection('vote_selections').findOne({
      voteSessionId: session._id,
      userId
    });

    // 전체 투표 모음 (내 것 제외)
    const allVotes = await db.collection('vote_selections')
      .find({ voteSessionId: session._id })
      .toArray();

    const voteMap = {};

    for (const vote of allVotes) {
      const key = vote.start.toISOString();
      if (!voteMap[key]) {
        voteMap[key] = {
          start: vote.start,
          end: vote.end,
          count: 0
        };
      }
      voteMap[key].count += 1;
    }

    // myVote는 별도로
    const others = Object.values(voteMap).filter(v =>
      !myVote || v.start.toISOString() !== myVote.start.toISOString()
    );

    res.status(200).json({
      myVote: myVote
        ? { start: myVote.start, end: myVote.end }
        : null,
      others
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('투표 현황 조회 실패');
  }
});

//투표 취소
app.delete('/groups/:groupId/vote/delete', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인 필요');

  const groupId = new ObjectId(req.params.groupId);
  const userId = new ObjectId(req.user._id);

  try {
    const session = await db.collection('vote_sessions').findOne({
      groupId,
      status: 'active'
    });

    if (!session) return res.status(400).send('진행 중인 투표가 없습니다.');

    await db.collection('vote_selections').deleteOne({
      voteSessionId: session._id,
      userId: userId
    });

    res.status(200).json({ message: '투표가 취소되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('투표 취소 실패');
  }
});

//투표 종료
app.post('/groups/:groupId/vote/close', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인 필요');

  const groupId = new ObjectId(req.params.groupId);
  const userId = new ObjectId(req.user._id);

  try {
    const group = await db.collection('groups').findOne({ _id: groupId });
    if (!group || group.ownerId.toString() !== userId.toString()) {
      return res.status(403).send('그룹장만 종료할 수 있습니다.');
    }

    const session = await db.collection('vote_sessions').findOne({
      groupId: groupObjectId,
      status: 'active'
    });
    if (!session) return res.status(400).send('진행 중인 투표가 없습니다.');

    const selections = await db.collection('vote_selections')
      .find({ voteSessionId: session._id })
      .toArray();

    if (selections.length === 0) {
      return res.status(400).send('투표자가 없습니다.');
    }

    // 같은 시간대별로 그룹핑
    const countMap = {};
    for (const s of selections) {
      const key = s.start.toISOString() + '_' + s.end.toISOString();
      if (!countMap[key]) {
        countMap[key] = { count: 1, start: s.start, end: s.end };
      } else {
        countMap[key].count++;
      }
    }

    // 가장 많은 투표 받은 시간 구하기
    const sorted = Object.values(countMap).sort((a, b) => b.count - a.count);
    const top = sorted[0]; // 득표 수가 가장 높은 시간

    //참여한 모든 사람에게 해당 일정 등록
    const userIds = [...new Set(selections.map(s => s.userId.toString()))].map(id => new ObjectId(id));
    const now = new Date();

    const docs = userIds.map(uid => ({
      userId: uid,
      title: '회의 일정 (투표 결과)',
      type: 'monthly',
      start: top.start,
      end: top.end,
      tagIds: [],
      createdAt: now
    }));

    await db.collection('schedules').insertMany(docs);

    // 투표 세션 상태 종료 처리
    await db.collection('vote_sessions').updateOne(
      { _id: session._id },
      { $set: { status: 'closed', closedAt: now } }
    );

    res.status(200).json({
      message: '투표가 종료되었고, 회의 시간이 등록되었습니다.',
      selected: {
        start: top.start,
        end: top.end,
        count: top.count
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('투표 종료 실패');
  }
});

//투표 테스트
app.get('/groups/:groupId/vote/form', async (req, res) => {
  if (!req.user) return res.redirect('/login');

  const groupId = new ObjectId(req.params.groupId);
  const userId = new ObjectId(req.user._id);

  try {
    const group = await db.collection('groups').findOne({ _id: groupId });
    if (!group) return res.status(404).send('그룹을 찾을 수 없습니다.');

    const session = await db.collection('vote_sessions').findOne({
      groupId: groupObjectId,
      status: 'active'
    });

    if (!session) {
      return res.render('vote-form.ejs', {
        groupId: groupId.toString(),
        isOwner: group.ownerId.toString() === userId.toString(),
        myVote: null,
        others: []
      });
    }

    const votes = await db.collection('vote_selections')
      .find({ voteSessionId: session._id })
      .toArray();

    const myVote = votes.find(v => v.userId.toString() === userId.toString()) || null;

    // 다른 사람들의 투표 시간대 그룹핑
    const countMap = {};
    for (const vote of votes) {
      if (vote.userId.toString() === userId.toString()) continue;

      const key = vote.start.toISOString() + '_' + vote.end.toISOString();
      if (!countMap[key]) {
        countMap[key] = {
          start: vote.start.toISOString().slice(0, 16),
          end: vote.end.toISOString().slice(0, 16),
          count: 1
        };
      } else {
        countMap[key].count++;
      }
    }

    const others = Object.values(countMap); // 배열로 변환

    res.render('vote-form.ejs', {
      groupId: groupId.toString(),
      isOwner: group.ownerId.toString() === userId.toString(),
      myVote: myVote
        ? {
            start: myVote.start.toISOString().slice(0, 16),
            end: myVote.end.toISOString().slice(0, 16)
          }
        : null,
      others
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('투표 폼 로딩 실패');
  }
});



//그룹 게시판 글 작성
app.post('/groups/:groupId/posts', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');

  const groupId = new ObjectId(req.params.groupId);
  const authorId = new ObjectId(req.user._id);
  const { title, content, is_notice, is_vote, voteOptions } = req.body;

  try {
    const group = await db.collection('groups').findOne({ _id: groupId });
    if (!group) return res.status(404).send('해당 그룹이 존재하지 않습니다.');

    const member = await db.collection('group_members').findOne({
      groupId,
      userId: authorId
    });
    if (!member) return res.status(403).send('그룹 멤버가 아닙니다.');

    const result = await db.collection('posts').insertOne({
      group_id: groupId,
      author_id: authorId,
      title,
      content,
      is_notice: is_notice === true || is_notice === 'true',
      is_vote: is_vote === true || is_vote === 'true',
      voteOptions: voteOptions || [],
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(200).json({
      message: '게시글이 등록되었습니다.',
      postId: result.insertedId
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('게시글 작성 중 오류 발생');
  }
});

//그룹 게시판 글 조회
app.get('/groups/:groupId/posts', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');

  const groupId = new ObjectId(req.params.groupId);
  const onlyNotice = req.query.noticeOnly === 'true';

  try {
    const group = await db.collection('groups').findOne({ _id: groupId });
    if (!group) return res.status(404).send('해당 그룹이 존재하지 않습니다.');

    const member = await db.collection('group_members').findOne({
      groupId,
      userId: new ObjectId(req.user._id)
    });
    if (!member) return res.status(403).send('그룹 멤버가 아닙니다.');

    const filter = { group_id: groupId };
    if (onlyNotice) filter.isNotice = true;

    const posts = await db.collection('posts')
      .find(filter)
      .sort({ created_at: -1 })
      .toArray();

    res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).send('게시글 목록 조회 실패');
  }
});

//게시판 글 수정
app.put('/posts/:postId', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');

  const postId = new ObjectId(req.params.postId);
  const userId = new ObjectId(req.user._id);
  const { title, content, is_notice, is_vote, voteOptions } = req.body;

  try {
    const post = await db.collection('posts').findOne({ _id: postId });
    if (!post) return res.status(404).send('게시글이 존재하지 않습니다.');
    if (post.author_id.toString() !== userId.toString()) {
      return res.status(403).send('본인이 작성한 글만 수정할 수 있습니다.');
    }

    await db.collection('posts').updateOne(
      { _id: postId },
      {
        $set: {
          title,
          content,
          is_notice: is_notice === true || is_notice === 'true',
          is_vote: is_vote === true || is_vote === 'true',
          voteOptions: voteOptions || [],
          updated_at: new Date()
        }
      }
    );

    res.status(200).json({ message: '게시글 수정 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).send('게시글 수정 중 오류 발생');
  }
});

//게시판 글 삭제
app.delete('/posts/:postId', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');

  const postId = new ObjectId(req.params.postId);
  const userId = new ObjectId(req.user._id);

  try {
    const post = await db.collection('posts').findOne({ _id: postId });
    if (!post) return res.status(404).send('게시글이 존재하지 않습니다.');
    if (post.author_id.toString() !== userId.toString()) {
      return res.status(403).send('본인이 작성한 글만 삭제할 수 있습니다.');
    }

    await db.collection('posts').deleteOne({ _id: postId });

    res.status(200).json({ message: '게시글 삭제 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).send('게시글 삭제 중 오류 발생');
  }
});

//글 작성 테스트
// 글 작성 폼
app.get('/groups/:groupId/posts/write', (req, res) => {
  if (!req.user) return res.redirect('/login');
  res.render('write-post.ejs', { groupId: req.params.groupId });
});

// 글 목록 보기
app.get('/groups/:groupId/posts/list', async (req, res) => {
  if (!req.user) return res.redirect('/login');

  const groupId = new ObjectId(req.params.groupId);

  try {
    const group = await db.collection('groups').findOne({ _id: groupId });
    if (!group) return res.status(404).send('그룹 없음');

    const posts = await db.collection('posts')
      .find({ group_id: groupId })
      .sort({ is_notice: -1, created_at: -1 })
      .toArray();

    res.render('post-list.ejs', {
      groupId,
      groupName: group.groupName,
      posts
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('게시글 로딩 실패');
  }
});

// 수정 폼 보여주기
app.get('/posts/:postId/edit', async (req, res) => {
  if (!req.user) return res.redirect('/login');

  const postId = new ObjectId(req.params.postId);
  const userId = new ObjectId(req.user._id);

  const post = await db.collection('posts').findOne({ _id: postId });
  if (!post) return res.status(404).send('게시글 없음');
  if (post.author_id.toString() !== userId.toString()) {
    return res.status(403).send('작성자만 수정할 수 있습니다.');
  }

  res.render('edit-post.ejs', { post });
});

//글 상세 조회
app.get('/posts/:postId', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');

  const postId = new ObjectId(req.params.postId);

  try {
    const post = await db.collection('posts').findOne({ _id: postId });
    if (!post) return res.status(404).send('게시글 없음');

    const comments = await db.collection('comments')
      .find({ post_id: postId })
      .sort({ created_at: 1 })
      .toArray();

    const votes = await db.collection('votes').find({ post_id: postId }).toArray();
    const myVote = votes.find(v => v.user_id.toString() === req.user._id.toString());

    const countMap = {};
    votes.forEach(v => {
      (v.selectedOptionIds || []).forEach(id => {
        countMap[id] = (countMap[id] || 0) + 1;
      });
    });

    if (post.voteOptions && Array.isArray(post.voteOptions)) {
      post.voteOptions = post.voteOptions.map(opt => ({
        ...opt,
        voteCount: countMap[opt.id] || 0
      }));
    }

    const myVotes = myVote?.selectedOptionIds || [];

    res.status(200).json({
      post,
      comments,
      myVotes
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('게시글 상세 조회 실패');
  }
});


//댓글 달기
app.post('/posts/:postId/comments', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');

  const postId = new ObjectId(req.params.postId);
  const userId = new ObjectId(req.user._id);
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).send('댓글 내용을 입력해주세요.');
  }

  try {
    const post = await db.collection('posts').findOne({ _id: postId });
    if (!post) return res.status(404).send('게시글 없음');

    await db.collection('comments').insertOne({
      post_id: postId,
      author_id: userId,
      content,
      created_at: new Date()
    });

    res.status(200).json({ message: '댓글 등록 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).send('댓글 등록 실패');
  }
});
//댓글 테스트
app.get('/posts/:postId/view', async (req, res) => {
  if (!req.user) return res.redirect('/login');

  const postId = new ObjectId(req.params.postId);

  try {
    const post = await db.collection('posts').findOne({ _id: postId });
    if (!post) return res.status(404).send('게시글 없음');

    const comments = await db.collection('comments')
      .find({ post_id: postId })
      .sort({ created_at: 1 })
      .toArray();

    res.render('post-detail.ejs', {
      post,
      comments
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('상세 조회 실패');
  }
});

// 게시글 투표
app.post('/posts/:postId/votes', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');

  const postId = new ObjectId(req.params.postId);
  const userId = new ObjectId(req.user._id);
  const { selectedOptionIds } = req.body;

  if (!Array.isArray(selectedOptionIds) || selectedOptionIds.length === 0) {
    return res.status(400).send('선택된 항목이 없습니다.');
  }

  try {
    await db.collection('votes').updateOne(
      { post_id: postId, user_id: userId },
      {
        $set: {
          selectedOptionIds,
          updated_at: new Date()
        },
        $setOnInsert: {
          post_id: postId,
          user_id: userId,
          created_at: new Date()
        }
      },
      { upsert: true }
    );

    res.status(200).json({ message: '투표 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).send('투표 저장 실패');
  }
});

//시간표 업로드
let latestImagePath = '';

app.post('/upload-timetable-image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).send('이미지가 없습니다.');

  latestImagePath = req.file.path; // 예: uploads/abc123.png
  console.log('🖼️ 업로드된 이미지:', latestImagePath);
  res.status(200).json({ image_path: latestImagePath });
});

//시간표 이미지 get
app.get('/upload-timetable-image', (req, res) => {
  if (!latestImagePath) return res.status(404).send('업로드된 이미지가 없습니다.');

  res.status(200).json({ image_path: latestImagePath });
});

//분석 결과 저장
app.post('/upload-result', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인이 필요합니다.');

  let scheduleList;

  try {
    // textarea로 넘어온 JSON 문자열을 수동 파싱
    scheduleList = JSON.parse(req.body.data);
    if (!Array.isArray(scheduleList)) throw new Error('배열이 아님');
  } catch (err) {
    return res.status(400).send('❌ JSON 파싱 실패: ' + err.message);
  }

  try {
    for (const item of scheduleList) {
      const [startHour, startMinute] = item.start.split(':').map(Number);
      const [endHour, endMinute] = item.end.split(':').map(Number);

      const start = new Date(2000, 0, 1, startHour, startMinute);
      const end = new Date(2000, 0, 1, endHour, endMinute);

      await db.collection('schedules').insertOne({
        userId: new ObjectId(req.user._id),
        title: item.title,
        type: 'weekly',
        start,
        end,
        daysOfWeek: [item.day],
        tagIds: [],
        createdAt: new Date()
      });
    }

    res.status(200).send('✅ 시간표 일정이 DB에 저장되었습니다!');
  } catch (err) {
    console.error('❌ 시간표 저장 오류:', err);
    res.status(500).send('DB 저장 실패');
  }
});


//업로드 테스트
app.get('/upload-test', (req, res) => {
  res.render('upload-test.ejs');
});

//분석데이터 저장 테스트 
app.get('/upload-result-test', (req, res) => {
  res.render('upload-result-test.ejs');
});

// 그룹장 넘기기
app.post("/groups/:groupId/transfer", async (req, res) => {
  if (!req.isAuthenticated()) {return res.status(401).json({ message: "로그인이 필요합니다." });}
  const groupId = new ObjectId(req.params.groupId);
  const { targetUserId } = req.body;
  try {
    const group = await db.collection("groups").findOne({ _id: groupId });
    if (!group) return res.status(404).json({ message: "그룹을 찾을 수 없습니다." });
    if (String(group.ownerId) !== String(req.user._id)) {return res.status(403).json({ message: "당신은 그룹장이 아닙니다." });}
    await db.collection("groups").updateOne(
      { _id: groupId },
      { $set: { ownerId: new ObjectId(targetUserId) } }
    );
    await db.collection("group_members").updateMany(
      { groupId, userId: { $in: [new ObjectId(req.user._id), new ObjectId(targetUserId)] } },
      [
        {
          $set: {
            role: {
              $cond: [
                { $eq: ["$userId", new ObjectId(targetUserId)] },
                "admin",
                "member"
              ]
            }
          }
        }
      ]
    );
    res.status(200).json({ message: "그룹장을 넘겼습니다." });
  } catch (err) {
    console.error("그룹장 변경 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 그룹원 강퇴
app.post("/groups/:groupId/kick", async (req, res) => {
  if (!req.isAuthenticated()) {return res.status(401).json({ message: "로그인이 필요합니다." });}
  const groupId = new ObjectId(req.params.groupId);
  const { targetUserId } = req.body;
  try {
    const group = await db.collection("groups").findOne({ _id: groupId });
    if (!group) return res.status(404).json({ message: "그룹을 찾을 수 없습니다." });
    if (String(group.ownerId) !== String(req.user._id)) {return res.status(403).json({ message: "당신은 그룹장이 아닙니다." });}
    if (String(req.user._id) === String(targetUserId)) {return res.status(400).json({ message: "자기 자신은 강퇴할 수 없습니다." });}
    const result = await db.collection("group_members").deleteOne({
      groupId,
      userId: new ObjectId(targetUserId)
    });
    if (result.deletedCount === 0) {return res.status(404).json({ message: "이미 탈퇴된 유저입니다." });}
    res.status(200).json({ message: "해당 사용자를 강퇴했습니다." });
  } catch (err) {
    console.error("강퇴 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});
