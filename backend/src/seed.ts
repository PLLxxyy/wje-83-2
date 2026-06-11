import bcrypt from 'bcryptjs';
import { runQuery, getQuery } from './database';

async function seed() {
  console.log('开始初始化测试数据...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  const adminResult = await runQuery(
    'INSERT OR IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
    ['admin', 'admin@example.com', hashedPassword, 'admin']
  );
  console.log('管理员账号创建/已存在: admin / 123456');

  const user1Result = await runQuery(
    'INSERT OR IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
    ['musicfan', 'fan@example.com', hashedPassword, 'user']
  );
  const user2Result = await runQuery(
    'INSERT OR IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
    ['rocklover', 'rock@example.com', hashedPassword, 'user']
  );
  console.log('测试用户创建/已存在: musicfan, rocklover / 123456');

  const concerts = [
    { artist: '周杰伦', venue: '国家体育场(鸟巢)', city: '北京', date: '2026-04-15', poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=concert%20poster%20jay%20chou%20singer&image_size=square_hd' },
    { artist: '五月天', venue: '梅赛德斯奔驰文化中心', city: '上海', date: '2026-05-20', poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=concert%20poster%20mayday%20band%20rock&image_size=square_hd' },
    { artist: '林俊杰', venue: '凯迪拉克中心', city: '北京', date: '2026-06-01', poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=concert%20poster%20jj%20lin%20singer&image_size=square_hd' },
    { artist: '邓紫棋', venue: '广州天河体育中心', city: '广州', date: '2026-06-18', poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=concert%20poster%20g.e.m.%20singer%20female&image_size=square_hd' },
    { artist: '陈奕迅', venue: '香港红磡体育馆', city: '香港', date: '2026-07-10', poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=concert%20poster%20eason%20chan%20singer&image_size=square_hd' },
    { artist: 'Taylor Swift', venue: '上海体育场', city: '上海', date: '2026-08-05', poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=concert%20poster%20taylor%20swift%20pop%20star&image_size=square_hd' },
    { artist: 'Coldplay', venue: '深圳湾体育中心', city: '深圳', date: '2026-09-12', poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=concert%20poster%20coldplay%20band%20rock&image_size=square_hd' },
    { artist: 'BTS', venue: '首尔奥林匹克体育场', city: '首尔', date: '2026-10-01', poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=concert%20poster%20kpop%20boy%20band&image_size=square_hd' },
  ];

  const concertIds: number[] = [];
  for (const concert of concerts) {
    const existing = await getQuery('SELECT id FROM concerts WHERE artist = ? AND date = ?', [concert.artist, concert.date]);
    if (!existing) {
      const result = await runQuery(
        'INSERT INTO concerts (artist, venue, city, date, poster) VALUES (?, ?, ?, ?, ?)',
        [concert.artist, concert.venue, concert.city, concert.date, concert.poster]
      );
      concertIds.push(result.lastID);
      console.log(`创建演唱会: ${concert.artist} - ${concert.city}`);
    } else {
      concertIds.push((existing as any).id);
    }
  }

  const reviewContents = [
    '太棒了！音响效果非常好，舞台设计简直梦幻，全场大合唱的时候鸡皮疙瘩都起来了。超值！',
    '现场气氛燃爆了！灯光效果配合完美，乐队演奏超给力。唯一不足是音响有点小瑕疵，但整体体验还是很棒。',
    '舞台太震撼了！360度旋转舞台，还有各种特效。歌手状态也很好，连续唱了3小时，太值了！',
    '音响效果一流，每一个乐器的声音都清晰可辨。现场观众也很热情，大合唱环节特别感动。',
    '票价虽然贵，但真的物超所值。看到了偶像的现场表演，还有各种惊喜嘉宾，完美的一晚！',
    '舞美设计太有创意了！AR效果和真人完美结合，仿佛置身另一个世界。现场气氛从开场嗨到结束。',
    '音效工程师太专业了，混音恰到好处。舞台设计虽然简单但很有质感，歌手的演出诚意满满。',
    '这是我看过最棒的现场！音响、灯光、舞台、气氛全满分。结束后还回味了好久，绝对值得！',
  ];

  for (let i = 0; i < 12; i++) {
    const concertId = concertIds[i % concertIds.length];
    const userId = (i % 2 === 0) ? 2 : 3;
    const content = reviewContents[i % reviewContents.length];
    
    const scores = {
      sound: 7 + Math.floor(Math.random() * 4),
      stage: 7 + Math.floor(Math.random() * 4),
      atmosphere: 7 + Math.floor(Math.random() * 4),
      value: 6 + Math.floor(Math.random() * 5),
    };
    const overall = (scores.sound + scores.stage + scores.atmosphere + scores.value) / 4;

    const daysAgo = Math.floor(Math.random() * 14);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

    await runQuery(
      `INSERT OR IGNORE INTO reviews 
       (user_id, concert_id, sound_score, stage_score, atmosphere_score, value_score, overall_score, content, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, concertId, scores.sound, scores.stage, scores.atmosphere, scores.value, overall, content, 'approved', createdAt]
    );
  }
  console.log('创建12条测试评价');

  console.log('\n数据初始化完成！');
  console.log('管理员账号: admin / 123456');
  console.log('普通用户: musicfan / 123456, rocklover / 123456');
  process.exit(0);
}

seed().catch(err => {
  console.error('初始化数据失败:', err);
  process.exit(1);
});
