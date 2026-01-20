const { detectPlatform } = require('./src/lib/metadata');

const urls = [
  'https://www.kgirls.net/issue/12345',
  'https://kgirls.net/issue/12345',
  'https://www.kgirls.net/mgall/12345',
  'https://kgirls.net/index.php?mid=issue&document_srl=12345',
  'https://www.kgirls.net/index.php?mid=issue'
];

urls.forEach(url => {
  console.log(`${url} => ${detectPlatform(url)}`);
});
