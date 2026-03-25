const supabase = require('./supabaseClient');
const bcrypt = require('bcrypt');

const ADMIN_EMAIL = 'lubaizulbi@gmail.com';
const ADMIN_PASSWORD = 'Lubaina@2005';
const USERS_TABLE = 'users';

async function initAdmin() {
  try {
    // Check if admin exists
    const { data: existingAdmin, error: fetchError } = await supabase
      .from(USERS_TABLE)
      .select('id, email')
      .eq('email', ADMIN_EMAIL)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching admin user:', fetchError.message);
      return;
    }

    if (!existingAdmin) {
      console.log('Admin user not found. Creating admin user...');
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

      const { data: newAdmin, error: createError } = await supabase
        .from(USERS_TABLE)
        .insert([{
          name: 'Admin',
          email: ADMIN_EMAIL,
          password: passwordHash,
          assessment_completed: true // Or whatever default makes sense for admin
        }])
        .select()
        .single();

      if (createError) {
        console.error('Failed to create admin user:', createError.message);
      } else {
        console.log(`Admin user created successfully with ID: ${newAdmin.id}`);
      }
    } else {
      console.log('Admin user already exists in the database.');
    }
  } catch (error) {
    console.error('Unexpected error during initAdmin:', error);
  }
}

module.exports = initAdmin;
