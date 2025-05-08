const express = require('express')
const app = express()
const { MongoClient, ObjectId } = require('mongodb')
const methodOverride = require('method-override')
const bcrypt = require('bcrypt') 
const crypto = require('crypto');
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

    // 4. 응답 데이터 조합
    const response = memberships.map(member => {
      const group = groups.find(g => g._id.toString() === member.groupId.toString());
      return {
        groupId: member.groupId,
        groupName: group?.groupName || '(삭제된 그룹)',
        inviteCode: group?.inviteCode || null,
        role: member.role,
        joinedAt: member.joinedAt
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
        joinedAt: member.joinedAt
      };
    });

    res.status(200).json({
      groupId: group._id,
      groupName: group.groupName,
      inviteCode: group.inviteCode,
      ownerId: group.ownerId,
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
    if (group.ownerId.toString() === userId.toString()) {
      return res.status(400).send('그룹 생성자는 그룹을 나갈 수 없습니다.');
    }

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

//일정 등록
app.post('/schedules', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인 필요');

  const {
    title, start, end, type, daysOfWeek, tagNames, tagColors
  } = req.body;

  const tags = (tagNames || '').split(',').map((name, i) => ({
    name: name.trim(),
    color: (tagColors || '').split(',')[i]?.trim() || '#000000'
  }));

  try {
    const tagIds = [];

    for (const tag of tags) {
      if (!tag.name) continue;
      let existing = await db.collection('tags').findOne({
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
      start: new Date(start),
      end: new Date(end),
      type, // 'monthly' | 'weekly'
      daysOfWeek: type === 'weekly'
        ? daysOfWeek.split(',').map(x => parseInt(x.trim()))
        : [],
      tagIds,
      createdAt: new Date()
    };

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
    const dow = current.getDay(); // 0~6
    if (schedule.daysOfWeek.includes(dow)) {
      const s = new Date(current);
      s.setHours(schedule.start.getHours(), schedule.start.getMinutes());

      const e = new Date(current);
      e.setHours(schedule.end.getHours(), schedule.end.getMinutes());

      instances.push({
        ...schedule,
        start: s,
        end: e
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

function expandWeeklyToWeek(schedule, weekStart, weekEnd) {
  const results = [];
  const current = new Date(weekStart);

  while (current <= weekEnd) {
    const dow = current.getDay();
    if (schedule.daysOfWeek.includes(dow)) {
      const s = new Date(current);
      s.setHours(schedule.start.getHours(), schedule.start.getMinutes());

      const e = new Date(current);
      e.setHours(schedule.end.getHours(), schedule.end.getMinutes());

      results.push({
        ...schedule,
        start: s,
        end: e
      });
    }
    current.setDate(current.getDate() + 1);
  }

  return results;
}
//주간 일정 조회
app.get('/schedules/weekly', async (req, res) => {
  if (!req.user) return res.status(401).send('로그인 필요');

  const weekStart = new Date(req.query.start);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  try {
    const rawSchedules = await db.collection('schedules').find({
      userId: new ObjectId(req.user._id),
      type: 'weekly' // 🔥 월간 일정은 제외
    }).toArray();

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
      const instances = expandWeeklyToWeek(sch, weekStart, weekEnd);
      for (const inst of instances) {
        expanded.push({
          title: inst.title,
          start: inst.start,
          end: inst.end,
          tags: inst.tagIds.map(id => tagMap[id.toString()])
        });
      }
    }

    res.status(200).json(expanded);
  } catch (err) {
    console.error(err);
    res.status(500).send('주간 일정 조회 실패');
  }
});

app.get('/schedules/test', (req, res) => {
  if (!req.user) return res.redirect('/login');
  res.render('schedule-test.ejs');
});

