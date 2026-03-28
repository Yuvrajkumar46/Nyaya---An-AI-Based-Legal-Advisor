require('dotenv').config();
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const seedAdvocates = async () => {
    console.log('Seeding advocates...');

    // These advocates mirror the typical dummy data requested to populate the platform's UI fully
    const advocates = [
        {
            full_name: 'Adv. Rajesh Kumar',
            phone: '+91-9876543210',
            city: 'Mumbai',
            bar_council_state: 'Maharashtra',
            bar_council_registration_number: 'BCI-MH-12345',
            practice_areas: JSON.stringify(['Criminal Law', 'Civil Law']),
            experience_years: 12,
            education: 'LLB - Mumbai University',
            languages: JSON.stringify(['English', 'Hindi', 'Marathi']),
            hourly_rate: 2500.00,
            available_days: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
            available_hours_start: '09:00:00',
            available_hours_end: '18:00:00',
            bio: 'Experienced advocate specializing in criminal and civil matters. Over a decade of litigation experience in the Bombay High Court.',
            verification_status: 'verified',
            average_rating: 4.8,
            total_reviews: 127,
            is_active: true
        },
        {
            full_name: 'Adv. Priya Sharma',
            phone: '+91-9876543211',
            city: 'New Delhi',
            bar_council_state: 'Delhi',
            bar_council_registration_number: 'BCI-DL-67890',
            practice_areas: JSON.stringify(['Family Law', 'Corporate Law']),
            experience_years: 8,
            education: 'LLM - National Law University, Delhi',
            languages: JSON.stringify(['English', 'Hindi']),
            hourly_rate: 3500.00,
            available_days: JSON.stringify(['Monday', 'Wednesday', 'Friday']),
            available_hours_start: '10:00:00',
            available_hours_end: '16:00:00',
            bio: 'Specializing in corporate restructuring and complex family law litigation including high-net-worth divorce cases.',
            verification_status: 'verified',
            average_rating: 4.9,
            total_reviews: 84,
            is_active: true
        },
        {
            full_name: 'Adv. Mohammed Ali',
            phone: '+91-9876543212',
            city: 'Hyderabad',
            bar_council_state: 'Telangana',
            bar_council_registration_number: 'BCI-TS-54321',
            practice_areas: JSON.stringify(['Real Estate', 'Tax Law']),
            experience_years: 15,
            education: 'LLB - Osmania University',
            languages: JSON.stringify(['English', 'Telugu', 'Urdu']),
            hourly_rate: 4000.00,
            available_days: JSON.stringify(['Tuesday', 'Thursday', 'Saturday']),
            available_hours_start: '11:00:00',
            available_hours_end: '19:00:00',
            bio: 'Expert in real estate disputes, property registration, and complex taxation appeals. Former consultant to leading property developers.',
            verification_status: 'verified',
            average_rating: 4.6,
            total_reviews: 215,
            is_active: true
        },
        {
            full_name: 'Adv. Sneha Reddy',
            phone: '+91-9876543213',
            city: 'Bangalore',
            bar_council_state: 'Karnataka',
            bar_council_registration_number: 'BCI-KA-11223',
            practice_areas: JSON.stringify(['Intellectual Property', 'Corporate Law']),
            experience_years: 6,
            education: 'LLB - NLSIU Bangalore',
            languages: JSON.stringify(['English', 'Kannada', 'Hindi']),
            hourly_rate: 3000.00,
            available_days: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
            available_hours_start: '09:30:00',
            available_hours_end: '17:30:00',
            bio: 'Tech-focused lawyer handling patent filings, trademark disputes, and startup incorporation/compliance.',
            verification_status: 'verified',
            average_rating: 4.7,
            total_reviews: 56,
            is_active: true
        },
        {
            full_name: 'Adv. Arjun Singh',
            phone: '+91-9876543214',
            city: 'Chandigarh',
            bar_council_state: 'Punjab',
            bar_council_registration_number: 'BCI-PB-99887',
            practice_areas: JSON.stringify(['Labour Law', 'Criminal Law']),
            experience_years: 20,
            education: 'LLB - Panjab University',
            languages: JSON.stringify(['English', 'Hindi', 'Punjabi']),
            hourly_rate: 5000.00,
            available_days: JSON.stringify(['Monday', 'Wednesday']),
            available_hours_start: '14:00:00',
            available_hours_end: '20:00:00',
            bio: 'Senior counsel dealing with heavy litigation in criminal defense and industrial labor disputes.',
            verification_status: 'verified',
            average_rating: 4.9,
            total_reviews: 320,
            is_active: true
        },
        {
            full_name: 'Adv. Ananya Desai',
            phone: '+91-9876543215',
            city: 'Ahmedabad',
            bar_council_state: 'Gujarat',
            bar_council_registration_number: 'BCI-GJ-55443',
            practice_areas: JSON.stringify(['Civil Law', 'Real Estate']),
            experience_years: 10,
            education: 'LLB - Gujarat University',
            languages: JSON.stringify(['English', 'Gujarati', 'Hindi']),
            hourly_rate: 2200.00,
            available_days: JSON.stringify(['Tuesday', 'Thursday', 'Friday', 'Saturday']),
            available_hours_start: '10:00:00',
            available_hours_end: '18:00:00',
            bio: 'Dedicated civil litigator assisting clients with property inheritance, tenant evictions, and family partition suits.',
            verification_status: 'verified',
            average_rating: 4.5,
            total_reviews: 95,
            is_active: true
        },
        {
            full_name: 'Adv. Vikram Iyer',
            phone: '+91-9876543216',
            city: 'Chennai',
            bar_council_state: 'Tamil Nadu',
            bar_council_registration_number: 'BCI-TN-33221',
            practice_areas: JSON.stringify(['Corporate Law', 'Tax Law', 'Intellectual Property']),
            experience_years: 14,
            education: 'LLM - Madras University',
            languages: JSON.stringify(['English', 'Tamil']),
            hourly_rate: 4500.00,
            available_days: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
            available_hours_start: '09:00:00',
            available_hours_end: '18:00:00',
            bio: 'Specialist in direct and indirect taxation, corporate restructuring, and software copyright infringement.',
            verification_status: 'verified',
            average_rating: 4.8,
            total_reviews: 142,
            is_active: true
        },
        {
            full_name: 'Adv. Riya Banerjee',
            phone: '+91-9876543217',
            city: 'Kolkata',
            bar_council_state: 'West Bengal',
            bar_council_registration_number: 'BCI-WB-77665',
            practice_areas: JSON.stringify(['Family Law', 'Labour Law']),
            experience_years: 5,
            education: 'LLB - Calcutta University',
            languages: JSON.stringify(['English', 'Bengali', 'Hindi']),
            hourly_rate: 1500.00,
            available_days: JSON.stringify(['Monday', 'Wednesday', 'Friday', 'Saturday']),
            available_hours_start: '11:00:00',
            available_hours_end: '17:00:00',
            bio: 'Passionate young advocate fighting for women’s rights in domestic violence cases and workplace harassment claims.',
            verification_status: 'verified',
            average_rating: 4.4,
            total_reviews: 38,
            is_active: true
        }
    ];

    for (let i = 0; i < advocates.length; i++) {
        const advocate = advocates[i];
        const userUuid = uuidv4();
        const shortHash = userUuid.split('-')[0];
        const username = `advoc_${shortHash}`;
        const email = `${username}@nyaya.in`;
        const testPassword = await bcrypt.hash('Test@123456', 12);

        // 1. Insert Base User Record First
        const [userResult] = await db.query(
            `INSERT INTO users 
             (user_id, username, email, full_name, phone, password_hash, role, is_active, created_at)
             VALUES (:userUuid, :username, :email, :full_name, :phone, :password_hash, 'advocate', true, NOW())`,
            {
                replacements: {
                    userUuid,
                    username,
                    email,
                    full_name: advocate.full_name,
                    phone: advocate.phone,
                    password_hash: testPassword
                }
            }
        );

        const newUserId = userResult; // Depending on Dialect, this is the auto-increment ID

        // 2. Insert Advocate Profile using that ID
        await db.query(
            `INSERT IGNORE INTO advocates 
             (user_id, username, email, full_name, city,
              state, bar_council_id,
              practice_areas, experience_years,
              languages, hourly_rate, bio, verification_status, is_active, created_at)
             VALUES (:user_id, :username, :email, :full_name, :city, :state, :bar_council_id,
                     :practice_areas, :experience_years, :languages, :hourly_rate,
                     :bio, :verification_status, :is_active, NOW())`,
            {
                replacements: {
                    user_id: newUserId,
                    username,
                    email,
                    full_name: advocate.full_name,
                    city: advocate.city,
                    state: advocate.bar_council_state,
                    bar_council_id: advocate.bar_council_registration_number,
                    practice_areas: advocate.practice_areas,
                    experience_years: advocate.experience_years,
                    languages: advocate.languages,
                    hourly_rate: advocate.hourly_rate,
                    bio: advocate.bio,
                    verification_status: advocate.verification_status,
                    is_active: advocate.is_active
                }
            }
        );
        console.log(`✅ Added advocate: ${advocate.full_name}`);
    }
};

const seedTestUser = async () => {
    console.log('Seeding test user...');

    const passwordHash = await bcrypt.hash('Test@123456', 12);

    const testUserId = uuidv4();
    const shortHash = testUserId.split('-')[0];
    const username = `testuser_${shortHash}`;
    const email = `${username}@nyaya.in`;

    await db.query(
        `INSERT IGNORE INTO users
         (user_id, username, email, full_name, phone,
          password_hash, role,
          is_active, wallet_balance, created_at)
         VALUES (:uuid, :username, :email, :full_name, :phone,
                 :password_hash, :role, :is_active, 
                 :wallet_balance, NOW())`,
        {
            replacements: {
                uuid: testUserId,
                username,
                email,
                full_name: 'Test User',
                phone: '+91-9999999999',
                password_hash: passwordHash,
                role: 'user',
                is_active: true,
                wallet_balance: 1250.00
            }
        }
    );
    console.log(`✅ Test user added: username=${username} password=Test@123456`);
};

const runSeeders = async () => {
    try {
        await seedAdvocates();
        await seedTestUser();
        console.log('\n✅ ALL DATA SEEDED SUCCESSFULLY!');
        console.log('Check HeidiSQL to verify data is in database');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

runSeeders();
