const { detectPlatform } = require('./src/lib/metadata');

const urls = [
  'https://twitter.com/user/status/1234567890',
  'https://x.com/user/status/1234567890',
  'https://www.instagram.com/p/Cxyz123/',
  'https://instagram.com/reel/Abcd123/',
  'https://www.kgirls.net/issue/12345',
];

urls.forEach(url => {
  console.log(`${url} => ${detectPlatform(url)}`);
});
