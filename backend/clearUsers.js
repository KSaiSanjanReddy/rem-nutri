const { sequelize } = require('./config/database');
const User = require('./models/User');

async function clearUsers() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully!');

    console.log('Clearing all users...');
    const deletedCount = await User.destroy({
      where: {},
      force: true // This will permanently delete all users
    });

    console.log(`✅ Successfully deleted ${deletedCount} users from the database!`);
    console.log('Database is now clean and ready for fresh testing! 🧹');

  } catch (error) {
    console.error('❌ Error clearing users:', error.message);
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

// Run the function
clearUsers();
