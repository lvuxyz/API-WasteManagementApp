const mysql = require('mysql2/promise');

async function checkDb() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      database: 'quanliracthai'
    });

    // Kiểm tra bảng transactions
    console.log('Kiểm tra các bảng trong CSDL:');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.tables 
      WHERE table_schema = 'quanliracthai'
    `);
    console.log('Danh sách bảng:', tables.map(t => t.TABLE_NAME));

    // Kiểm tra dữ liệu wastetypes
    const [wasteTypes] = await connection.execute('SELECT * FROM wastetypes');
    console.log('Dữ liệu wastetypes:', wasteTypes);

    // Kiểm tra bảng transactions
    try {
      const [transactions] = await connection.execute('SELECT * FROM transactions LIMIT 5');
      console.log('Dữ liệu transactions:', transactions);
    } catch (err) {
      console.log('Lỗi khi truy vấn bảng transactions:', err.message);
    }

    await connection.end();
  } catch(err) {
    console.error('Lỗi khi kiểm tra database:', err);
  }
}

checkDb(); 