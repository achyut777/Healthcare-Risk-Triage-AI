/**
 * Database Seed Script
 * Creates complete demo data for development
 */
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthtriage';

// ================================
// Schema Definitions
// ================================

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'staff' },
  facilityId: String,
  facilityName: String,
  phone: String,
  isActive: { type: Boolean, default: true },
  assessmentsCount: { type: Number, default: 0 },
  lastLogin: Date
}, { timestamps: true });

const patientSchema = new mongoose.Schema({
  patientId: { type: String, unique: true },
  name: String,
  age: Number,
  gender: String,
  contact: {
    phone: String,
    email: String,
    address: String
  },
  facilityId: String
}, { timestamps: true });

const assessmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  patientId: String,
  vitals: {
    age: Number,
    gender: Number,
    heartRate: Number,
    bpSystolic: Number,
    bpDiastolic: Number,
    temperature: Number,
    oxygenSaturation: Number,
    respiratoryRate: Number,
    symptomDurationDays: Number,
    painLevel: Number
  },
  chiefComplaint: String,
  riskLevel: String,
  urgencyScore: Number,
  confidence: Number,
  contributingFactors: Object,
  recommendations: [String],
  assessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  facilityId: String,
  validatedByDoctor: { type: Boolean, default: false }
}, { timestamps: true });

const queueEntrySchema = new mongoose.Schema({
  token: String,
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  patientName: String,
  age: Number,
  gender: String,
  symptoms: String,
  priority: { type: String, default: 'medium' },
  urgencyScore: Number,
  status: { type: String, default: 'waiting' },
  facilityId: String,
  addedAt: { type: Date, default: Date.now },
  calledAt: Date,
  completedAt: Date
}, { timestamps: true });

// Create models
const User = mongoose.model('User', userSchema);
const Patient = mongoose.model('Patient', patientSchema);
const Assessment = mongoose.model('Assessment', assessmentSchema);
const QueueEntry = mongoose.model('QueueEntry', queueEntrySchema);

// ================================
// Seed Data
// ================================

const seedUsers = [
  {
    name: 'Demo Admin',
    email: 'demo@healthtriage.ai',
    password: 'demo123',
    role: 'admin',
    facilityId: 'PHC-001',
    facilityName: 'Primary Health Centre - Sector 12',
    phone: '+91 98765 43210',
    assessmentsCount: 156
  },
  {
    name: 'Dr. Sarah Johnson',
    email: 'doctor@healthtriage.ai',
    password: 'doctor123',
    role: 'doctor',
    facilityId: 'PHC-001',
    facilityName: 'Primary Health Centre - Sector 12',
    phone: '+91 98765 43211',
    assessmentsCount: 89
  },
  {
    name: 'Nurse Priya Sharma',
    email: 'nurse@healthtriage.ai',
    password: 'nurse123',
    role: 'nurse',
    facilityId: 'PHC-001',
    facilityName: 'Primary Health Centre - Sector 12',
    phone: '+91 98765 43212',
    assessmentsCount: 234
  },
  {
    name: 'Staff Amit Kumar',
    email: 'staff@healthtriage.ai',
    password: 'staff123',
    role: 'staff',
    facilityId: 'PHC-001',
    facilityName: 'Primary Health Centre - Sector 12',
    phone: '+91 98765 43213',
    assessmentsCount: 45
  }
];

const seedPatients = [
  { name: 'Rajesh Kumar', age: 45, gender: 'male', phone: '+91 99887 76655' },
  { name: 'Sunita Devi', age: 62, gender: 'female', phone: '+91 99887 76656' },
  { name: 'Amit Singh', age: 28, gender: 'male', phone: '+91 99887 76657' },
  { name: 'Priya Gupta', age: 35, gender: 'female', phone: '+91 99887 76658' },
  { name: 'Ravi Verma', age: 55, gender: 'male', phone: '+91 99887 76659' },
  { name: 'Anita Sharma', age: 42, gender: 'female', phone: '+91 99887 76660' },
  { name: 'Vikram Patel', age: 70, gender: 'male', phone: '+91 99887 76661' },
  { name: 'Meera Reddy', age: 31, gender: 'female', phone: '+91 99887 76662' },
  { name: 'Suresh Yadav', age: 48, gender: 'male', phone: '+91 99887 76663' },
  { name: 'Kavita Joshi', age: 25, gender: 'female', phone: '+91 99887 76664' }
];

const complaints = [
  'Persistent cough and mild fever',
  'Chest pain and shortness of breath',
  'Severe headache for 3 days',
  'Abdominal pain and nausea',
  'High fever with body ache',
  'Dizziness and fatigue',
  'Joint pain and swelling',
  'Skin rash and itching',
  'Back pain radiating to legs',
  'Difficulty breathing'
];

const riskProfiles = [
  { level: 'HIGH', score: 75, priority: 'critical' },
  { level: 'HIGH', score: 68, priority: 'high' },
  { level: 'MEDIUM', score: 52, priority: 'medium' },
  { level: 'MEDIUM', score: 45, priority: 'medium' },
  { level: 'LOW', score: 28, priority: 'low' },
  { level: 'LOW', score: 22, priority: 'low' },
  { level: 'MEDIUM', score: 55, priority: 'medium' },
  { level: 'HIGH', score: 72, priority: 'high' },
  { level: 'LOW', score: 18, priority: 'low' },
  { level: 'MEDIUM', score: 48, priority: 'medium' }
];

// ================================
// Seed Function
// ================================

async function seed() {
  try {
    console.log('\n🌱 Starting database seed...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB:', MONGODB_URI);

    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Assessment.deleteMany({});
    await QueueEntry.deleteMany({});
    console.log('✅ Cleared all collections');

    // Seed Users
    console.log('\n👥 Creating users...');
    const createdUsers = [];
    for (const userData of seedUsers) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        lastLogin: new Date()
      });
      createdUsers.push(user);
      console.log(`   ✓ ${userData.name} (${userData.role})`);
    }

    // Seed Patients
    console.log('\n🏥 Creating patients...');
    const createdPatients = [];
    const year = new Date().getFullYear();
    
    for (let i = 0; i < seedPatients.length; i++) {
      const patientData = seedPatients[i];
      const patient = await Patient.create({
        patientId: `PT-${year}-${String(i + 1).padStart(5, '0')}`,
        name: patientData.name,
        age: patientData.age,
        gender: patientData.gender,
        contact: {
          phone: patientData.phone,
          address: `Address ${i + 1}, Sector ${10 + i}, City`
        },
        facilityId: 'PHC-001'
      });
      createdPatients.push(patient);
      console.log(`   ✓ ${patientData.name} (${patient.patientId})`);
    }

    // Seed Assessments
    console.log('\n📋 Creating assessments...');
    const staffUser = createdUsers[2]; // Nurse
    
    for (let i = 0; i < createdPatients.length; i++) {
      const patient = createdPatients[i];
      const risk = riskProfiles[i];
      
      const vitals = {
        age: patient.age,
        gender: patient.gender === 'male' ? 1 : 0,
        heartRate: 60 + Math.floor(Math.random() * 40),
        bpSystolic: 110 + Math.floor(Math.random() * 50),
        bpDiastolic: 70 + Math.floor(Math.random() * 30),
        temperature: 36.5 + Math.random() * 2,
        oxygenSaturation: 92 + Math.floor(Math.random() * 8),
        respiratoryRate: 14 + Math.floor(Math.random() * 10),
        symptomDurationDays: 1 + Math.floor(Math.random() * 7),
        painLevel: Math.floor(Math.random() * 8)
      };

      await Assessment.create({
        patient: patient._id,
        patientId: patient.patientId,
        vitals,
        chiefComplaint: complaints[i],
        riskLevel: risk.level,
        urgencyScore: risk.score,
        confidence: 0.75 + Math.random() * 0.2,
        contributingFactors: {
          'vital_deviation': 0.3 + Math.random() * 0.4,
          'age_risk': patient.age > 60 ? 0.3 : 0.1,
          'symptom_duration': vitals.symptomDurationDays > 3 ? 0.2 : 0.05
        },
        recommendations: [
          risk.level === 'HIGH' ? '🔴 PRIORITY: Patient should be seen immediately' : 
          risk.level === 'MEDIUM' ? '🟡 ELEVATED: Patient should be seen within 30 minutes' :
          '🟢 ROUTINE: Patient can be seen in queue order',
          'Document vital signs and prepare patient history',
          '📋 All findings must be verified by examining healthcare professional'
        ],
        assessedBy: staffUser._id,
        facilityId: 'PHC-001',
        validatedByDoctor: i < 5
      });
      console.log(`   ✓ Assessment for ${patient.name} (${risk.level})`);
    }

    // Seed Queue (only waiting patients)
    console.log('\n📊 Creating queue entries...');
    const waitingPatients = createdPatients.slice(5); // Last 5 patients
    
    for (let i = 0; i < waitingPatients.length; i++) {
      const patient = waitingPatients[i];
      const risk = riskProfiles[5 + i];
      
      await QueueEntry.create({
        token: `PT-${year}-${String(100 + i).padStart(4, '0')}`,
        patient: patient._id,
        patientName: patient.name,
        age: patient.age,
        gender: patient.gender,
        symptoms: complaints[5 + i],
        priority: risk.priority,
        urgencyScore: risk.score,
        status: 'waiting',
        facilityId: 'PHC-001',
        addedAt: new Date(Date.now() - (i * 15 * 60000)) // Staggered times
      });
      console.log(`   ✓ ${patient.name} in queue (${risk.priority})`);
    }

    // Print summary
    console.log('\n' + '═'.repeat(50));
    console.log('✅ SEED COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(50));
    
    console.log('\n📊 Summary:');
    console.log(`   • Users created: ${createdUsers.length}`);
    console.log(`   • Patients created: ${createdPatients.length}`);
    console.log(`   • Assessments created: ${createdPatients.length}`);
    console.log(`   • Queue entries created: ${waitingPatients.length}`);
    
    console.log('\n🔐 Demo Accounts:');
    console.log('─'.repeat(50));
    seedUsers.forEach(u => {
      console.log(`   ${u.role.toUpperCase().padEnd(8)} | ${u.email.padEnd(25)} | ${u.password}`);
    });
    console.log('─'.repeat(50));
    
    console.log('\n💡 Start the application with: npm run dev\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seed();
