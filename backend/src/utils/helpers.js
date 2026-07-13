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
  'milk': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop',
  'bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
  'cheese': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=400&fit=crop',
  'meat': 'https://images.unsplash.com/photo-1604503468506-a8da13d82571?w=400&h=400&fit=crop',
  'apple': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop',
  'water': 'https://images.unsplash.com/photo-1523362628745-0c100fc988a6?w=400&h=400&fit=crop',
  'egg': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=400&fit=crop',
  'rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop',
  'pasta': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&h=400&fit=crop',
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
