import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      // Theme settings
      theme: 'light', // 'light', 'dark', 'system'
      accentColor: '#0891b2',
      
      // Notification settings
      notifications: {
        email: true,
        push: true,
        criticalAlerts: true,
        queueUpdates: true,
        sound: true,
      },
      
      // Language settings
      language: 'en-US',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      
      // Unread notifications count
      unreadCount: 3,
      
      // Notification list
      notificationsList: [
        {
          id: 1,
          type: 'critical',
          title: 'Critical Patient Alert',
          message: 'Patient Ramesh Kumar (Token #A005) has critical vital signs',
          time: new Date(Date.now() - 5 * 60000).toISOString(),
          read: false,
        },
        {
          id: 2,
          type: 'queue',
          title: 'Queue Update',
          message: '5 new patients added to the queue',
          time: new Date(Date.now() - 15 * 60000).toISOString(),
          read: false,
        },
        {
          id: 3,
          type: 'info',
          title: 'System Update',
          message: 'AI Risk Engine has been updated to v2.1',
          time: new Date(Date.now() - 60 * 60000).toISOString(),
          read: false,
        },
      ],

      // Actions
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          // System preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },

      setAccentColor: (color) => {
        set({ accentColor: color });
        // Apply accent color to CSS variable
        document.documentElement.style.setProperty('--color-primary', color);
      },

      setNotificationSetting: (key, value) => {
        set((state) => ({
          notifications: { ...state.notifications, [key]: value },
        }));
      },

      setLanguage: (language) => set({ language }),
      setTimezone: (timezone) => set({ timezone }),
      setDateFormat: (dateFormat) => set({ dateFormat }),

      addNotification: (notification) => {
        set((state) => ({
          notificationsList: [
            {
              id: Date.now(),
              time: new Date().toISOString(),
              read: false,
              ...notification,
            },
            ...state.notificationsList,
          ],
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notificationsList: state.notificationsList.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notificationsList: state.notificationsList.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      clearNotifications: () => {
        set({ notificationsList: [], unreadCount: 0 });
      },

      // Get translation helper
      t: (key) => {
        const { language } = get();
        const translations = {
          'en-US': {
            // Navigation
            dashboard: 'Dashboard', settings: 'Settings', logout: 'Logout', save: 'Save',
            assessment: 'Assessment', queue: 'Queue', analytics: 'Analytics', chatbot: 'AI Assistant',
            // Settings sections
            profile: 'Profile', notifications: 'Notifications', security: 'Security',
            appearance: 'Appearance', language: 'Language', theme: 'Theme',
            // Common actions
            welcomeBack: 'Welcome back', refresh: 'Refresh', cancel: 'Cancel', confirm: 'Confirm',
            add: 'Add', edit: 'Edit', delete: 'Delete', search: 'Search',
            // Risk levels
            critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low',
            // Clinical terms
            patientName: 'Patient Name', age: 'Age', gender: 'Gender',
            vitals: 'Vital Signs', heartRate: 'Heart Rate', bloodPressure: 'Blood Pressure',
            temperature: 'Temperature', oxygenSaturation: 'Oxygen Saturation',
            respiratoryRate: 'Respiratory Rate', chiefComplaint: 'Chief Complaint',
            // Assessment
            riskAssessment: 'Risk Assessment', urgencyScore: 'Urgency Score',
            news2Score: 'NEWS2 Score', qsofaScore: 'qSOFA Score',
            criticalAlerts: 'Critical Alerts', recommendations: 'Recommendations',
            // Queue
            waiting: 'Waiting', serving: 'Now Serving', completed: 'Completed',
            estimatedWait: 'Estimated Wait', position: 'Position',
          },
          'hi-IN': {
            // Navigation
            dashboard: 'डैशबोर्ड', settings: 'सेटिंग्स', logout: 'लॉग आउट', save: 'सहेजें',
            assessment: 'मूल्यांकन', queue: 'कतार', analytics: 'विश्लेषण', chatbot: 'AI सहायक',
            // Settings sections
            profile: 'प्रोफ़ाइल', notifications: 'सूचनाएं', security: 'सुरक्षा',
            appearance: 'दिखावट', language: 'भाषा', theme: 'थीम',
            // Common actions
            welcomeBack: 'वापसी पर स्वागत है', refresh: 'रिफ्रेश', cancel: 'रद्द करें', confirm: 'पुष्टि करें',
            add: 'जोड़ें', edit: 'संपादित करें', delete: 'हटाएं', search: 'खोजें',
            // Risk levels
            critical: 'गंभीर', high: 'उच्च', medium: 'मध्यम', low: 'निम्न',
            // Clinical terms
            patientName: 'रोगी का नाम', age: 'आयु', gender: 'लिंग',
            vitals: 'जीवन संकेत', heartRate: 'हृदय गति', bloodPressure: 'रक्तचाप',
            temperature: 'तापमान', oxygenSaturation: 'ऑक्सीजन संतृप्ति',
            respiratoryRate: 'श्वसन दर', chiefComplaint: 'मुख्य शिकायत',
            // Assessment
            riskAssessment: 'जोखिम मूल्यांकन', urgencyScore: 'तात्कालिकता स्कोर',
            news2Score: 'NEWS2 स्कोर', qsofaScore: 'qSOFA स्कोर',
            criticalAlerts: 'गंभीर अलर्ट', recommendations: 'सिफारिशें',
            // Queue
            waiting: 'प्रतीक्षा में', serving: 'अभी सेवा में', completed: 'पूर्ण',
            estimatedWait: 'अनुमानित प्रतीक्षा', position: 'स्थान',
          },
          'es-ES': {
            // Navigation
            dashboard: 'Panel', settings: 'Configuración', logout: 'Cerrar sesión', save: 'Guardar',
            assessment: 'Evaluación', queue: 'Cola', analytics: 'Análisis', chatbot: 'Asistente IA',
            // Settings sections
            profile: 'Perfil', notifications: 'Notificaciones', security: 'Seguridad',
            appearance: 'Apariencia', language: 'Idioma', theme: 'Tema',
            // Common actions
            welcomeBack: 'Bienvenido de nuevo', refresh: 'Actualizar', cancel: 'Cancelar', confirm: 'Confirmar',
            add: 'Agregar', edit: 'Editar', delete: 'Eliminar', search: 'Buscar',
            // Risk levels
            critical: 'Crítico', high: 'Alto', medium: 'Medio', low: 'Bajo',
            // Clinical terms
            patientName: 'Nombre del paciente', age: 'Edad', gender: 'Género',
            vitals: 'Signos vitales', heartRate: 'Frecuencia cardíaca', bloodPressure: 'Presión arterial',
            temperature: 'Temperatura', oxygenSaturation: 'Saturación de oxígeno',
            respiratoryRate: 'Frecuencia respiratoria', chiefComplaint: 'Queja principal',
            // Assessment
            riskAssessment: 'Evaluación de riesgo', urgencyScore: 'Puntuación de urgencia',
            news2Score: 'Puntuación NEWS2', qsofaScore: 'Puntuación qSOFA',
            criticalAlerts: 'Alertas críticas', recommendations: 'Recomendaciones',
            // Queue
            waiting: 'En espera', serving: 'Atendiendo ahora', completed: 'Completado',
            estimatedWait: 'Espera estimada', position: 'Posición',
          },
          'fr-FR': {
            // Navigation
            dashboard: 'Tableau de bord', settings: 'Paramètres', logout: 'Déconnexion', save: 'Enregistrer',
            assessment: 'Évaluation', queue: "File d'attente", analytics: 'Analyses', chatbot: 'Assistant IA',
            // Settings sections
            profile: 'Profil', notifications: 'Notifications', security: 'Sécurité',
            appearance: 'Apparence', language: 'Langue', theme: 'Thème',
            // Common actions
            welcomeBack: 'Bienvenue', refresh: 'Actualiser', cancel: 'Annuler', confirm: 'Confirmer',
            add: 'Ajouter', edit: 'Modifier', delete: 'Supprimer', search: 'Rechercher',
            // Risk levels
            critical: 'Critique', high: 'Élevé', medium: 'Moyen', low: 'Faible',
            // Clinical terms
            patientName: 'Nom du patient', age: 'Âge', gender: 'Genre',
            vitals: 'Signes vitaux', heartRate: 'Fréquence cardiaque', bloodPressure: 'Pression artérielle',
            temperature: 'Température', oxygenSaturation: "Saturation en oxygène",
            respiratoryRate: 'Fréquence respiratoire', chiefComplaint: 'Plainte principale',
            // Assessment
            riskAssessment: 'Évaluation des risques', urgencyScore: "Score d'urgence",
            news2Score: 'Score NEWS2', qsofaScore: 'Score qSOFA',
            criticalAlerts: 'Alertes critiques', recommendations: 'Recommandations',
            // Queue
            waiting: 'En attente', serving: 'En cours de service', completed: 'Terminé',
            estimatedWait: "Attente estimée", position: 'Position',
          },
        };
        return translations[language]?.[key] || translations['en-US'][key] || key;
      },
    }),
    {
      name: 'health-triage-settings',
    }
  )
);

// Initialize theme on load
const initializeTheme = () => {
  const { theme } = useSettingsStore.getState();
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }
  }
};

// Run on import
if (typeof window !== 'undefined') {
  initializeTheme();
}
