const db = require('../config/db');

const generateProductCode = async () => {
  const result = await db.query(
    `SELECT product_code FROM products ORDER BY id DESC LIMIT 1`
  );

  if (result.rows.length === 0) {
    return 'PRD-0001';
  }

  const lastCode = result.rows[0].product_code;
  const num = parseInt(lastCode.replace('PRD-', ''), 10) + 1;
  return `PRD-${String(num).padStart(4, '0')}`;
};

const generateBarcode = (productCode) => {
  const code = productCode.replace('PRD-', '');
  const num = parseInt(code, 10);
  return `20000000${String(num).padStart(5, '0')}`;
};

const generateInvoiceNumber = () => {
  const date = new Date();
  const prefix = 'INV';
  const dateStr = date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${dateStr}-${random}`;
};

const PRODUCT_IMAGE_MAP = {
  'cola': 'https://images.unsplash.com/photo-1629203851122-3710db0e0f05?w=400&h=400&fit=crop',
  'pepsi': 'https://images.unsplash.com/photo-1632882765545-8c1e4b073dfe?w=400&h=400&fit=crop',
  'fanta': 'https://images.unsplash.com/photo-1624552184280-9e9631bbeee9?w=400&h=400&fit=crop',
  'sprite': 'https://images.unsplash.com/photo-1625772299848-391d6e3532de?w=400&h=400&fit=crop',
  'sut': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop',
  'qatiq': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',
  'pishloq': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=400&fit=crop',
  'non': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
  'lavash': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop',
  'tovuq': 'https://images.unsplash.com/photo-1604503468506-a8da13d82571?w=400&h=400&fit=crop',
  'go\'sht': 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&h=400&fit=crop',
  'olma': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop',
  'banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop',
  'pomidor': 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400&h=400&fit=crop',
  'bodring': 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&h=400&fit=crop',
  'suv': 'https://images.unsplash.com/photo-1523362628745-0c100fc988a6?w=400&h=400&fit=crop',
  'sharbat': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop',
  'chips': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop',
  'pechenye': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop',
  'guruch': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop',
  'makaron': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&h=400&fit=crop',
  'tuz': 'https://images.unsplash.com/photo-1518110925495-5fe2c8a9f124?w=400&h=400&fit=crop',
  'qalampir': 'https://images.unsplash.com/photo-1583119022894-919a385295e0?w=400&h=400&fit=crop',
  'baliq': 'https://images.unsplash.com/photo-1510130113356-d4c9f0e5d6af?w=400&h=400&fit=crop',
  'yog': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=400&fit=crop',
  'tuxum': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=400&fit=crop',
  'asal': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop',
  'kofe': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop',
  'choy': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',
  'shokolad': 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&h=400&fit=crop',
  'konfet': 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400&h=400&fit=crop',
  'muzqaymoq': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=400&fit=crop',
  'pivo': 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=400&fit=crop',
  'vino': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop',
  'apelsin': 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&h=400&fit=crop',
  'uzum': 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&h=400&fit=crop',
  'limon': 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=400&h=400&fit=crop',
  'kartoshka': 'https://images.unsplash.com/photo-1518977676601-b53f82ber79?w=400&h=400&fit=crop',
  'piyoz': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&h=400&fit=crop',
  'sarimsoq': 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=400&h=400&fit=crop',
  'karam': 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&h=400&fit=crop',
  'qulupnay': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&h=400&fit=crop',
  'anor': 'https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=400&h=400&fit=crop',
  'mango': 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&h=400&fit=crop',
  'sosis': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=400&fit=crop',
  'kolbasa': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=400&fit=crop',
  'bekon': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop',
  'shashlik': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=400&fit=crop',
  'gamburger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
  'hot-dog': 'https://images.unsplash.com/photo-1612392062126-0e6e2e1a1076?w=400&h=400&fit=crop',
  'pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop',
  'shaurma': 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&h=400&fit=crop',
  'tort': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
  'bulochka': 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=400&fit=crop',
  'donut': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=400&fit=crop',
  'kruassan': 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=400&h=400&fit=crop',
  'qatiq': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',
  'tvorog': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',
  'qaymoq': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop',
  'jogurt': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',
  'zaytun': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop',
  'ketchup': 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400&h=400&fit=crop',
  'mayonez': 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400&h=400&fit=crop',
  'shakar': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop',
  'un': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop',
  'pasta': 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop',
  'shampun': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
  'so\'ng': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
  'yong\'oq': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d44?w=400&h=400&fit=crop',
  'milk': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop',
  'bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
  'cheese': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=400&fit=crop',
  'meat': 'https://images.unsplash.com/photo-1604503468506-a8da13d82571?w=400&h=400&fit=crop',
  'apple': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop',
  'water': 'https://images.unsplash.com/photo-1523362628745-0c100fc988a6?w=400&h=400&fit=crop',
  'egg': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=400&fit=crop',
  'rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop',
  'oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop',
  'sugar': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop',
};

const guessImageUrl = (name) => {
  if (!name) return null;
  const lower = name.toLowerCase();
  for (const [keyword, url] of Object.entries(PRODUCT_IMAGE_MAP)) {
    if (lower.includes(keyword)) return url;
  }
  return null;
};

module.exports = { generateProductCode, generateBarcode, generateInvoiceNumber, guessImageUrl };
