/**
 * Healthcare Chatbot Routes
 * Only answers healthcare-related questions
 */
import express from 'express';
import mongoose from 'mongoose';
import OpenAI from 'openai';
import { CHATBOT_SYSTEM_PROMPT } from '../config/constants.js';
import ChatMessage from '../models/ChatMessage.model.js';
import demoStore from '../services/demoData.service.js';

const router = express.Router();

// Check if MongoDB is connected
const isMongoConnected = () => mongoose.connection.readyState === 1;

// Initialize OpenAI (optional - falls back to rule-based responses)
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here' && process.env.OPENAI_API_KEY !== '') {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Healthcare keywords for filtering
const HEALTHCARE_KEYWORDS = [
  'health', 'medical', 'doctor', 'hospital', 'medicine', 'treatment', 'symptom',
  'disease', 'pain', 'fever', 'cold', 'flu', 'covid', 'vaccine', 'injection',
  'blood', 'pressure', 'diabetes', 'heart', 'lung', 'kidney', 'liver', 'brain',
  'cancer', 'tumor', 'surgery', 'operation', 'therapy', 'diagnosis', 'prescription',
  'pharmacy', 'drug', 'medication', 'tablet', 'capsule', 'dose', 'dosage',
  'infection', 'virus', 'bacteria', 'allergy', 'asthma', 'breathing', 'cough',
  'headache', 'migraine', 'nausea', 'vomit', 'diarrhea', 'constipation',
  'pregnancy', 'pregnant', 'baby', 'child', 'infant', 'elderly', 'senior', 'nutrition',
  'diet', 'exercise', 'fitness', 'mental', 'anxiety', 'depression', 'stress',
  'sleep', 'insomnia', 'fatigue', 'tired', 'weak', 'dizzy', 'faint',
  'emergency', 'ambulance', 'first aid', 'cpr', 'wound', 'injury', 'fracture',
  'bone', 'muscle', 'joint', 'arthritis', 'skin', 'rash', 'itch', 'burn',
  'eye', 'ear', 'nose', 'throat', 'dental', 'tooth', 'gum', 'oral',
  'bp', 'spo2', 'oxygen', 'pulse', 'temperature', 'vital', 'test', 'report',
  'checkup', 'screening', 'prevention', 'wellness', 'healthcare', 'clinic',
  'nurse', 'patient', 'ward', 'icu', 'ot', 'lab', 'xray', 'scan', 'mri', 'ct',
  'ill', 'sick', 'unwell', 'condition', 'chronic', 'acute', 'cure', 'heal',
  // Women's health keywords
  'period', 'periods', 'menstrual', 'menstruation', 'pcos', 'pcod', 'ovary', 'ovarian',
  'uterus', 'uterine', 'fibroid', 'endometriosis', 'menopause', 'perimenopause',
  'cramp', 'cramping', 'bleeding', 'spotting', 'discharge', 'vaginal', 'cervix',
  'breast', 'mammogram', 'pap', 'smear', 'contraception', 'birth control', 'iud',
  'fertility', 'infertility', 'ivf', 'ovulation', 'conceive', 'conception',
  'trimester', 'prenatal', 'postnatal', 'postpartum', 'labor', 'delivery', 'cesarean',
  'c-section', 'miscarriage', 'ectopic', 'preeclampsia', 'gestational', 'morning sickness',
  'fetal', 'ultrasound', 'sonography', 'gynecolog', 'obstetr', 'antenatal',
  // Critical conditions
  'stroke', 'heart attack', 'cardiac', 'seizure', 'epilepsy', 'unconscious',
  'anaphylaxis', 'shock', 'trauma', 'accident', 'poisoning', 'overdose',
  'chest pain', 'breathless', 'paralysis', 'numbness', 'severe', 'critical',
  // Common diseases
  'thyroid', 'hypothyroid', 'hyperthyroid', 'anemia', 'cholesterol', 'obesity',
  'gastric', 'ulcer', 'acidity', 'gerd', 'ibs', 'colitis', 'hepatitis', 'cirrhosis',
  'pneumonia', 'bronchitis', 'tuberculosis', 'tb', 'malaria', 'dengue', 'typhoid',
  'jaundice', 'kidney stone', 'uti', 'prostate', 'hernia', 'appendix', 'gallbladder'
];

// Check if query is healthcare-related
const isHealthcareRelated = (text) => {
  const lowerText = text.toLowerCase();
  return HEALTHCARE_KEYWORDS.some(keyword => lowerText.includes(keyword));
};

// Rule-based responses for common healthcare questions
const HEALTHCARE_RESPONSES = {
  greeting: [
    "Hello! I'm the HealthTriage AI assistant. I can help you with general health information and questions about healthcare. How can I assist you today?",
    "Hi there! I'm here to help with healthcare-related questions. Remember, for any medical concerns, please consult a healthcare professional. What would you like to know?"
  ],
  fever: "🌡️ **Fever Information**\n\nFever is typically defined as a body temperature above **38°C (100.4°F)**.\n\n**Common causes:**\n• Viral infections (flu, COVID-19)\n• Bacterial infections\n• Inflammatory conditions\n\n**Home care:**\n• Rest and adequate hydration\n• Light, loose clothing\n• Paracetamol/Acetaminophen as directed\n\n🚨 **Seek immediate care if:**\n• Fever persists beyond 3 days\n• Temperature exceeds 39.4°C (103°F)\n• Accompanied by severe headache, rash, or confusion\n• In infants under 3 months\n\n⚠️ *This is general information, not medical advice.*",
  
  headache: "🤕 **Headache Information**\n\nHeadaches can result from tension, dehydration, eye strain, or underlying conditions.\n\n**Types:**\n• Tension headache - band-like pressure\n• Migraine - throbbing, often one-sided\n• Cluster headache - severe, around eye\n\n**Relief measures:**\n• Rest in a quiet, dark room\n• Stay hydrated\n• Cold/warm compress\n• Over-the-counter pain relievers if appropriate\n\n🚨 **Seek immediate attention if:**\n• Sudden, severe 'thunderclap' headache\n• Accompanied by confusion, vision changes\n• Neck stiffness with fever\n• Following head injury\n\n⚠️ *Please consult a healthcare professional for persistent or severe headaches.*",
  
  bloodPressure: "💓 **Blood Pressure Guide**\n\n**Normal ranges:**\n• Normal: 120/80 mmHg\n• Elevated: 120-129/<80 mmHg\n• High (Hypertension): ≥140/90 mmHg\n• Low (Hypotension): <90/60 mmHg\n\n**Management tips:**\n• Reduce salt intake (<5g/day)\n• Regular physical activity (30 min/day)\n• Maintain healthy weight\n• Limit alcohol, quit smoking\n• Manage stress\n• Take medications as prescribed\n\n🚨 **Emergency signs:**\n• BP >180/120 with symptoms\n• Severe headache with high BP\n• Chest pain, vision changes\n\n⚠️ *This is general information. Please consult a healthcare professional for personalized advice.*",
  
  diabetes: "🩸 **Diabetes Information**\n\n**Types:**\n• **Type 1**: Autoimmune, requires insulin\n• **Type 2**: Most common, often lifestyle-related\n• **Gestational**: During pregnancy\n\n**Normal blood sugar levels:**\n• Fasting: 70-100 mg/dL\n• After meals: <140 mg/dL\n• HbA1c: <5.7%\n\n**Management pillars:**\n• Regular blood sugar monitoring\n• Balanced diet, portion control\n• Regular exercise (150 min/week)\n• Medication/insulin adherence\n• Foot care and regular checkups\n\n🚨 **Warning signs to watch:**\n• Very high/low blood sugar\n• Excessive thirst/urination\n• Blurred vision, numbness in feet\n\n⚠️ *Please work with your healthcare team for diabetes management.*",
  
  emergency: "🚨 **MEDICAL EMERGENCY INFORMATION**\n\n**Call emergency services immediately (108 in India, 911 in USA, 999 in UK) for:**\n\n❤️ **Cardiac:**\n• Crushing chest pain\n• Pain radiating to arm/jaw\n• Profuse sweating with chest pain\n\n🧠 **Stroke (FAST):**\n• Face drooping\n• Arm weakness\n• Speech difficulty\n• Time to call emergency\n\n🫁 **Breathing:**\n• Severe difficulty breathing\n• Turning blue (lips, fingernails)\n• Choking\n\n⚡ **Other emergencies:**\n• Severe allergic reaction\n• Uncontrolled bleeding\n• Loss of consciousness\n• Seizures\n• Severe burns\n• Poisoning/overdose\n\n*I'm an AI assistant and cannot provide emergency medical care. Please call emergency services immediately!*",
  
  covid: "🦠 **COVID-19 Information**\n\n**Common symptoms:**\n• Fever, cough, fatigue\n• Loss of taste/smell\n• Shortness of breath\n• Body aches, sore throat\n\n**If you suspect COVID-19:**\n1. Isolate immediately\n2. Get tested (RT-PCR/RAT)\n3. Rest and stay hydrated\n4. Monitor oxygen levels\n5. Take prescribed medications\n\n🚨 **Seek immediate care for:**\n• Difficulty breathing\n• Persistent chest pain\n• Confusion or drowsiness\n• Bluish lips or face\n• SpO2 below 94%\n\n**Prevention:**\n• Vaccination\n• Mask wearing when needed\n• Hand hygiene\n• Ventilation\n\n⚠️ *Follow your local health authority guidelines.*",
  
  mentalHealth: "🧠 **Mental Health Support**\n\nMental health is just as important as physical health.\n\n**Common concerns:**\n• Anxiety - excessive worry, restlessness\n• Depression - persistent sadness, loss of interest\n• Stress - feeling overwhelmed\n\n**Helpful practices:**\n• Regular exercise (natural mood booster)\n• Adequate sleep (7-9 hours)\n• Maintain social connections\n• Mindfulness/meditation\n• Limit alcohol/caffeine\n• Healthy diet\n\n**When to seek help:**\n• Symptoms persist >2 weeks\n• Affecting daily functioning\n• Thoughts of self-harm\n• Substance use to cope\n\n💚 **Remember:** It's okay to not be okay. Help is available.\n\n📞 **Crisis helplines:**\n• iCall: 9152987821\n• Vandrevala Foundation: 1860-2662-345\n\n*You're not alone. Please reach out to a mental health professional.*",
  
  // WOMEN'S HEALTH RESPONSES
  pregnancy: "🤰 **Pregnancy Information**\n\n**Prenatal care essentials:**\n• Regular doctor visits (monthly → weekly)\n• Prenatal vitamins (folic acid, iron)\n• Balanced nutrition\n• Moderate exercise\n• Adequate rest\n\n**Trimester highlights:**\n• **1st (Weeks 1-12):** Organ formation, morning sickness common\n• **2nd (Weeks 13-26):** Baby movements felt, energy returns\n• **3rd (Weeks 27-40):** Rapid growth, preparation for delivery\n\n🚨 **Contact your doctor immediately for:**\n• Vaginal bleeding\n• Severe abdominal pain\n• Severe headache with swelling\n• Reduced fetal movements\n• Water breaking before due date\n• Fever >38°C\n\n**Warning signs of preeclampsia:**\n• High BP, swelling in face/hands\n• Severe headache, vision changes\n• Upper abdominal pain\n\n⚠️ *Always consult your obstetrician for pregnancy-related concerns.*",
  
  periods: "🔴 **Menstrual Health Information**\n\n**Normal menstrual cycle:**\n• Duration: 21-35 days (avg 28 days)\n• Period length: 2-7 days\n• Blood loss: 30-80 ml per cycle\n\n**Common concerns:**\n\n**Painful periods (Dysmenorrhea):**\n• Mild cramping is normal\n• Heat packs, gentle exercise help\n• Pain relievers if needed\n\n**Heavy bleeding (Menorrhagia):**\n• Soaking pad/tampon every hour\n• Passing large clots\n• May indicate fibroids, hormonal issues\n\n**Irregular periods:**\n• Can be due to stress, PCOS, thyroid\n• Track your cycle for patterns\n\n🚨 **See a doctor if:**\n• Periods suddenly become very heavy\n• Bleeding between periods\n• Severe pain not relieved by OTC meds\n• Periods stopped (not pregnant)\n• Cycles <21 or >35 days consistently\n\n⚠️ *Please consult a gynecologist for persistent menstrual issues.*",
  
  pcos: "🔬 **PCOS/PCOD Information**\n\n**Polycystic Ovary Syndrome** affects 1 in 10 women.\n\n**Common symptoms:**\n• Irregular or missed periods\n• Excess hair growth (face, body)\n• Acne, oily skin\n• Weight gain (especially around waist)\n• Difficulty conceiving\n• Dark skin patches\n\n**Diagnosis involves:**\n• Hormone tests (LH, FSH, testosterone)\n• Pelvic ultrasound\n• Blood sugar/insulin tests\n\n**Management:**\n• **Lifestyle:** Weight loss (even 5-10% helps!)\n• **Diet:** Low glycemic index foods\n• **Exercise:** 30 min daily\n• **Medications:** As prescribed (metformin, hormones)\n\n**Fertility in PCOS:**\n• Many women with PCOS can conceive\n• Treatment options available\n\n⚠️ *PCOS is manageable. Work with your gynecologist for a personalized plan.*",
  
  menopause: "🌸 **Menopause Information**\n\n**Menopause** = 12 months without periods (avg age 51)\n\n**Perimenopause** = Transition phase (can last 4-10 years)\n\n**Common symptoms:**\n• Hot flashes, night sweats\n• Irregular periods\n• Mood changes, anxiety\n• Sleep problems\n• Vaginal dryness\n• Memory/concentration issues\n• Weight gain\n• Joint pain\n\n**Management options:**\n• **Lifestyle:** Exercise, healthy diet, avoid triggers\n• **Hormone Therapy (HRT):** Discuss risks/benefits with doctor\n• **Non-hormonal options:** Available for hot flashes\n• **Vaginal estrogen:** For local symptoms\n\n**Health considerations:**\n• Bone health (calcium, vitamin D)\n• Heart health monitoring\n• Regular mammograms\n\n⚠️ *Every woman's experience is different. Consult your doctor for personalized guidance.*",
  
  // CRITICAL CONDITIONS
  heartAttack: "🚨 **HEART ATTACK WARNING SIGNS**\n\n**Recognize the symptoms:**\n• Crushing chest pain/pressure\n• Pain radiating to left arm, jaw, back\n• Shortness of breath\n• Cold sweats, nausea\n• Lightheadedness\n• Sense of impending doom\n\n**Women may have different symptoms:**\n• Unusual fatigue\n• Neck/jaw pain\n• Nausea, stomach pain\n• Less classic chest pain\n\n⚡ **IMMEDIATE ACTION:**\n1. **Call emergency (108/911) immediately**\n2. Chew aspirin 325mg if not allergic\n3. Sit or lie down, stay calm\n4. Loosen tight clothing\n5. Be ready for CPR\n\n⏰ **Time is muscle!** Every minute counts.\n\n*This is an emergency. Call emergency services NOW!*",
  
  stroke: "🧠 **STROKE - Act FAST!**\n\n**F.A.S.T. Warning Signs:**\n• **F**ace drooping - One side of face droops\n• **A**rm weakness - Can't raise both arms equally\n• **S**peech difficulty - Slurred or strange speech\n• **T**ime to call emergency - Every second counts!\n\n**Other symptoms:**\n• Sudden severe headache\n• Vision problems in one or both eyes\n• Confusion, trouble understanding\n• Numbness on one side of body\n• Difficulty walking, loss of balance\n\n⚡ **IMMEDIATE ACTION:**\n1. **Call emergency (108/911) immediately**\n2. Note the time symptoms started\n3. Keep person comfortable\n4. Do NOT give food/water\n5. Be ready to give information\n\n⏰ **Golden hour:** Treatment within 3-4.5 hours can prevent disability.\n\n*This is an emergency. Call emergency services NOW!*",
  
  seizure: "⚡ **Seizure First Aid**\n\n**During a seizure:**\n✅ **DO:**\n• Stay calm, time the seizure\n• Clear area of dangerous objects\n• Cushion the head\n• Turn on side when convulsions stop\n• Stay with person until fully awake\n• Speak calmly and reassuringly\n\n❌ **DON'T:**\n• Put anything in mouth\n• Try to restrain movements\n• Give food/water until fully alert\n\n🚨 **Call emergency if:**\n• Seizure lasts >5 minutes\n• Person doesn't regain consciousness\n• Second seizure follows\n• First-time seizure\n• Person is pregnant, diabetic, or injured\n• Breathing difficulties\n\n**After seizure:**\n• Allow rest\n• Monitor for confusion\n• Check for injuries\n\n⚠️ *Seek medical evaluation after any seizure.*",
  
  // COMMON CONDITIONS
  thyroid: "🦋 **Thyroid Information**\n\n**Thyroid gland** controls metabolism.\n\n**Hypothyroidism (Underactive):**\n• Fatigue, weight gain\n• Cold intolerance\n• Dry skin, hair loss\n• Depression, memory issues\n• Constipation\n• Treatment: Thyroid hormone replacement\n\n**Hyperthyroidism (Overactive):**\n• Weight loss, increased appetite\n• Rapid heartbeat, anxiety\n• Heat intolerance, sweating\n• Tremors, sleep problems\n• Treatment: Medications, sometimes surgery\n\n**Normal TSH:** 0.4-4.0 mIU/L\n\n**Monitoring:**\n• Regular blood tests\n• Medication adjustments as needed\n• Annual check-ups\n\n⚠️ *Please consult an endocrinologist for thyroid management.*",
  
  asthma: "🫁 **Asthma Information**\n\n**Symptoms:**\n• Wheezing, coughing\n• Shortness of breath\n• Chest tightness\n• Symptoms worse at night/early morning\n\n**Triggers to avoid:**\n• Dust, pollen, pet dander\n• Smoke, pollution\n• Cold air, exercise\n• Strong odors\n• Respiratory infections\n\n**Management:**\n• **Controller inhalers:** Daily, prevent attacks\n• **Rescue inhalers:** For sudden symptoms\n• **Action plan:** Know when to seek help\n• Regular peak flow monitoring\n\n🚨 **Emergency signs:**\n• Severe breathlessness\n• Blue lips/fingernails\n• Rescue inhaler not helping\n• Can't speak in sentences\n\n⚠️ *Work with your doctor to manage asthma effectively.*",
  
  default: "Thank you for your healthcare question. While I can provide general health information, I'm not able to diagnose conditions or provide medical advice. For any health concerns, please:\n\n1. **Consult a healthcare professional** for personalized advice\n2. Visit your nearest **Primary Healthcare Center (PHC)**\n3. In emergencies, call **emergency services immediately**\n\nIs there any general health topic I can help you learn more about?"
};

// Get response based on query
const getHealthcareResponse = (query) => {
  const lowerQuery = query.toLowerCase();
  
  // Greetings
  if (lowerQuery.match(/^(hi|hello|hey|good\s*(morning|afternoon|evening))/)) {
    return HEALTHCARE_RESPONSES.greeting[Math.floor(Math.random() * HEALTHCARE_RESPONSES.greeting.length)];
  }
  
  // Emergency conditions - check first!
  if (lowerQuery.includes('emergency') || lowerQuery.includes('urgent') || lowerQuery.includes('ambulance') || lowerQuery.includes('dying')) {
    return HEALTHCARE_RESPONSES.emergency;
  }
  
  // Heart attack
  if (lowerQuery.includes('heart attack') || lowerQuery.includes('cardiac arrest') || 
      (lowerQuery.includes('chest pain') && (lowerQuery.includes('severe') || lowerQuery.includes('crush')))) {
    return HEALTHCARE_RESPONSES.heartAttack;
  }
  
  // Stroke
  if (lowerQuery.includes('stroke') || lowerQuery.includes('paralysis') || 
      (lowerQuery.includes('face') && lowerQuery.includes('droop')) ||
      (lowerQuery.includes('arm') && lowerQuery.includes('weak') && lowerQuery.includes('sudden'))) {
    return HEALTHCARE_RESPONSES.stroke;
  }
  
  // Seizure
  if (lowerQuery.includes('seizure') || lowerQuery.includes('convulsion') || lowerQuery.includes('epilep') || lowerQuery.includes('fit')) {
    return HEALTHCARE_RESPONSES.seizure;
  }
  
  // Women's Health - Pregnancy
  if (lowerQuery.includes('pregnan') || lowerQuery.includes('prenatal') || lowerQuery.includes('trimester') ||
      lowerQuery.includes('fetal') || lowerQuery.includes('morning sickness') || lowerQuery.includes('labor') ||
      lowerQuery.includes('delivery') || lowerQuery.includes('c-section') || lowerQuery.includes('cesarean') ||
      lowerQuery.includes('preeclampsia') || lowerQuery.includes('gestational')) {
    return HEALTHCARE_RESPONSES.pregnancy;
  }
  
  // Women's Health - Periods/Menstrual
  if (lowerQuery.includes('period') || lowerQuery.includes('menstrua') || lowerQuery.includes('menstrual') ||
      (lowerQuery.includes('bleed') && (lowerQuery.includes('heavy') || lowerQuery.includes('irregular'))) ||
      lowerQuery.includes('cramp') || lowerQuery.includes('dysmenorrhea') || lowerQuery.includes('menorrhagia') ||
      lowerQuery.includes('spotting') || lowerQuery.includes('cycle')) {
    return HEALTHCARE_RESPONSES.periods;
  }
  
  // Women's Health - PCOS
  if (lowerQuery.includes('pcos') || lowerQuery.includes('pcod') || lowerQuery.includes('polycystic') ||
      (lowerQuery.includes('ovary') && lowerQuery.includes('cyst')) ||
      (lowerQuery.includes('irregular') && lowerQuery.includes('period') && (lowerQuery.includes('acne') || lowerQuery.includes('hair')))) {
    return HEALTHCARE_RESPONSES.pcos;
  }
  
  // Women's Health - Menopause
  if (lowerQuery.includes('menopause') || lowerQuery.includes('perimenopause') || lowerQuery.includes('hot flash') ||
      (lowerQuery.includes('period') && lowerQuery.includes('stop') && lowerQuery.includes('age'))) {
    return HEALTHCARE_RESPONSES.menopause;
  }
  
  // Common conditions
  if (lowerQuery.includes('fever') || lowerQuery.includes('temperature')) {
    return HEALTHCARE_RESPONSES.fever;
  }
  if (lowerQuery.includes('headache') || lowerQuery.includes('head pain') || lowerQuery.includes('migraine')) {
    return HEALTHCARE_RESPONSES.headache;
  }
  if (lowerQuery.includes('blood pressure') || lowerQuery.includes('bp') || lowerQuery.includes('hypertension') || lowerQuery.includes('hypotension')) {
    return HEALTHCARE_RESPONSES.bloodPressure;
  }
  if (lowerQuery.includes('diabetes') || lowerQuery.includes('sugar') || lowerQuery.includes('glucose') || lowerQuery.includes('insulin')) {
    return HEALTHCARE_RESPONSES.diabetes;
  }
  if (lowerQuery.includes('covid') || lowerQuery.includes('corona')) {
    return HEALTHCARE_RESPONSES.covid;
  }
  if (lowerQuery.includes('mental') || lowerQuery.includes('anxiety') || lowerQuery.includes('depress') || 
      lowerQuery.includes('stress') || lowerQuery.includes('panic')) {
    return HEALTHCARE_RESPONSES.mentalHealth;
  }
  if (lowerQuery.includes('thyroid') || lowerQuery.includes('hypothyroid') || lowerQuery.includes('hyperthyroid') || lowerQuery.includes('tsh')) {
    return HEALTHCARE_RESPONSES.thyroid;
  }
  if (lowerQuery.includes('asthma') || lowerQuery.includes('wheez') || lowerQuery.includes('inhaler') ||
      (lowerQuery.includes('breath') && lowerQuery.includes('difficult'))) {
    return HEALTHCARE_RESPONSES.asthma;
  }
  
  return HEALTHCARE_RESPONSES.default;
};

// Non-healthcare response
const NON_HEALTHCARE_RESPONSE = `I'm sorry, but I can only assist with **healthcare-related questions**. 

I'm designed to provide general health information about:
- 🏥 Common health conditions and symptoms
- 💊 General wellness and prevention tips
- 🩺 Understanding vital signs and health metrics
- 🚨 When to seek medical attention
- 🧠 Mental health awareness

Please ask me something related to healthcare, and I'll be happy to help!

⚠️ *Remember: For any medical concerns, always consult a qualified healthcare professional.*`;

/**
 * @route   POST /api/chatbot/message
 * @desc    Send message to healthcare chatbot
 * @access  Public (with optional auth for history)
 */
router.post('/message', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const startTime = Date.now();

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const chatSessionId = sessionId || `session-${Date.now()}`;
    const isHealthcare = isHealthcareRelated(message);

    // Save user message (demo mode compatible)
    if (isMongoConnected()) {
      await ChatMessage.create({
        sessionId: chatSessionId,
        role: 'user',
        content: message,
        isHealthcareRelated: isHealthcare
      });
    } else {
      demoStore.chatMessages.create({
        sessionId: chatSessionId,
        role: 'user',
        content: message,
        isHealthcareRelated: isHealthcare
      });
    }

    let response;
    let model = 'rule-based';

    if (!isHealthcare) {
      response = NON_HEALTHCARE_RESPONSE;
    } else if (openai) {
      // Use OpenAI for healthcare questions
      try {
        let conversation = [];
        if (isMongoConnected()) {
          conversation = await ChatMessage.getConversation(chatSessionId, 10);
        } else {
          conversation = demoStore.chatMessages.find({ sessionId: chatSessionId }).slice(-10);
        }
        
        const messages = [
          { role: 'system', content: CHATBOT_SYSTEM_PROMPT },
          ...conversation.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: message }
        ];

        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 500,
          temperature: 0.7
        });

        response = completion.choices[0].message.content;
        model = 'gpt-3.5-turbo';
      } catch (error) {
        console.error('OpenAI error:', error);
        response = getHealthcareResponse(message);
      }
    } else {
      // Use rule-based responses
      response = getHealthcareResponse(message);
    }

    // Save assistant response (demo mode compatible)
    let assistantMessage;
    const messageData = {
      sessionId: chatSessionId,
      role: 'assistant',
      content: response,
      isHealthcareRelated: isHealthcare,
      metadata: {
        responseTime: Date.now() - startTime,
        model
      }
    };

    if (isMongoConnected()) {
      assistantMessage = await ChatMessage.create(messageData);
    } else {
      assistantMessage = demoStore.chatMessages.create(messageData);
    }

    res.json({
      success: true,
      data: {
        sessionId: chatSessionId,
        message: response,
        isHealthcareRelated: isHealthcare,
        timestamp: assistantMessage.createdAt
      },
      disclaimer: 'This is an AI assistant providing general health information only. It is NOT a substitute for professional medical advice.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/chatbot/history/:sessionId
 * @desc    Get chat history for session
 * @access  Public
 */
router.get('/history/:sessionId', async (req, res) => {
  try {
    let messages;
    if (isMongoConnected()) {
      messages = await ChatMessage.getConversation(req.params.sessionId, 50);
    } else {
      messages = demoStore.chatMessages.find({ sessionId: req.params.sessionId });
    }
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   DELETE /api/chatbot/history/:sessionId
 * @desc    Clear chat history
 * @access  Public
 */
router.delete('/history/:sessionId', async (req, res) => {
  try {
    if (isMongoConnected()) {
      await ChatMessage.deleteMany({ sessionId: req.params.sessionId });
    } else {
      demoStore.chatMessages.deleteMany({ sessionId: req.params.sessionId });
    }
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
