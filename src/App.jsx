import Notes from "./Notes";
import Upload from "./Upload";
import Notes from "./Notes";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MockTests from "./MockTests"; // path must match where you saved the file
import React, { useState, useEffect } from 'react';
import { db } from "./firebase";
import { ChevronDown, ChevronRight, X, FileText, File, BookOpen, Layers, ListTodo, Sun, Moon } from 'lucide-react'; // Added Sun and Moon icons

// Define global variables for Firebase configuration (provided by the environment)
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-rbi-app';

function App() {
    // Firebase state management
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [storage, setStorage] = useState(null);
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Navigation and UI state
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [message, setMessage] = useState('');
    const [showMessage, setShowMessage] = useState(false);
    const [expandedItems, setExpandedItems] = useState({}); // For syllabus and news timeline expansion

    // Study Plan states
    const [studyPlans, setStudyPlans] = useState([]);
    const [newPlanName, setNewPlanName] = useState('');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [newTaskContent, setNewTaskContent] = useState('');
    const [planEnhancementFeedback, setPlanEnhancementFeedback] = useState('');
    const [planEnhancementLoading, setPlanEnhancementLoading] = useState(false);

    // Notes states
    const [notes, setNotes] = useState([]);
    const [showAddNoteModal, setShowAddNoteModal] = useState(false);
    const [currentViewingNote, setCurrentViewingNote] = useState(null);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [noteTitle, setNoteTitle] = useState('');
    const [newNoteContent, setNewNoteContent] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [showStorageRulesMessage, setShowStorageRulesMessage] = useState(false); // To warn about storage rules
    // For mapping notes to syllabus
    const [selectedNotePhase, setSelectedNotePhase] = useState('');
    const [selectedNoteSubject, setSelectedNoteSubject] = useState('');
    const [selectedNoteChapter, setSelectedNoteChapter] = useState('');
    const [currentAffairsDateInput, setCurrentAffairsDateInput] = useState(''); // Specific for current affairs notes
    // For hierarchical note view
    const [noteViewLevel, setNoteViewLevel] = useState('phases'); // 'phases', 'subjects', 'chapters', 'notesList'
    const [currentNotePhase, setCurrentNotePhase] = useState(null);
    const [currentNoteSubject, setCurrentNoteSubject] = useState(null);
    const [currentNoteChapter, setCurrentNoteChapter] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // For searching notes

    // Mock Test states
    const [mockTestViewLevel, setMockTestViewLevel] = useState('phases'); // 'phases', 'subjects', ‘chapters’
    const [currentMockTestPhase, setCurrentMockTestPhase] = useState(null);
    const [currentMockTestSubject, setCurrentMockTestSubject] = useState(null);
    const [currentMockTestChapter, setCurrentMockTestChapter] = useState(null);
    const [generatedTestQuestions, setGeneratedTestQuestions] = useState([]);
    const [isTestLoading, setIsTestLoading] = useState(false);
    const [currentTestChapter, setCurrentTestChapter] = useState(null); // The actual chapter for the test being taken
    const [currentTestSubject, setCurrentTestSubject] = useState(null);
    const [currentTestPhase, setCurrentTestPhase] = useState(null);
    const [testAnswers, setTestAnswers] = useState({});
    const [testResults, setTestResults] = useState(null);
    const [testResultsHistory, setTestResultsHistory] = useState([]); // History of all past test attempts

    // AI Expert states
    const [llmQuestion, setLlmQuestion] = useState('');
    const [llmAnswer, setLlmAnswer] = useState('');
    const [llmLoading, setLlmLoading] = useState(false);

    // Essay Evaluator states
    const [essayInput, setEssayInput] = useState('');
    const [essayFeedback, setEssayFeedback] = useState('');
    const [essayLoading, setEssayLoading] = useState(false);

    // Chapter Progress states (for syllabus tracking)
    const [chapterProgress, setChapterProgress] = useState({});

    // Daily Financial News states
    const [dailyNews, setDailyNews] = useState([]);
    const [showAddNewsModal, setShowAddNewsModal] = useState(false);
    const [newNewsDate, setNewNewsDate] = useState('');
    const [newNewsSummary, setNewNewsSummary] = useState('');
    const [newsPhase, setNewsPhase] = useState('');
    const [newsSubject, setNewNewsSubject] = useState('');
    const [newsChapter, setNewNewsChapter] = useState('');
    const [newsCategory, setNewNewsCategory] = useState(''); // New: Category for news
    const [currentNewsCategoryFilter, setCurrentNewsCategoryFilter] = useState('All'); // Filter for news display
    const [currentViewingNewsItem, setCurrentViewingNewsItem] = useState(null);
    const [showNewsDetailModal, setShowNewsDetailModal] = useState(false);

    // Daily Targets (Gamification) states
    const [dailyTargetHours, setDailyTargetHours] = useState(0);
    const [loggedHoursToday, setLoggedHoursToday] = useState(0);
    const [currentDayTarget, setCurrentDayTarget] = useState(0); // Firestore data for today's target
    const [currentDayLogged, setCurrentDayLogged] = useState(0); // Firestore data for today's logged hours

    // Helper to toggle expansion of items (syllabus, news timeline)
    const toggleItem = (path) => {
        setExpandedItems(prev => ({ ...prev, [path]: !prev[path] }));
    };

    // Helper for displaying transient messages
    const showMessageModal = (msg) => {
        setMessage(msg);
        setShowMessage(true);
        setTimeout(() => {
            setShowMessage(false);
            setMessage('');
        }, 3000);
    };

    // RBI Syllabus data structure
    const rbiSyllabus = {
        "Phase I": {
            title: "Phase I (Prelims)",
            sections: [
                {
                    name: "General Awareness",
                    topics: [
                        "Current Affairs (Date-wise)",
                        "Indian Financial System",
                        "Indian Banking System",
                        "Monetary Plans",
                        "National Institutions",
                        "Banking Terms",
                        "Static GK (History, Geography, Polity, Science, etc.)"
                    ]
                },
                {
                    name: "Quantitative Aptitude",
                    topics: [
                        "Data Interpretation (Tables, Graphs, Caselets)",
                        "Number Series",
                        "Simplification & Approximation",
                        "Quadratic Equations",
                        "Profit & Loss",
                        "Simple & Compound Interest",
                        "Time & Work",
                        "Time, Speed & Distance",
                        "Ratio & Proportion",
                        "Percentage",
                        "Average",
                        "Mensuration",
                        "Permutation & Combination",
                        "Probability"
                    ]
                },
                {
                    name: "Reasoning Ability",
                    topics: [
                        "Puzzles (Seating Arrangement, Floor, Box, etc.)",
                        "Syllogism",
                        "Inequalities",
                        "Coding-Decoding",
                        "Blood Relations",
                        "Direction Sense",
                        "Data Sufficiency",
                        "Input-Output",
                        "Alphanumeric Series",
                        "Verbal Reasoning"
                    ]
                },
                {
                    name: "English Language",
                    topics: [
                        "Reading Comprehension",
                        "Cloze Test",
                        "Para Jumbles",
                        "Error Spotting",
                        "Fill in the Blanks",
                        "Sentence Correction",
                        "Vocabulary (Synonyms, Antonyms)"
                    ]
                },
                {
                    name: "Phase I - Others",
                    topics: [
                        "General knowledge, Current events not covered elsewhere",
                        "Computer knowledge basics (if applicable)"
                    ]
                }
            ]
        },
        "Phase II": {
            title: "Phase II (Mains)",
            sections: [
                {
                    name: "Economic and Social Issues (ESI)",
                    topics: [
                        "Growth and Development: Measurement of Growth – National Income and per capita income",
                        "Growth and Development: Poverty Alleviation and Employment Generation in India – status, challenges, initiatives",
                        "Growth and Development: Sustainable Development and Environmental issues – concepts, policies, international agreements",
                        "Indian Economy: Economic History of India – pre and post-independence overview",
                        "Indian Economy: Changes in Industrial Policy, Liberalization, Privatization, Globalization (LPG Reforms)",
                        "Indian Economy: Inflation – Definition, Trends, Estimates, Consequences, and Remedies",
                        "Indian Economy: Economic Reforms in India – Financial Sector Reforms, External Sector Reforms (Trade & Capital Account Convertibility)",
                        "Indian Economy: Industrial and Labour Policy – recent changes, impact",
                        "Indian Economy: Monetary and Fiscal Policy – meaning, objectives, instruments, recent stance",
                        "Indian Economy: Privatization – Disinvestment policy and its implications",
                        "Indian Economy: Role of Economic Planning in India – NITI Aayog, Five-Year Plans (historical context)",
                        "Indian Economy: Agriculture and Rural Development – Issues, challenges, government initiatives (schemes, policies)",
                        "Indian Economy: Union Budget – Concepts, Approach, and Broad Trends (recent budget analysis)",
                        "Globalization: Opening up of the Indian Economy – historical context and impact",
                        "Globalization: Balance of Payments (BOP), Export-Import Policy – concepts, current trends",
                        "Globalization: International Economic Institutions – IMF, World Bank, WTO, ADB, AIIB – roles and functions",
                        "Globalization: Regional Economic Cooperation – various blocs, agreements (e.g., SAARC, ASEAN)",
                        "Social Structure in India: Multiculturalism – challenges and strengths",
                        "Social Structure in India: Demographic Trends – population growth, age structure, demographic dividend",
                        "Social Structure in India: Urbanization and Migration – causes, challenges and policies (e.g., Smart Cities)",
                        "Social Structure in India: Gender Issues – empowerment, equality, laws, government schemes",
                        "Social Structure in India: Social Justice: Positive Discrimination in favour of the underprivileged – reservations, affirmative action",
                        "Social Structure in India: Social Movements – types, causes, impacts (e.g., environmental, farmers')",
                        "Social Structure in India: Indian Political System – basics of governance, constitutional framework",
                        "Social Structure in India: Human Development – Human Development Index (HDI), challenges in India",
                        "Social Structure in India: Social Sectors in India: Health and Education initiatives and policies (e.g., Ayushman Bharat, NEP)"
                    ]
                },
                {
                    name: "English (Writing Skills)",
                    topics: [
                        "Essay Writing",
                        "Precis Writing",
                        "Reading Comprehension (Descriptive Answers)"
                    ]
                },
                {
                    name: "Finance",
                    topics: [
                        "Chapter 1: Introduction to the Indian Financial System",
                        "Chapter 2A: Time Value of Money",
                        "Chapter 2B: Primary and Secondary Market – Bond Market",
                        "Chapter 3A: Basics of Derivatives – Futures, Forwards and Swaps",
                        "Chapter 3B: Basics of Derivatives – Options",
                        "Chapter 4: Primary and Secondary Market – Equity Market",
                        "Chapter 5: Primary and Secondary Market – Debt Market",
                        "Chapter 6: Primary and Secondary Market – Forex Market",
                        "Chapter 7: Alternate Sources of Finance",
                        "Chapter 8: Banking System in India – Structure and Developments",
                        "Chapter 9: RBI and Its Functions",
                        "Chapter 10: Financial Institution",
                        "Chapter 11: Non-Banking System",
                        "Chapter 12: Financial Inclusion",
                        "Chapter 13: Development in the Digital Payment System",
                        "Chapter 14: Role of IT in Banking and Financial System",
                        "Chapter 15: Corporate Governance in Banks",
                        "Chapter 16: Global Financial System and International Banking",
                        "Chapter 17: Financial Risk Management",
                        "Chapter 18: Introduction to Basics of Accounting",
                        "Chapter 19: Financial Statement – Income Statement (P&L Account)",
                        "Chapter 20: Financial Statement – Balance Sheet",
                        "Chapter 21: Financial Statement – Cash Flow",
                        "Chapter 22: Ratios Analysis",
                        "Chapter 23: Union Budget – Concepts, Approach and Broad Trend",
                        "Chapter 24: Inflation",
                        "Chapter 25: Public Private Partnership",
                        "Chapter 26: Recent Developments in the Global Financial System and its Impact on Indian Financial System",
                        "Chapter 27: Descriptive Q&A on Important Reports and Current Affairs",
                        "Chapter 28: Fringe Topics"
                    ]
                },
                {
                    name: "Management",
                    topics: [
                        "Chapter 1: Motivation Part 1",
                        "Chapter 2: Motivation Part 2",
                        "Chapter 2A: Science and Art of Descriptive Writing",
                        "Chapter 3: Communication",
                        "Chapter 4: Leadership Part 1",
                        "Chapter 5: Leadership Part 2",
                        "Chapter 6: General Management Part 1",
                        "Chapter 7: General Management Part 2",
                        "Chapter 8: General Management Part 3",
                        "Chapter 9: General Management Part 4",
                        "Chapter 10: Fundamentals of Organizational Behaviour",
                        "Chapter 11: Personality and Perception",
                        "Chapter 12: Emotional Intelligence and Interpersonal Behaviour",
                        "Chapter 13: Conflict",
                        "Chapter 14: Organizational Change",
                        "Chapter 15: Corporate Governance",
                        "Chapter 16: Ethics",
                        "Chapter 17: Fringe Topics"
                    ]
                }
            ]
        },
        "Phase III": {
            title: "Phase III (Interview)",
            sections: [
                {
                    name: "Interview",
                    topics: [
                        "Personality Assessment",
                        "General Knowledge and Current Affairs related to Banking and Economy",
                        "Understanding of RBI's role and functions",
                        "Leadership qualities and communication skills",
                        "Situational and Behavioral Questions"
                    ]
                },
                {
                    name: "Phase III - Others",
                    topics: [
                        "Group Discussions (if applicable)",
                        "Psychometric Test related preparation"
                    ]
                }
            ]
        }
    };

    // Function to pre-populate sample data if the user has no existing data
    const populateInitialData = async (firestore, currentUserId) => {
        if (!firestore || !currentUserId) return;

        // Collection references for various data types
        const dailyNewsCollectionRef = collection(firestore, `artifacts/${appId}/users/${currentUserId}/dailyFinancialNews`);
        const notesCollectionRef = collection(firestore, `artifacts/${appId}/users/${currentUserId}/notes`);
        const chapterProgressCollectionRef = collection(firestore, `artifacts/${appId}/users/${currentUserId}/chapterProgress`);
        const dailyTargetsCollectionRef = collection(firestore, `artifacts/${appId}/users/${currentUserId}/dailyTargets`);

        // Check for existing data to prevent re-population on every load
        const existingNewsSnapshot = await getDocs(query(dailyNewsCollectionRef));
        const existingNotesSnapshot = await getDocs(query(notesCollectionRef));
        const existingProgressSnapshot = await getDocs(query(chapterProgressCollectionRef));
        const existingTargetsSnapshot = await getDocs(query(dailyTargetsCollectionRef));

        if (!existingNewsSnapshot.empty || !existingNotesSnapshot.empty || !existingProgressSnapshot.empty || !existingTargetsSnapshot.empty) {
            console.log("Existing data found, skipping initial population.");
            return;
        }

        console.log("Populating initial data...");

        // Sample Daily Financial News with Categories
        const sampleNews = [
            {
                date: "2025-06-18",
                summaryText: "RBI releases new guidelines for digital lending platforms, emphasizing consumer protection and transparency in loan practices.",
                phase: "Phase I",
                subject: "General Awareness",
                chapter: "Monetary Plans",
                category: "RBI News",
                createdAt: new Date("2025-06-18T09:30:00Z").toISOString()
            },
            {
                date: "2025-06-17",
                summaryText: "Union Finance Minister holds pre-budget consultations with economists and industry leaders, focusing on fiscal consolidation and growth drivers.",
                phase: "Phase II",
                subject: "Economic and Social Issues (ESI)",
                chapter: "Indian Economy: Union Budget – Concepts, Approach, and Broad Trends (recent budget analysis)",
                category: "Current Finance News",
                createdAt: new Date("2025-06-17T10:00:00Z").toISOString()
            },
            {
                date: "2025-06-17",
                summaryText: "Press Information Bureau (PIB) highlights successful implementation of the National Education Policy (NEP) initiatives across various states.",
                phase: "Phase II",
                subject: "Economic and Social Issues (ESI)",
                chapter: "Social Sectors in India: Health and Education initiatives and policies (e.g., Ayushman Bharat, NEP)",
                category: "PIB News",
                createdAt: new Date("2025-06-17T11:00:00Z").toISOString()
            },
            {
                date: "2025-06-16",
                summaryText: "RBI's latest report indicates a healthy growth in foreign exchange reserves, providing stability amidst global economic fluctuations.",
                phase: "Phase I",
                subject: "General Awareness",
                chapter: "Indian Financial System",
                category: "RBI News",
                createdAt: new Date("2025-06-16T10:30:00Z").toISOString()
            },
            {
                date: "2025-06-15",
                summaryText: "Government of India unveils new incentives for green energy projects, aiming to boost renewable energy capacity and sustainable development.",
                phase: "Phase II",
                subject: "Economic and Social Issues (ESI)",
                chapter: "Growth and Development: Sustainable Development and Environmental issues – concepts, policies, international agreements",
                category: "Current Finance News",
                createdAt: new Date("2025-06-15T12:00:00Z").toISOString()
            },
            {
                date: "2025-06-14",
                summaryText: "PIB announces new skill development programs targeting rural youth under the 'Skill India' initiative to enhance employability.",
                phase: "Phase II",
                subject: "Economic and Social Issues (ESI)",
                chapter: "Growth and Development: Poverty Alleviation and Employment Generation in India – status, challenges, initiatives",
                category: "PIB News",
                createdAt: new Date("2025-06-14T14:00:00Z").toISOString()
            },
            {
                date: "2025-06-13",
                summaryText: "Indian equities market shows strong performance this week, driven by positive corporate earnings and sustained foreign institutional investment.",
                phase: "Phase II",
                subject: "Finance",
                chapter: "Chapter 4: Primary and Secondary Market – Equity Market",
                category: "Current Finance News",
                createdAt: new Date("2025-06-13T16:00:00Z").toISOString()
            },
            {
                date: "2025-06-12",
                summaryText: "RBI conducts special open market operations to inject liquidity into the banking system, addressing short-term funding needs.",
                phase: "Phase I",
                subject: "General Awareness",
                chapter: "Monetary Plans",
                category: "RBI News",
                createdAt: new Date("2025-06-12T11:00:00Z").toISOString()
            },
            {
                date: "2025-06-11",
                summaryText: "PIB report details the progress of the 'Make in India' initiative, highlighting growth in manufacturing and job creation in key sectors.",
                phase: "Phase II",
                subject: "Economic and Social Issues (ESI)",
                chapter: "Indian Economy: Changes in Industrial Policy, Liberalization, Privatization, Globalization (LPG Reforms)",
                category: "PIB News",
                createdAt: new Date("2025-06-11T13:00:00Z").toISOString()
            },
            {
                date: "2025-06-10",
                summaryText: "Global crude oil prices stabilize after recent volatility, providing relief to India's import bill and inflation outlook.",
                phase: "Phase II",
                subject: "Economic and Social Issues (ESI)",
                chapter: "Globalization: Balance of Payments (BOP), Export-Import Policy – concepts, current trends",
                category: "Current Finance News",
                createdAt: new Date("2025-06-10T09:00:00Z").toISOString()
            }
        ];

        // Sample Notes
        const sampleNotes = [
            {
                title: "Key Concepts of Inflation",
                content: "Inflation refers to the sustained increase in the general price level of goods and services in an economy over a period of time. It reduces the purchasing power of currency. Main types: Demand-Pull (excess demand) and Cost-Push (supply shocks, increased production costs). Measures: CPI (Consumer Price Index) and WPI (Wholesale Price Index). RBI primarily uses CPI for policy decisions. Tools to control inflation: monetary policy (repo rate, CRR, OMO) and fiscal policy (government spending, taxation).",
                phase: "Phase II",
                subject: "Economic and Social Issues (ESI)",
                chapter: "Indian Economy: Inflation – Definition, Trends, Estimates, Consequences, and Remedies",
                createdAt: new Date("2025-06-10T14:00:00Z").toISOString()
            },
            {
                title: "Basics of Repo Rate",
                content: "The Repo Rate (Repurchase Option Rate) is the rate at which the Reserve Bank of India (RBI) lends money to commercial banks in India against government securities. It is a key monetary policy tool used by the RBI to control inflation and manage liquidity in the economy. An increase in the repo rate makes borrowing more expensive for banks, leading to higher lending rates for consumers and businesses, thus curbing inflation.",
                phase: "Phase I",
                subject: "General Awareness",
                chapter: "Banking Terms",
                createdAt: new Date("2025-06-09T16:30:00Z").toISOString()
            },
            {
                title: "Leadership Styles Summary",
                content: "Effective leadership is crucial in management. Key styles include: \n1. Autocratic: Leader makes decisions independently. \n2. Democratic: Leader involves team in decision-making. \n3. Laissez-faire: Leader provides minimal guidance, allowing autonomy. \n4. Transformational: Inspires and motivates followers to achieve beyond expectations. \n5. Transactional: Focuses on supervision, organization, and performance through rewards and punishments. The best style depends on the situation and team maturity.",
                phase: "Phase II",
                subject: "Management",
                chapter: "Chapter 4: Leadership Part 1",
                createdAt: new Date("2025-06-08T11:00:00Z").toISOString()
            },
            {
                title: "Financial Inclusion Strategies",
                content: "Financial Inclusion aims to provide affordable financial services to all sections of society, especially vulnerable groups. Key initiatives in India include: Jan Dhan Yojana (no-frills accounts), Mudra Yojana (micro-loans), Atal Pension Yojana, Pradhan Mantri Jeevan Jyoti Bima Yojana (life insurance), Pradhan Mantri Suraksha Bima Yojana (accident insurance). Digital payments (UPI, AEPS) are also crucial for last-mile delivery.",
                phase: "Phase II",
                subject: "Finance",
                chapter: "Chapter 12: Financial Inclusion",
                createdAt: new Date("2025-06-07T09:00:00Z").toISOString()
            },
            {
                title: "Puzzles for Reasoning Ability - Tips",
                content: "Solving puzzles in Reasoning Ability requires systematic thinking. Tips: \n1. Read all conditions carefully before starting. \n2. Draw diagrams (e.g., seating arrangements, grids) to visualize information. \n3. Note down definite information first. \n4. Use deductions to eliminate possibilities. \n5. Identify keywords like 'not', 'only', 'either/or'. \n6. For complex puzzles, consider multiple cases or tables. Practice regularly to improve speed and accuracy.",
                phase: "Phase I",
                subject: "Reasoning Ability",
                chapter: "Puzzles (Seating Arrangement, Floor, Box, etc.)",
                createdAt: new Date("2025-06-06T15:00:00Z").toISOString()
            },
            {
                title: "Economic Current Affairs - Q1 2025",
                content: "Summary of key economic events and policy changes in Q1 2025, including inflation data, GDP growth projections, and major government economic announcements.",
                phase: "Phase I",
                subject: "General Awareness",
                chapter: "Current Affairs (Date-wise)",
                createdAt: new Date("2025-03-31T18:00:00Z").toISOString()
            },
            {
                title: "May 2025 Monetary Policy Highlights",
                content: "Key decisions from the RBI's May 2025 Monetary Policy Committee meeting. Focus on liquidity management, interest rate corridor, and new regulatory measures for NBFCs.",
                phase: "Phase I",
                subject: "General Awareness",
                chapter: "Current Affairs (Date-wise)",
                createdAt: new Date("2025-05-10T11:00:00Z").toISOString()
            },
            {
                title: "Indian Financial System Overview",
                content: "Detailed overview of the Indian financial system, covering its structure, key institutions (RBI, SEBI, IRDAI, PFRDA), financial markets (money market, capital market), and financial instruments.",
                phase: "Phase I",
                subject: "General Awareness",
                chapter: "Indian Financial System",
                createdAt: new Date("2025-06-01T09:00:00Z").toISOString()
            },
            {
                title: "Reading Comprehension Strategy",
                content: "Tips and strategies for excelling in Reading Comprehension sections of competitive exams. Focus on identifying main ideas, inferring meaning, and time management.",
                phase: "Phase I",
                subject: "English Language",
                chapter: "Reading Comprehension",
                createdAt: new Date("2025-06-05T10:00:00Z").toISOString()
            },
            {
                title: "DI Caselet Practice Set 1",
                content: "Practice questions for Data Interpretation Caselets, focusing on various types of data representation and logical deduction.",
                phase: "Phase I",
                subject: "Quantitative Aptitude",
                chapter: "Data Interpretation (Tables, Graphs, Caselets)",
                createdAt: new Date("2025-06-03T14:00:00Z").toISOString()
            }
        ];

        // Add sample news to Firestore
        for (const newsItem of sampleNews) {
            const docRef = doc(dailyNewsCollectionRef); // Let Firestore auto-generate ID
            await setDoc(docRef, newsItem);
        }
        console.log("Daily News populated.");

        // Add sample notes to Firestore
        for (const noteItem of sampleNotes) {
            const docRef = doc(notesCollectionRef); // Let Firestore auto-generate ID
            await setDoc(docRef, noteItem);
        }
        console.log("Notes populated.");

        // Sample Daily Targets (for today and yesterday for a simple streak check)
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]; // One day ago
        const sampleTargets = [
            {
                date: today,
                targetHours: 3,
                loggedHours: 1.5,
                updatedAt: new Date().toISOString()
            },
            {
                date: yesterday,
                targetHours: 4,
                loggedHours: 4,
                updatedAt: new Date(Date.now() - 86400000).toISOString()
            }
        ];

        // Add sample daily targets to Firestore
        for (const targetItem of sampleTargets) {
            const docRef = doc(dailyTargetsCollectionRef, targetItem.date); // Use date as document ID
            await setDoc(docRef, targetItem);
        }
        console.log("Daily Targets populated.");

        showMessageModal("Initial sample data loaded successfully!");
    };

    // --- Firebase Initialization and Authentication Effect ---
    useEffect(() => {
        // Load dark mode preference from localStorage
        const savedDarkMode = localStorage.getItem('rbi-dark-mode');
        if (savedDarkMode !== null) {
            setIsDarkMode(JSON.parse(savedDarkMode));
            document.documentElement.classList.toggle('dark', JSON.parse(savedDarkMode));
        }

        try {
            // Initialize Firebase App
            const app = initializeApp(firebaseConfig);
            const authInstance = getAuth(app);
            const firestoreInstance = getFirestore(app);
            const storageInstance = getStorage(app);

            // Set Firebase instances to state
            setAuth(authInstance);
            setDb(firestoreInstance);
            setStorage(storageInstance);

            // Listen for authentication state changes
            const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
                if (user) {
                    // User is signed in
                    setUserId(user.uid);
                    console.log("User authenticated:", user.uid);
                    await populateInitialData(firestoreInstance, user.uid); // Populate data only after user is set
                } else {
                    // No user is signed in, attempt anonymous or custom token sign-in
                    console.log("No user, attempting anonymous sign-in or custom token sign-in.");
                    try {
                        if (initialAuthToken) {
                            // Sign in with custom token if available
                            await signInWithCustomToken(authInstance, initialAuthToken);
                            setUserId(authInstance.currentUser?.uid);
                            await populateInitialData(firestoreInstance, authInstance.currentUser?.uid);
                        } else {
                            // Sign in anonymously as a fallback
                            const anonUser = await signInAnonymously(authInstance);
                            setUserId(anonUser.user.uid);
                            await populateInitialData(firestoreInstance, anonUser.user.uid);
                        }
                    } catch (error) {
                        console.error("Firebase Auth Error:", error);
                        showMessageModal(`Authentication failed: ${error.message}`);
                    }
                }
                setLoading(false); // Set loading to false once auth state is determined
            });

            // Cleanup function for the auth state listener
            return () => unsubscribe();
        } catch (error) {
            console.error("Firebase initialization failed:", error);
            showMessageModal(`Firebase initialization error: ${error.message}`);
            setLoading(false);
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    // --- Dark Mode Effect ---
    useEffect(() => {
        // Apply or remove 'dark' class to the documentElement based on isDarkMode state
        document.documentElement.classList.toggle('dark', isDarkMode);
        // Save preference to localStorage
        localStorage.setItem('rbi-dark-mode', JSON.stringify(isDarkMode));
    }, [isDarkMode]);

    // --- Firestore Data Listeners Effect ---
    // This effect runs whenever 'db' or 'userId' changes, ensuring data is fetched
    // and kept in sync for the currently authenticated user.
    useEffect(() => {
        if (db && userId) {
            // Study Plans listener
            const studyPlansCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/studyPlans`);
            const unsubscribeStudyPlans = onSnapshot(query(studyPlansCollectionRef), (snapshot) => {
                const plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setStudyPlans(plansData);
                console.log("Fetched study plans:", plansData);
            }, (error) => {
                console.error("Error fetching study plans:", error);
                showMessageModal(`Error fetching study plans: ${error.message}`);
            });

            // Notes listener
            const notesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/notes`);
            const unsubscribeNotes = onSnapshot(query(notesCollectionRef), (snapshot) => {
                const notesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setNotes(notesData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))); // Sort by creation date
                console.log("Fetched notes:", notesData);
            }, (error) => {
                console.error("Error fetching notes:", error);
                showMessageModal(`Error fetching notes: ${error.message}`);
            });

            // Test Results History listener
            const testResultsHistoryCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/quizResults`);
            const unsubscribeTestResultsHistory = onSnapshot(query(testResultsHistoryCollectionRef), (snapshot) => {
                const resultsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTestResultsHistory(resultsData.sort((a, b) => new Date(b.date) - new Date(a.date))); // Sort by date descending
            }, (error) => {
                console.error("Error fetching test results history:", error);
                showMessageModal(`Error fetching test results history: ${error.message}`);
            });

            // Chapter Progress listener
            const chapterProgressCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/chapterProgress`);
            const unsubscribeChapterProgress = onSnapshot(query(chapterProgressCollectionRef), (snapshot) => {
                const progressData = {};
                snapshot.docs.forEach(doc => {
                    progressData[doc.id] = doc.data();
                });
                setChapterProgress(progressData);
                console.log("Fetched chapter progress:", progressData);
            }, (error) => {
                console.error("Error fetching chapter progress:", error);
                showMessageModal(`Error fetching chapter progress: ${error.message}`);
            });

            // Daily Financial News listener
            const dailyNewsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/dailyFinancialNews`);
            const unsubscribeDailyNews = onSnapshot(query(dailyNewsCollectionRef), (snapshot) => {
                const newsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setDailyNews(newsData.sort((a, b) => new Date(b.date) - new Date(a.date))); // Sort by date descending
                console.log("Fetched daily financial news:", newsData);
            }, (error) => {
                console.error("Error fetching daily news:", error);
                showMessageModal(`Error fetching daily news: ${error.message}`);
            });

            // Daily Targets Listener (for today's target and logged hours)
            const todayDate = new Date().toISOString().split('T')[0];
            const dailyTargetDocRef = doc(db, `artifacts/${appId}/users/${userId}/dailyTargets/${todayDate}`);
            const unsubscribeDailyTarget = onSnapshot(dailyTargetDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCurrentDayTarget(data.targetHours || 0);
                    setCurrentDayLogged(data.loggedHours || 0);
                    setDailyTargetHours(data.targetHours || 0); // Update input field with current target
                    setLoggedHoursToday(data.loggedHours || 0); // Update input field with current logged
                } else {
                    // Reset if no target set for today
                    setCurrentDayTarget(0);
                    setCurrentDayLogged(0);
                    setDailyTargetHours(0);
                    setLoggedHoursToday(0);
                }
            }, (error) => {
                console.error("Error fetching daily target:", error);
                showMessageModal(`Error fetching daily target: ${error.message}`);
            });

            // Cleanup function for all listeners
            return () => {
                unsubscribeStudyPlans();
                unsubscribeNotes();
                unsubscribeTestResultsHistory();
                unsubscribeChapterProgress();
                unsubscribeDailyNews();
                unsubscribeDailyTarget();
            };
        }
    }, [db, userId]); // Dependencies ensure listeners re-attach if DB or user changes

    // --- Study Plan Functions ---
    const handleCreateStudyPlan = async () => {
        if (!newPlanName.trim()) {
            showMessageModal("Study plan name cannot be empty.");
            return;
        }
        if (!db || !userId) {
            showMessageModal("Database or user not ready.");
            return;
        }
        try {
            // Check for existing plan with the same name
            const existingPlan = studyPlans.find(plan => plan.name === newPlanName.trim());
            if (existingPlan) {
                showMessageModal("A study plan with this name already exists. Please choose a different name.");
                return;
            }
            // Use the plan name as the document ID for easier retrieval
            const docRef = doc(db, `artifacts/${appId}/users/${userId}/studyPlans/${newPlanName}`);
            await setDoc(docRef, { name: newPlanName, createdAt: new Date().toISOString(), tasks: [] });
            setNewPlanName('');
            showMessageModal("Study plan created successfully!");
        } catch (e) {
            console.error("Error adding document: ", e);
            showMessageModal(`Error creating study plan: ${e.message}`);
        }
    };

    const handleAddTask = async () => {
        if (!newTaskContent.trim()) {
            showMessageModal("Task content cannot be empty.");
            return;
        }
        if (!db || !userId || !selectedPlan) {
            showMessageModal("Database, user, or plan not ready.");
            return;
        }
        // Generate a unique ID for the new task
        const newTaskId = Date.now().toString();
        const newTask = { id: newTaskId, content: newTaskContent.trim(), completed: false, createdAt: new Date().toISOString() };
        try {
            const planRef = doc(db, `artifacts/${appId}/users/${userId}/studyPlans/${selectedPlan.id}`);
            // Use arrayUnion to add the new task to the tasks array
            await updateDoc(planRef, {
                tasks: arrayUnion(newTask)
            });
            setNewTaskContent('');
            showMessageModal("Task added successfully!");
        } catch (e) {
            console.error("Error adding task: ", e);
            showMessageModal(`Error adding task: ${e.message}`);
        }
    };

    const handleToggleTaskComplete = async (planId, taskToToggle) => {
        if (!db || !userId) {
            showMessageModal("Database or user not ready.");
            return;
        }
        const planToUpdate = studyPlans.find(p => p.id === planId);
        if (!planToUpdate) {
            console.error("Plan not found for toggling task.");
            return;
        }
        // Map through tasks and toggle the 'completed' status of the specific task
        const updatedTasks = planToUpdate.tasks.map(task =>
            task.id === taskToToggle.id ? { ...task, completed: !task.completed } : task
        );
        try {
            const planRef = doc(db, `artifacts/${appId}/users/${userId}/studyPlans/${planId}`);
            // Update the tasks array in Firestore
            await updateDoc(planRef, {
                tasks: updatedTasks
            });
            showMessageModal(`Task marked as ${taskToToggle.completed ? 'incomplete' : 'complete'}!`);
        } catch (e) {
            console.error("Error updating task: ", e);
            showMessageModal(`Error updating task: ${e.message}`);
        }
    };

    const handleDeleteTask = async (planId, taskToDelete) => {
        if (!db || !userId) {
            showMessageModal("Database or user not ready.");
            return;
        }
        const planToUpdate = studyPlans.find(p => p.id === planId);
        if (!planToUpdate) {
            console.error("Plan not found for deleting task.");
            return;
        }
        try {
            const planRef = doc(db, `artifacts/${appId}/users/${userId}/studyPlans/${planId}`);
            // Use arrayRemove to delete the task from the tasks array
            await updateDoc(planRef, {
                tasks: arrayRemove(taskToDelete)
            });
            showMessageModal("Task deleted successfully!");
        } catch (e) {
            console.error("Error deleting task: ", e);
            showMessageModal(`Error deleting task: ${e.message}`);
        }
    };

    // --- Notes Functions ---
    // Handles file selection and initial processing for notes
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            const fileName = file.name;
            const fileExtension = fileName.split('.').pop().toLowerCase();
            const textFileTypes = ['txt', 'md'];
            const supportedBinaryFileTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];

            // Clear existing content if a new file is selected, especially if it's a binary file
            if (!textFileTypes.includes(fileExtension)) {
                 setNewNoteContent(''); // Clear text area if a binary file is selected
            }

            if (textFileTypes.includes(fileExtension)) {
                // Read text file content into the textarea for preview/editing
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        setNewNoteContent(e.target.result);
                        showMessageModal(`'${fileName}' selected and content loaded for preview.`);
                    } catch (error) {
                        console.error("Error reading text file:", error);
                        showMessageModal(`Error reading file: ${error.message}`);
                    }
                };
                reader.onerror = (e) => {
                    console.error("File reading error:", reader.error);
                    showMessageModal("Failed to read file.");
                };
                reader.readAsText(file);
            } else if (supportedBinaryFileTypes.includes(fileExtension)) {
                showMessageModal(`'${fileName}' selected. Binary files like PDF/Word/Excel will be uploaded to Firebase Storage.`);
            } else {
                // Handle unsupported file types
                setNewNoteContent('');
                setSelectedFile(null);
                showMessageModal("Unsupported file type. Please upload .txt, .md, .pdf, .doc, .docx, or .xls, or .xlsx files for notes.");
            }
        } else {
            setSelectedFile(null);
        }
    };

    // Saves the note to Firestore and handles file uploads to Storage
    const handleSaveNote = async () => {
        if (!noteTitle.trim()) {
            showMessageModal("Note title cannot be empty.");
            return;
        }

        let chapterToSave = selectedNoteChapter;
        // Special handling for "Current Affairs (Date-wise)" chapter for consistent data
        if (selectedNoteSubject === "General Awareness" && selectedNoteChapter === "Current Affairs (Date-wise)") {
            if (!currentAffairsDateInput) {
                showMessageModal("Please select a date for Daily Current Affairs.");
                return;
            }
            chapterToSave = currentAffairsDateInput;
        }

        // Validate content: Must have either selectedFile OR newNoteContent
        if (!selectedFile && !newNoteContent.trim()) {
            showMessageModal("Please upload a file or enter text content for the note.");
            return;
        }

        if (!db || !userId) {
            showMessageModal("Database or user not ready.");
            return;
        }

        const MAX_FIRESTORE_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1MB Firestore limit per document

        try {
            const newNoteRef = doc(collection(db, `artifacts/${appId}/users/${userId}/notes`));
            let fileDownloadUrl = null;
            let uploadedFileName = selectedFile ? selectedFile.name : '';
            let noteContentForFirestore = newNoteContent; // Default to textarea content
            let isContentBase64Encoded = false;

            if (selectedFile) {
                const fileName = selectedFile.name;
                const fileExtension = fileName.split('.').pop().toLowerCase();
                const textFileTypes = ['txt', 'md'];
                const supportedBinaryFileTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];

                // For text files, always read content into noteContentForFirestore for direct display
                if (textFileTypes.includes(fileExtension)) {
                    noteContentForFirestore = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.onerror = (e) => reject(reader.error);
                        reader.readAsText(selectedFile);
                    });
                }

                // Attempt to upload the original file to Firebase Storage regardless of its type.
                try {
                    if (storage) {
                        const storageRef = ref(storage, `artifacts/${appId}/users/${userId}/files/${newNoteRef.id}/${selectedFile.name}`);
                        await uploadBytes(storageRef, selectedFile);
                        fileDownloadUrl = await getDownloadURL(storageRef);
                        showMessageModal("File uploaded to Firebase Storage.");
                        setShowStorageRulesMessage(false); // Hide message if upload successful
                    } else {
                        throw new Error("Firebase Storage not initialized.");
                    }
                } catch (storageError) {
                    console.warn("Firebase Storage upload failed:", storageError.message);
                    // Show storage rules message if permission denied or similar storage error
                    if (storageError.code === 'storage/unauthorized' || storageError.code === 'permission-denied') {
                        setShowStorageRulesMessage(true);
                    }
                    showMessageModal(`Storage upload failed for file: ${storageError.message}.`);

                    // Fallback for supported binary files (not text files) if Storage fails AND file is small enough for Firestore
                    if (supportedBinaryFileTypes.includes(fileExtension) && !textFileTypes.includes(fileExtension)) {
                        if (selectedFile.size > MAX_FIRESTORE_FILE_SIZE_BYTES) {
                            showMessageModal(`File too large (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB) for direct database storage. Not saving as attachment.`);
                            fileDownloadUrl = null;
                            uploadedFileName = '';
                        } else {
                            // Convert file to Base64 to store directly in Firestore
                            noteContentForFirestore = await new Promise((resolve, reject) => {
                                const reader = new FileReader();
                                reader.onload = (e) => resolve(e.target.result);
                                reader.onerror = (e) => reject(reader.error);
                                reader.readAsDataURL(selectedFile);
                            });
                            isContentBase64Encoded = true;
                            fileDownloadUrl = null; // No separate download URL as it's in content
                            showMessageModal("File converted to Base64 and saved directly to database. Note: Large Base64 files may impact performance.");
                        }
                    } else if (!textFileTypes.includes(fileExtension)) {
                        // If it's an unsupported file type AND storage failed, clear file info
                        showMessageModal("Uploaded file type is unsupported and storage upload failed. No file will be attached.");
                        fileDownloadUrl = null;
                        uploadedFileName = '';
                        // Also clear content if it was only from this unsupported file and not from textarea
                        if (noteContentForFirestore === selectedFile.name) {
                             noteContentForFirestore = '';
                        }
                    }
                }
            }

            // Save note metadata and content to Firestore
            await setDoc(newNoteRef, {
                title: noteTitle.trim(),
                content: noteContentForFirestore,
                phase: selectedNotePhase || '',
                subject: selectedNoteSubject || '',
                chapter: chapterToSave || '',
                uploadedFile: uploadedFileName,
                uploadedFileUrl: fileDownloadUrl,
                isBase64Encoded: isContentBase64Encoded, // Indicate if content is base64 encoded
                createdAt: new Date().toISOString()
            });

            // Reset form fields and close modal
            setNewNoteContent('');
            setSelectedNotePhase('');
            setSelectedNoteSubject('');
            setSelectedNoteChapter('');
            setCurrentAffairsDateInput('');
            setSelectedFile(null);
            setNoteTitle('');
            setShowAddNoteModal(false);
            showMessageModal("Note saved successfully!");
        } catch (e) {
            console.error("Critical error saving note:", e);
            showMessageModal(`Failed to save note: ${e.message}`);
        }
    };

    // --- Syllabus Chapter Progress Function ---
    const handleToggleChapterProgress = async (phaseKey, subjectName, chapterName, type) => {
        if (!db || !userId) {
            showMessageModal("Database or user not ready.");
            return;
        }
        // Create a unique identifier for the chapter
        const chapterIdentifier = `${phaseKey}___${subjectName}___${chapterName}`;
        // Get current progress or set default if not exists
        const currentProgress = chapterProgress[chapterIdentifier] || { readNotes: false, takenTest: false };
        const updatedProgress = { ...currentProgress };

        // Toggle the specific progress type
        if (type === 'readNotes') {
            updatedProgress.readNotes = !currentProgress.readNotes;
        } else if (type === 'takenTest') {
            updatedProgress.takenTest = !currentProgress.takenTest;
        }

        const chapterDocRef = doc(db, `artifacts/${appId}/users/${userId}/chapterProgress/${chapterIdentifier}`);
        try {
            // Use setDoc with merge: true to update or create the document
            await setDoc(chapterDocRef, updatedProgress, { merge: true });
            showMessageModal(`Chapter '${chapterName}' ${type === 'readNotes' ? 'notes status' : 'test status'} updated.`);
        } catch (e) {
            console.error(`Error toggling chapter progress for ${type}:`, e);
            showMessageModal(`Error updating chapter progress: ${e.message}`);
        }
    };

    // --- Mock Test Functions ---
    // Generates multiple-choice questions for a mock test using Gemini API
    const handleGenerateChapterTest = async (
        phase = currentMockTestPhase, // Default to current mock test states
        subject = currentMockTestSubject,
        chapter = currentMockTestChapter
    ) => {
        if (!subject || !chapter) {
            showMessageModal("Please select a subject and chapter for the mock test.");
            return;
        }

        setIsTestLoading(true);
        setGeneratedTestQuestions([]);
        setTestAnswers({});
        setTestResults(null);
        setCurrentTestChapter(chapter);
        setCurrentTestSubject(subject);
        setCurrentTestPhase(phase);

        // Filter relevant notes for context
        const relevantNotes = notes.filter(note =>
            note.phase === phase &&
            note.subject === subject &&
            note.chapter === chapter &&
            note.content // Only include notes with actual content
        );

        let combinedNotesContent = relevantNotes.map(note => `Title: ${note.title}\nContent: ${note.content}`).join("\n\n---\n\n");
        const maxContentLength = 20000; // Define a reasonable max length for the context
        if (combinedNotesContent.length > maxContentLength) {
            combinedNotesContent = combinedNotesContent.substring(0, maxContentLength) + "\n... (content truncated)";
        }

        // Prompt to generate 50 MCQs with explanations (can be adjusted up to 100)
        const numberOfQuestions = 50; // Changed from 15 to 50 as requested. Can be adjusted up to 100.
        const prompt = `Generate a mock test of ${numberOfQuestions} multiple-choice questions (MCQs) for the RBI Grade B exam, specifically focusing on the topic "${chapter}" from the "${subject}" subject within "${phase}". These questions should be highly relevant to the RBI Grade B syllabus and typical exam patterns, covering important concepts, facts, and applications. Each question must have 4 distinct options (A, B, C, D) and a single correct answer. For each question, provide a concise explanation of the correct answer. Ensure the questions are diverse in type and difficulty, reflecting what an aspirant would encounter.
        ${combinedNotesContent ? `\n\nAdditionally, consider the following personal study notes for context, but do not be limited by them; feel free to draw upon broader knowledge relevant to this chapter in the RBI Grade B syllabus:\n${combinedNotesContent}\n\n` : ''}
        Format the output as a JSON array of objects, where each object has 'question', 'options' (an array of strings), 'answer' (the correct option string, e.g., "A. Option Text"), and 'explanation' (a string explaining the answer).`;

        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });

        const payload = {
            contents: chatHistory,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            "question": { "type": "STRING" },
                            "options": {
                                "type": "ARRAY",
                                "items": { "type": "STRING" }
                            },
                            "answer": { "type": "STRING" },
                            "explanation": { "type": "STRING" }
                        },
                        "propertyOrdering": ["question", "options", "answer", "explanation"]
                    }
                }
            }
        };

        const apiKey = ""; // Canvas will provide this
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const jsonText = result.candidates[0].content.parts[0].text;
                const parsedQuestions = JSON.parse(jsonText);
                setGeneratedTestQuestions(parsedQuestions);
                setCurrentPage('take-test'); // Navigate to the test page
            } else {
                console.error("Unexpected LLM response structure for test generation:", result);
                showMessageModal("Could not generate test questions. Please try again or ensure sufficient notes for the chapter.");
            }
        } catch (error) {
            console.error("Error calling LLM for test generation:", error);
            showMessageModal(`Error generating test: ${error.message}`);
        } finally {
            setIsTestLoading(false);
        }
    };

    // Handles user selecting an option during the test
    const handleTestOptionChange = (questionIndex, selectedOption) => {
        setTestAnswers(prev => ({
            ...prev,
            [questionIndex]: selectedOption
        }));
    };

    // Submits the test, calculates score, and saves results to Firestore
    const submitTest = () => {
        let score = 0;
        const results = generatedTestQuestions.map((q, index) => {
            const userAnswer = testAnswers[index];
            const isCorrect = userAnswer === q.answer;
            if (isCorrect) {
                score++;
            }
            return {
                question: q.question,
                selectedOption: userAnswer || "Not Answered",
                correctAnswer: q.answer,
                isCorrect: isCorrect,
                explanation: q.explanation,
                subject: currentTestSubject,
                chapter: currentTestChapter,
                date: new Date().toISOString()
            };
        });

        setTestResults({
            score: score,
            total: generatedTestQuestions.length,
            details: results
        });
        showMessageModal(`Test submitted! You scored ${score} out of ${generatedTestQuestions.length}.`);

        // Save each question's result to Firestore
        results.forEach(async (result) => {
            if (db && userId) {
                try {
                    const newTestResultRef = doc(collection(db, `artifacts/${appId}/users/${userId}/quizResults`));
                    await setDoc(newTestResultRef, result);
                } catch (e) {
                    console.error("Error saving individual test question result: ", e);
                    showMessageModal(`Error saving test result for a question: ${e.message}`);
                }
            }
        });
    };

    // --- AI Expert Function ---
    // Calls Gemini API for general Q&A
    const askLlmExpert = async () => {
        if (!llmQuestion.trim()) {
            showMessageModal("Please enter your question.");
            return;
        }

        setLlmLoading(true);
        setLlmAnswer(''); // Clear previous answer

        const prompt = llmQuestion;
        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });

        const payload = { contents: chatHistory };
        const apiKey = ""; // Canvas will provide this
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                setLlmAnswer(result.candidates[0].content.parts[0].text);
            } else {
                console.error("Unexpected LLM response structure:", result);
                showMessageModal("Could not get an answer. Please try again.");
            }
        } catch (error) {
            console.error("Error calling LLM for expert:", error);
            showMessageModal(`Error asking expert: ${error.message}`);
        } finally {
            setLlmLoading(false);
        }
    };

    // --- Essay Evaluator Function ---
    // Calls Gemini API for essay/precis feedback
    const getEssayFeedback = async () => {
        if (!essayInput.trim()) {
            showMessageModal("Please enter some text to get feedback.");
            return;
        }

        setEssayLoading(true);
        setEssayFeedback(''); // Clear previous feedback

        const prompt = `Please provide constructive feedback on the following essay/precis for an RBI Grade B English Writing Skills exam. Focus on grammar, coherence, vocabulary, conciseness, and relevance to a typical exam topic. Provide suggestions for improvement.
        Text: ${essayInput}`;

        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });

        const payload = { contents: chatHistory };
        const apiKey = ""; // Canvas will provide this
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                setEssayFeedback(result.candidates[0].content.parts[0].text);
            } else {
                console.error("Unexpected LLM response structure:", result);
                showMessageModal("Could not get essay feedback. Please try again.");
            }
        } catch (error) {
            console.error("Error calling LLM for essay feedback:", error);
            showMessageModal(`Error getting essay feedback: ${e.message}`);
        } finally {
            setEssayLoading(false);
        }
    };

    // --- Study Plan Enhancement Function ---
    // Calls Gemini API to suggest enhancements for a study plan
    const enhanceStudyPlan = async (plan) => {
        if (!plan) {
            showMessageModal("No study plan selected for enhancement.");
            return;
        }

        setPlanEnhancementLoading(true);
        setPlanEnhancementFeedback('');

        const prompt = `Given the following RBI Grade B study plan named "${plan.name}", suggest ways to enhance it. Consider breaking down topics further, suggesting time allocations, or recommending specific study approaches for a high-achiever aiming for AIR 1. Focus on actionable steps.
        Current Plan Details: Name: "${plan.name}", Created At: "${new Date(plan.createdAt).toLocaleString()}", Tasks: ${plan.tasks && plan.tasks.length > 0 ? JSON.stringify(plan.tasks.map(t => t.content + (t.completed ? ' (completed)' : ''))) : 'No specific tasks added yet.'}.`;

        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });

        const payload = { contents: chatHistory };
        const apiKey = ""; // Canvas will provide this
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                setPlanEnhancementFeedback(result.candidates[0].content.parts[0].text);
            } else {
                console.error("Unexpected LLM response structure:", result);
                showMessageModal("Could not enhance study plan. Please try again.");
            }
        } catch (error) {
            console.error("Error calling LLM for plan enhancement:", error);
            showMessageModal(`Error enhancing study plan: ${error.message}`);
        } finally {
            setPlanEnhancementLoading(false);
        }
    };

    // --- Daily Financial News Functions ---
    // Handles saving new daily financial news entries to Firestore
    const handleSaveDailyNews = async () => {
        if (!newNewsDate) {
            showMessageModal("Please select a date for the news entry.");
            return;
        }
        if (!newNewsSummary.trim()) {
            showMessageModal("Please enter a summary for the news entry.");
            return;
        }
        if (!newsCategory.trim()) {
            showMessageModal("Please select a category for the news entry.");
            return;
        }
        if (!db || !userId) {
            showMessageModal("Database or user not ready.");
            return;
        }

        try {
            const newNewsRef = doc(collection(db, `artifacts/${appId}/users/${userId}/dailyFinancialNews`));

            await setDoc(newNewsRef, {
                date: newNewsDate,
                summaryText: newNewsSummary.trim(),
                phase: newsPhase || '',
                subject: newsSubject || '',
                chapter: newsChapter || '',
                category: newsCategory,
                createdAt: new Date().toISOString()
            });
            showMessageModal("Daily news summary saved successfully!");

            // Reset form fields and close modal
            setNewNewsDate('');
            setNewNewsSummary('');
            setNewsPhase('');
            setNewNewsSubject('');
            setNewNewsChapter('');
            setNewNewsCategory('');
            setShowAddNewsModal(false);
        } catch (e) {
            console.error("Error saving daily news: ", e);
            showMessageModal(`Error saving news: ${e.message}`);
        }
    };

    // --- Daily Targets Functions ---
    // Sets the daily study target hours
    const handleSetDailyTarget = async () => {
        if (dailyTargetHours <= 0) {
            showMessageModal("Daily target must be greater than 0 hours.");
            return;
        }
        if (!db || !userId) {
            showMessageModal("Database or user not ready.");
            return;
        }
        const todayDate = new Date().toISOString().split('T')[0];
        const docRef = doc(db, `artifacts/${appId}/users/${userId}/dailyTargets/${todayDate}`);
        try {
            // Use merge: true to update existing document or create if not exists
            await setDoc(docRef, { targetHours: dailyTargetHours, loggedHours: currentDayLogged, updatedAt: new Date().toISOString() }, { merge: true });
            showMessageModal(`Daily target set to ${dailyTargetHours} hours!`);
        } catch (e) {
            console.error("Error setting daily target:", e);
            showMessageModal(`Error setting daily target: ${e.message}`);
        }
    };

    // Logs the study hours for today
    const handleLogHoursToday = async () => {
        if (loggedHoursToday < 0) {
            showMessageModal("Logged hours cannot be negative.");
            return;
        }
        if (!db || !userId) {
            showMessageModal("Database or user not ready.");
            return;
        }
        const todayDate = new Date().toISOString().split('T')[0];
        const docRef = doc(db, `artifacts/${appId}/users/${userId}/dailyTargets/${todayDate}`);
        try {
            // Use merge: true to update existing document or create if not exists
            await setDoc(docRef, { targetHours: currentDayTarget || 0, loggedHours: loggedHoursToday, updatedAt: new Date().toISOString() }, { merge: true });
            showMessageModal(`Logged ${loggedHoursToday} hours for today!`);
        } catch (e) {
            console.error("Error logging hours:", e);
            showMessageModal(`Error logging hours: ${e.message}`);
        }
    };

    // Helper function to extract chapter number for sorting (e.g., "Chapter 1", "Chapter 2A")
    const extractChapterNum = (chapterName) => {
        const match = chapterName.match(/^Chapter (\d+)([A-Z])?:\s/);
        if (match) {
            let num = parseInt(match[1]);
            if (match[2]) {
                // Convert A to 0.1, B to 0.2, etc. for sorting purposes
                num += (match[2].charCodeAt(0) - 'A'.charCodeAt(0) + 1) * 0.1;
            }
            return num;
        }
        return Infinity; // For chapters without a number, put them at the end
    };

    // --- Component for displaying individual notes in a modal ---
    const NoteModal = ({ note, onClose }) => {
        if (!note) return null;

        let displayedContent = '';
        let fileActionElement = null;

        // Handles opening Base64 encoded files (like PDFs or images) in a new tab
        const handleViewBase64File = () => {
            if (note.isBase64Encoded && note.content && note.content.startsWith('data:')) {
                const parts = note.content.split(',');
                const mimeType = parts[0].split(':')[1].split(';')[0];
                const base64Data = parts[1];

                // Decode base64 to binary, then create Blob and URL
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: mimeType });
                const objectURL = URL.createObjectURL(blob);
                window.open(objectURL, '_blank');
            }
        };

        // Determine how to display content based on file attachments or direct content
        if (note.uploadedFileUrl) {
            displayedContent = 'File attached via Firebase Storage. Click "View/Download" to open.';
            fileActionElement = (
                <a
                    href={note.uploadedFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:underline flex items-center"
                    title="View/Download File"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View/Download
                </a>
            );
        } else if (note.isBase64Encoded && note.content && note.content.startsWith('data:')) {
            const mimeType = note.content.split(';')[0].split(':')[1];
            const fileNameWithExtension = note.uploadedFile || `downloaded_file.${mimeType.split('/')[1] || 'bin'}`; // Fallback filename

            // For PDFs and images, offer to view directly; for others, offer download
            if (mimeType.includes('pdf') || mimeType.startsWith('image/')) {
                displayedContent = `File content stored directly in database (Base64 encoded ${mimeType}). Click "View" to open in a new window.`;
                fileActionElement = (
                    <button
                        onClick={handleViewBase64File}
                        className="ml-2 text-blue-600 hover:underline flex items-center"
                        title="View File"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View
                    </button>
                );
            } else {
                displayedContent = `File content stored directly in database (Base64 encoded ${mimeType}). Click "Download" to open.`;
                fileActionElement = (
                    <a
                        href={note.content} // The Base64 data URL itself can be used for download
                        download={fileNameWithExtension}
                        className="ml-2 text-blue-600 hover:underline flex items-center"
                        title="Download File"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                    </a>
                );
            }
        } else if (note.content && note.content.trim() !== '') {
            displayedContent = note.content;
        } else {
            displayedContent = 'No content available for this note.';
        }

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className={`rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
                    <button onClick={onClose} className={`absolute top-4 right-4 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                        <X size={24} />
                    </button>
                    <h3 className="text-2xl font-bold mb-4">{note.title || 'Note Details'}</h3>
                    <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span className="font-semibold">Phase:</span> {note.phase ? (rbiSyllabus[note.phase]?.title || note.phase) : 'Not specified'} &bull;
                        <span className="font-semibold">Subject:</span> {note.subject || 'Not specified'} &bull;
                        <span className="font-semibold">Chapter:</span> {note.chapter || 'Not specified'}
                    </p>
                    <hr className={`my-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                    <div className={`whitespace-pre-wrap mb-4 p-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-800 border-gray-100'}`}>
                        {displayedContent}
                    </div>
                    {note.uploadedFile && (note.uploadedFileUrl || note.isBase64Encoded) && (
                        <p className={`text-sm mb-4 flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <span className="font-semibold">Attached File:</span> <span className="font-semibold ml-1">{note.uploadedFile}</span>
                            {fileActionElement}
                        </p>
                    )}
                    <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Saved on: {new Date(note.createdAt).toLocaleString()}</p>
                </div>
            </div>
        );
    };

    // --- Component for displaying individual news items in a modal ---
    const NewsDetailModal = ({ newsItem, onClose }) => {
        if (!newsItem) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className={`rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
                    <button onClick={onClose} className={`absolute top-4 right-4 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                        <X size={24} />
                    </button>
                    <h3 className="text-2xl font-bold mb-4">News for {new Date(newsItem.date).toLocaleDateString()}</h3>
                    <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span className="font-semibold">Date:</span> {new Date(newsItem.date).toLocaleDateString()}
                    </p>
                     <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span className="font-semibold">Category:</span> {newsItem.category || 'Not specified'}
                    </p>
                    <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span className="font-semibold">Phase:</span> {newsItem.phase ? (rbiSyllabus[newsItem.phase]?.title || newsItem.phase) : 'Not specified'} &bull;
                        <span className="font-semibold">Subject:</span> {newsItem.subject || 'Not specified'} &bull;
                        <span className="font-semibold">Chapter:</span> {newsItem.chapter || 'Not specified'}
                    </p>
                    <hr className={`my-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                    <div className={`whitespace-pre-wrap max-h-60 overflow-y-auto mb-4 p-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-800 border-gray-100'}`}>
                        {newsItem.summaryText || 'No summary available for this news item.'}
                    </div>
                    <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Added on: {new Date(newsItem.createdAt).toLocaleString()}</p>
                </div>
            </div>
        );
    };

    // --- Component for adding/editing notes in a modal ---
    const AddNoteModal = ({ onClose }) => {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className={`rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
                    <button onClick={onClose} className={`absolute top-4 right-4 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                        <X size={24} />
                    </button>
                    <h3 className="text-2xl font-bold mb-4">Add Note for:</h3>
                    <p className={`text-md mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="font-semibold">Phase:</span> {selectedNotePhase ? (rbiSyllabus[selectedNotePhase]?.title || selectedNotePhase) : 'Not Specified'} <br/>
                        <span className="font-semibold">Subject:</span> {selectedNoteSubject || 'Not Specified'} <br/>
                        <span className="font-semibold">Chapter:</span> {selectedNoteChapter || 'Not Specified'}
                    </p>
                    {showStorageRulesMessage && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4" role="alert">
                            <strong className="font-bold">Permission Error!</strong>
                            <span className="block sm:inline ml-2">To upload files to Firebase Storage, you need to update your Firebase Storage security rules to allow authenticated writes.</span>
                        </div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="modalNoteTitle" className={`block text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Note Title/Topic <span className="text-red-500">*</span>:</label>
                            <input
                                type="text"
                                id="modalNoteTitle"
                                placeholder="e.g., 'Summary of Inflation Chapter', 'Feb 15 CA highlights'"
                                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                value={noteTitle}
                                onChange={(e) => setNoteTitle(e.target.value)}
                            />
                        </div>
                        {selectedNoteSubject === "General Awareness" && selectedNoteChapter === "Current Affairs (Date-wise)" && (
                            <div>
                                <label htmlFor="modalCurrentAffairsDateInput" className={`block text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Date for Current Affairs (Required):</label>
                                <input
                                    type="date"
                                    id="modalCurrentAffairsDateInput"
                                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                    value={currentAffairsDateInput}
                                    onChange={(e) => setCurrentAffairsDateInput(e.target.value)}
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="modalNewNoteContent" className={`block text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Note Content (or upload a file below):</label>
                            <textarea
                                id="modalNewNoteContent"
                                rows="5"
                                placeholder="Type your notes here..."
                                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                value={newNoteContent}
                                onChange={(e) => setNewNoteContent(e.target.value)}
                            ></textarea>
                        </div>
                        <div>
                            <label htmlFor="modalFileUpload" className={`block text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Upload File (Optional: PDF, Word, Excel, Text for notes):</label>
                            <input
                                type="file"
                                id="modalFileUpload"
                                accept=".txt,.md,.pdf,.doc,.docx,.xls,.xlsx"
                                onChange={handleFileUpload}
                                className={`block w-full text-sm
                                           file:mr-4 file:py-2 file:px-4
                                           file:rounded-full file:border-0
                                           file:text-sm file:font-semibold
                                           ${isDarkMode ? 'file:bg-violet-700 file:text-violet-100 hover:file:bg-violet-600 text-gray-300' : 'file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 text-gray-500'}`}
                            />
                            {selectedFile && (
                                <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Selected file: <span className="font-semibold">{selectedFile.name}</span>.
                                    {selectedFile.name.toLowerCase().endsWith('.txt') || selectedFile.name.toLowerCase().endsWith('.md')
                                        ? ' (Content will be saved as note text, overwriting manual input if present.)'
                                        : ' (File will be uploaded as attachment to Firebase Storage.)'
                                    }
                                </p>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition duration-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveNote}
                                disabled={!noteTitle.trim() || (!selectedFile && !newNoteContent.trim()) ||
                                          (selectedNoteSubject === "General Awareness" && selectedNoteChapter === "Current Affairs (Date-wise)" && !currentAffairsDateInput)}
                                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save Note
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Main render logic for different pages of the application
    const renderPage = () => {
        // Recalculate overall progress for dashboard
        let totalPossibleProgressUnits = 0;
        let achievedProgressUnits = 0;
        for (const phaseKey in rbiSyllabus) {
            rbiSyllabus[phaseKey].sections.forEach(section => {
                section.topics.forEach(chapterName => {
                    const chapterIdentifier = `${phaseKey}___${section.name}___${chapterName}`;
                    totalPossibleProgressUnits += 2; // 1 for notes, 1 for test
                    const chapterStatus = chapterProgress[chapterIdentifier] || { readNotes: false, takenTest: false };
                    if (chapterStatus.readNotes) {
                        achievedProgressUnits += 1;
                    }
                    if (chapterStatus.takenTest) {
                        achievedProgressUnits += 1;
                    }
                });
            });
        }
        const overallProgressPercentage = totalPossibleProgressUnits > 0 ? (achievedProgressUnits / totalPossibleProgressUnits) * 100 : 0;

        // Calculate Phase II subject-wise progress for dashboard
        const phaseIISubjectsProgress = rbiSyllabus["Phase II"].sections.map(subject => {
            let subjectAchievedUnits = 0;
            let subjectTotalUnits = 0;
            subject.topics.forEach(chapterName => {
                const chapterIdentifier = `Phase II___${subject.name}___${chapterName}`;
                subjectTotalUnits += 2;
                const chapterStatus = chapterProgress[chapterIdentifier] || { readNotes: false, takenTest: false };
                if (chapterStatus.readNotes) {
                    subjectAchievedUnits += 1;
                }
                if (chapterStatus.takenTest) {
                    subjectAchievedUnits += 1;
                }
            });
            const subjectProgressPercentage = subjectTotalUnits > 0 ? (subjectAchievedUnits / subjectTotalUnits) * 100 : 0;
            return {
                name: subject.name,
                percentage: subjectProgressPercentage
            };
        });

        const todayDateFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const targetProgressPercentage = currentDayTarget > 0 ? (currentDayLogged / currentDayTarget) * 100 : 0;

        switch (currentPage) {
            case 'dashboard':
                return (
                    <div className="p-6">
                        <h1 className={`text-4xl font-extrabold mb-8 text-center flex items-center justify-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            <span role="img" aria-label="rocket" className="mr-3 text-4xl">  🚀  </span>
                            RBI Grade B – AIR 1 App
                        </h1>
                        <p className={`text-lg text-center mb-10 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Your complete preparation hub with notes, current affairs, MCQs, and AI coach
                        </p>

                        {/* Overall Progress Glance */}
                        <div className={`p-8 rounded-xl shadow-lg border mb-10 text-center ${isDarkMode ? 'bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700 text-blue-100' : 'bg-gradient-to-br from-blue-50 to-blue-200 border-blue-300 text-blue-800'}`}>
                            <h3 className="text-2xl font-bold mb-4">Your Progress At A Glance (Overall Syllabus)</h3>
                            <div className={`w-full rounded-full h-4 ${isDarkMode ? 'bg-blue-700' : 'bg-blue-300'}`}>
                                <div
                                    className={`h-4 rounded-full transition-all duration-500 ease-out ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`}
                                    style={{ width: `${overallProgressPercentage}%` }}
                                ></div>
                            </div>
                            <p className="text-md mt-3 font-semibold">Overall Syllabus Progress: {overallProgressPercentage.toFixed(0)}% Complete</p>
                        </div>

                        {/* Daily Study Target (Gamification) */}
                        <div className={`p-8 rounded-xl shadow-lg border mb-10 text-center ${isDarkMode ? 'bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700 text-purple-100' : 'bg-gradient-to-br from-purple-50 to-purple-200 border-purple-300 text-purple-800'}`}>
                            <h3 className="text-2xl font-bold mb-4">Daily Study Target for {todayDateFormatted}</h3>
                            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <label htmlFor="dailyTarget" className="font-semibold text-lg">Target (hours):</label>
                                    <input
                                        type="number"
                                        id="dailyTarget"
                                        min="0"
                                        step="0.5"
                                        value={dailyTargetHours}
                                        onChange={(e) => setDailyTargetHours(parseFloat(e.target.value) || 0)}
                                        className={`w-20 p-2 rounded-lg text-center ${isDarkMode ? 'bg-gray-700 text-white border-purple-600' : 'bg-white text-gray-800 border-purple-300'}`}
                                    />
                                    <button
                                        onClick={handleSetDailyTarget}
                                        className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition duration-300"
                                    >
                                        Set Target
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label htmlFor="loggedHours" className="font-semibold text-lg">Logged (hours):</label>
                                    <input
                                        type="number"
                                        id="loggedHours"
                                        min="0"
                                        step="0.5"
                                        value={loggedHoursToday}
                                        onChange={(e) => setLoggedHoursToday(parseFloat(e.target.value) || 0)}
                                        className={`w-20 p-2 rounded-lg text-center ${isDarkMode ? 'bg-gray-700 text-white border-purple-600' : 'bg-white text-gray-800 border-purple-300'}`}
                                    />
                                    <button
                                        onClick={handleLogHoursToday}
                                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-300"
                                    >
                                        Log Hours
                                    </button>
                                </div>
                            </div>
                            <div className={`w-full rounded-full h-4 mb-2 ${isDarkMode ? 'bg-purple-700' : 'bg-purple-300'}`}>
                                <div
                                    className={`h-4 rounded-full transition-all duration-500 ease-out ${isDarkMode ? 'bg-purple-400' : 'bg-purple-600'}`}
                                    style={{ width: `${Math.min(targetProgressPercentage, 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-lg font-semibold mt-2">
                                Progress: {currentDayLogged} / {currentDayTarget || 0} hours ({targetProgressPercentage.toFixed(0)}%)
                            </p>
                            {currentDayTarget > 0 && currentDayLogged >= currentDayTarget ? (
                                <p className="text-xl font-bold mt-3 text-green-700 dark:text-green-300"> 🎉  Target Met! Excellent work!  🎉 </p>
                            ) : (
                                <p className="text-xl font-bold mt-3 text-yellow-700 dark:text-yellow-300">Keep Going! You can do it!</p>
                            )}
                        </div>

                        {/* Phase II Subject-wise Progress Glances */}
                        <div className={`p-6 rounded-xl shadow-lg border mb-10 ${isDarkMode ? 'bg-gradient-to-br from-green-900 to-green-800 border-green-700 text-green-100' : 'bg-gradient-to-br from-green-50 to-green-200 border-green-300 text-green-800'}`}>
                            <h3 className="text-xl font-bold mb-4 text-center">Phase II Subject-wise Progress</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {phaseIISubjectsProgress.map(subject => (
                                    <div key={subject.name} className={`p-4 rounded-lg shadow-md border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-100 text-gray-800'}`}>
                                        <h4 className="text-md font-semibold mb-2 truncate" title={subject.name}>{subject.name}</h4>
                                        <div className={`w-full rounded-full h-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                                            <div
                                                className={`h-2 rounded-full ${isDarkMode ? 'bg-green-400' : 'bg-green-500'}`}
                                                style={{ width: `${subject.percentage}%` }}
                                            ></div>
                                        </div>
                                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{subject.percentage.toFixed(0)}% Complete</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Dashboard Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                            <DashboardCard
                                icon="  📚  "
                                title="Syllabus Overview"
                                description="Explore the detailed RBI Grade B exam syllabus phase-wise and subject-wise."
                                onClick={() => setCurrentPage('syllabus')}
                                bgColor={isDarkMode ? "bg-purple-900" : "bg-purple-50"}
                                borderColor={isDarkMode ? "border-purple-700" : "border-purple-200"}
                                shadowColor={isDarkMode ? "shadow-purple-700" : "shadow-purple-200"}
                            />
                            <DashboardCard
                                icon="  📰  "
                                title="Daily Financial News"
                                description="Summarized from Business Standard, PIB, Mint — organized by date with RBI chapter mapping."
                                onClick={() => setCurrentPage('daily-financial-news')}
                                bgColor={isDarkMode ? "bg-blue-900" : "bg-blue-50"}
                                borderColor={isDarkMode ? "border-blue-700" : "border-blue-200"}
                                shadowColor={isDarkMode ? "shadow-blue-700" : "shadow-blue-200"}
                            />
                            <DashboardCard
                                icon="  📝  "
                                title="Smart Notes Vault"
                                description="Finance, ESI, and Management notes tagged to chapters with diagrams, PDFs, and audio."
                                onClick={() => setCurrentPage('notes')}
                                bgColor={isDarkMode ? "bg-green-900" : "bg-green-50"}
                                borderColor={isDarkMode ? "border-green-700" : "border-green-200"}
                                shadowColor={isDarkMode ? "shadow-green-700" : "shadow-green-200"}
                            />
                            <DashboardCard
                                icon="  🎯  "
                                title="Mock Tests"
                                description="Chapter-wise mock tests and past year questions with detailed review."
                                onClick={() => setCurrentPage('mock-tests')}
                                bgColor={isDarkMode ? "bg-yellow-900" : "bg-yellow-50"}
                                borderColor={isDarkMode ? "border-yellow-700" : "border-yellow-200"}
                                shadowColor={isDarkMode ? "shadow-yellow-700" : "shadow-yellow-200"}
                            />
                            <DashboardCard
                                icon="  📅  "
                                title="AIR 1 Strategy Planner"
                                description="Custom daily planner, progress tracker, and topper-style weekly milestones."
                                onClick={() => setCurrentPage('study-plan')}
                                bgColor={isDarkMode ? "bg-purple-900" : "bg-purple-50"}
                                borderColor={isDarkMode ? "border-purple-700" : "border-purple-200"}
                                shadowColor={isDarkMode ? "shadow-purple-700" : "shadow-purple-200"}
                            />
                            <DashboardCard
                                icon="  🤖  "
                                title="Ask AI Coach"
                                description="Clear your Finance/ESI doubts instantly, generate summaries, or get topic advice."
                                onClick={() => setCurrentPage('ai-expert')}
                                bgColor={isDarkMode ? "bg-pink-900" : "bg-pink-50"}
                                borderColor={isDarkMode ? "border-pink-700" : "border-pink-200"}
                                shadowColor={isDarkMode ? "shadow-pink-700" : "shadow-pink-200"}
                            />
                            <DashboardCard
                                icon="  ✍️  "
                                title="Essay/Precis Evaluator"
                                description="Get AI feedback on your English writing skills for Phase II."
                                onClick={() => setCurrentPage('essay-evaluator')}
                                bgColor={isDarkMode ? "bg-orange-900" : "bg-orange-50"}
                                borderColor={isDarkMode ? "border-orange-700" : "border-orange-200"}
                                shadowColor={isDarkMode ? "shadow-orange-700" : "shadow-orange-200"}
                            />
                            <DashboardCard
                                icon="  📈  "
                                title="Performance Analysis"
                                description="Review your test history, track progress, and identify weak areas."
                                onClick={() => setCurrentPage('performance')}
                                bgColor={isDarkMode ? "bg-gray-700" : "bg-gray-50"}
                                borderColor={isDarkMode ? "border-gray-600" : "border-gray-200"}
                                shadowColor={isDarkMode ? "shadow-gray-600" : "shadow-gray-200"}
                            />
                            <DashboardCard
                                icon="  🔗  "
                                title="Recommended Resources"
                                description="Access curated lists of books, online platforms, and previous year papers."
                                onClick={() => setCurrentPage('resources')}
                                bgColor={isDarkMode ? "bg-cyan-900" : "bg-cyan-50"}
                                borderColor={isDarkMode ? "border-cyan-700" : "border-cyan-200"}
                                shadowColor={isDarkMode ? "shadow-cyan-700" : "shadow-cyan-200"}
                            />
                        </div>
                        <div className={`mt-8 p-4 rounded-lg shadow-inner text-sm text-center ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                            <p>Your User ID (for app data association): <span className="font-mono break-all">{userId}</span></p>
                        </div>
                    </div>
                );
            case 'syllabus':
                return (
                    <div className="p-6">
                        <h2 className={`text-3xl font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>RBI Grade B Syllabus</h2>
                        <p className={`text-lg text-center mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Explore the detailed syllabus, organized by phase, subject, and topic. Mark chapters as finished to track your progress.
                        </p>
                        <div className="space-y-6">
                            {Object.keys(rbiSyllabus).map(phaseKey => {
                                const phase = rbiSyllabus[phaseKey];
                                const isPhaseExpanded = expandedItems[`syllabus-${phaseKey}`];
                                return (
                                    <div key={phaseKey} className={`border rounded-xl overflow-hidden shadow-md ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                        <button
                                            onClick={() => toggleItem(`syllabus-${phaseKey}`)}
                                            className={`w-full text-left p-5 transition-colors flex justify-between items-center text-xl font-bold
                                                        ${isDarkMode ? 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white' : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800'}
                                                        ${phaseKey === "Phase I" ? "border-l-4 border-blue-500" : phaseKey === "Phase II" ? "border-l-4 border-green-500" : "border-l-4 border-indigo-500"}`}
                                        >
                                            {phase.title}
                                            {isPhaseExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                                        </button>
                                        <div className={`transition-all duration-300 ease-in-out ${isPhaseExpanded ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                            <div className="p-4 space-y-4">
                                                {phase.sections.map(section => {
                                                    const isSubjectExpanded = expandedItems[`syllabus-${phaseKey}-${section.name}`];
                                                    return (
                                                        <div key={section.name} className={`border rounded-lg overflow-hidden shadow-sm ${isDarkMode ? 'border-gray-600' : 'border-gray-100'}`}>
                                                            <button
                                                                onClick={() => toggleItem(`syllabus-${phaseKey}-${section.name}`)}
                                                                className={`w-full text-left p-4 transition-colors flex justify-between items-center text-lg font-semibold
                                                                            ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-100' : 'bg-white hover:bg-gray-50 text-gray-700'}`}
                                                            >
                                                                {section.name}
                                                                {isSubjectExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                            </button>
                                                            <div className={`transition-all duration-300 ease-in-out ${isSubjectExpanded ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                                                <ul className={`list-disc list-inside ml-8 p-4 overflow-y-auto ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                                                                    {section.topics.length > 0 ? (
                                                                        section.topics.map((chapterName, idx) => {
                                                                            const chapterIdentifier = `${phaseKey}___${section.name}___${chapterName}`;
                                                                            const currentStatus = chapterProgress[chapterIdentifier] || { readNotes: false, takenTest: false };
                                                                            return (
                                                                                <li key={idx} className="mb-1 flex items-center justify-between py-1">
                                                                                    <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'} flex-grow`}>{chapterName}</span>
                                                                                    <div className="flex items-center ml-4 space-x-4">
                                                                                        <label className={`flex items-center cursor-pointer text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                className="form-checkbox h-4 w-4 text-green-600 rounded"
                                                                                                checked={currentStatus.readNotes}
                                                                                                onChange={() => handleToggleChapterProgress(phaseKey, section.name, chapterName, 'readNotes')}
                                                                                            />
                                                                                            <span className="ml-2">Read Notes</span>
                                                                                        </label>
                                                                                        <label className={`flex items-center cursor-pointer text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                className="form-checkbox h-4 w-4 text-purple-600 rounded"
                                                                                                checked={currentStatus.takenTest}
                                                                                                onChange={() => handleToggleChapterProgress(phaseKey, section.name, chapterName, 'takenTest')}
                                                                                            />
                                                                                            <span className="ml-2">Take Test</span>
                                                                                        </label>
                                                                                    </div>
                                                                                </li>
                                                                            );
                                                                        })
                                                                    ) : (
                                                                        <p className="italic">No detailed topics available for this subject.</p>
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
case 'notes':
  return <Notes />;

case 'upload':
  return <Upload />;

            case 'study-plan':
                // Display list of study plans
                if (!selectedPlan) {
                    return (
                        <div className="p-6">
                            <h2 className={`text-3xl font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>My Study Plans</h2>
                            <div className={`p-6 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} mb-6`}>
                                <h3 className={`text-2xl font-semibold mb-4 border-l-4 pl-3 ${isDarkMode ? 'text-gray-100 border-blue-400' : 'text-gray-700 border-blue-500'}`}>Create New Study Plan</h3>
                                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                    <input
                                        type="text"
                                        placeholder="Enter new plan name (e.g., 'Phase II Revision Plan')"
                                        className={`flex-grow p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                        value={newPlanName}
                                        onChange={(e) => setNewPlanName(e.target.value)}
                                    />
                                    <button
                                        onClick={handleCreateStudyPlan}
                                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 transform hover:scale-105"
                                    >
                                        Create Plan
                                    </button>
                                </div>
                            </div>
                            <div className={`p-6 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                <h3 className={`text-2xl font-semibold mb-4 border-l-4 pl-3 ${isDarkMode ? 'text-gray-100 border-green-400' : 'text-gray-700 border-green-500'}`}>Existing Study Plans</h3>
                                {studyPlans.length === 0 ? (
                                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-8`}>No study plans created yet. Start by creating one above!</p>
                                ) : (
                                    <ul className="space-y-3">
                                        {studyPlans.map(plan => {
                                            const planCompletedTasks = plan.tasks ? plan.tasks.filter(task => task.completed).length : 0;
                                            const planTotalTasks = plan.tasks ? plan.tasks.length : 0;
                                            const planProgressPercentage = planTotalTasks > 0 ? (planCompletedTasks / planTotalTasks) * 100 : 0;
                                            return (
                                                <li
                                                    key={plan.id}
                                                    onClick={() => setSelectedPlan(plan)}
                                                    className={`p-4 rounded-lg shadow-sm border cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-100 hover:bg-blue-50'}`}
                                                >
                                                    <div className="flex-grow">
                                                        <p className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{plan.name}</p>
                                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Created: {new Date(plan.createdAt).toLocaleDateString()}</p>
                                                        <div className={`w-full rounded-full h-2 mt-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                                                            <div
                                                                className={`h-2 rounded-full ${isDarkMode ? 'bg-green-400' : 'bg-green-600'}`}
                                                                style={{ width: `${planProgressPercentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{planProgressPercentage.toFixed(0)}% Complete</p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan); }}
                                                        className="mt-3 sm:mt-0 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition duration-300"
                                                    >
                                                        View/Edit Plan
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        </div>
                    );
                }

                // Display details of a selected study plan
                const currentSelectedPlan = studyPlans.find(plan => plan.id === selectedPlan.id);
                // Handle case where selected plan might have been deleted or not yet synced
                if (!currentSelectedPlan) {
                    return (
                        <div className="p-6 text-center text-gray-600">
                            <p>Study plan not found. It might have been deleted or not synced yet.</p>
                            <button
                                onClick={() => setSelectedPlan(null)} // Go back to list of plans
                                className="mt-4 px-6 py-2 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition duration-300"
                            >
                                Back to All Plans
                            </button>
                        </div>
                    );
                }

                // Calculate progress for the current selected plan
                const completedTasks = currentSelectedPlan.tasks ? currentSelectedPlan.tasks.filter(task => task.completed).length : 0;
                const totalTasks = currentSelectedPlan.tasks ? currentSelectedPlan.tasks.length : 0;
                const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                return (
                    <div className="p-6">
                        <h2 className={`text-3xl font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Study Plan: {currentSelectedPlan.name}</h2>
                        <button
                            onClick={() => setSelectedPlan(null)} // Navigate back to list of plans
                            className="mb-4 px-4 py-2 bg-gray-500 text-white text-sm font-semibold rounded-lg hover:bg-gray-600 transition duration-300"
                        >
                            ← Back to All Plans
                        </button>

                        <div className={`p-6 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'} mb-6`}>
                            <h3 className={`text-2xl font-semibold mb-4 border-l-4 pl-3 ${isDarkMode ? 'border-blue-400' : 'border-blue-500'}`}>Plan Details</h3>
                            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Created: {new Date(currentSelectedPlan.createdAt).toLocaleString()}</p>

                            {/* Progress Bar for the Study Plan */}
                            <div className="mt-4 mb-4">
                                <h4 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Progress: {completedTasks}/{totalTasks} tasks completed</h4>
                                <div className={`w-full rounded-full h-2.5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                    <div
                                        className={`h-2.5 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`}
                                        style={{ width: `${progressPercentage}%` }}
                                    ></div>
                                </div>
                                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{progressPercentage.toFixed(0)}% Complete</p>
                            </div>

                            {/* Add New Task Section */}
                            <div className="mt-6">
                                <h4 className={`text-xl font-semibold mb-3 border-l-4 pl-3 ${isDarkMode ? 'border-blue-400' : 'border-blue-500'}`}>Add New Task</h4>
                                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                    <input
                                        type="text"
                                        placeholder="Describe your task (e.g., 'Read Economic Survey Chapter 3')"
                                        className={`flex-grow p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                        value={newTaskContent}
                                        onChange={(e) => setNewTaskContent(e.target.value)}
                                    />
                                    <button
                                        onClick={handleAddTask}
                                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 transform hover:scale-105"
                                    >
                                        Add Task
                                    </button>
                                </div>
                            </div>

                            {/* List of Tasks */}
                            <div className="mt-6">
                                <h4 className={`text-xl font-semibold mb-3 border-l-4 pl-3 ${isDarkMode ? 'border-blue-400' : 'border-blue-500'}`}>Tasks</h4>
                                {currentSelectedPlan.tasks && currentSelectedPlan.tasks.length > 0 ? (
                                    <ul className="space-y-3">
                                        {currentSelectedPlan.tasks.map(task => (
                                            <li key={task.id} className={`p-4 rounded-lg shadow-sm flex items-center justify-between ${task.completed ? (isDarkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200') : (isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200')}`}>
                                                <div className="flex items-center flex-grow">
                                                    <input
                                                        type="checkbox"
                                                        checked={task.completed}
                                                        onChange={() => handleToggleTaskComplete(currentSelectedPlan.id, task)}
                                                        className="form-checkbox h-5 w-5 text-green-600 rounded"
                                                    />
                                                    <span className={`ml-3 text-lg ${task.completed ? 'line-through text-gray-500' : (isDarkMode ? 'text-white' : 'text-gray-800')}`}>
                                                        {task.content}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteTask(currentSelectedPlan.id, task)}
                                                    className="ml-4 p-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition duration-300"
                                                >
                                                    Delete
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No tasks added to this plan yet.</p>
                                )}
                            </div>

                            {/* Study Plan Enhancement Section */}
                            <button
                                onClick={() => enhanceStudyPlan(currentSelectedPlan)}
                                disabled={planEnhancementLoading}
                                className="mt-8 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {planEnhancementLoading ? 'Generating Suggestions...' : '  ✨   Enhance Study Plan'}
                            </button>
                            {planEnhancementFeedback && (
                                <div className={`mt-6 p-4 rounded-lg border ${isDarkMode ? 'bg-purple-900 border-purple-700 text-purple-100' : 'bg-purple-50 border-purple-200 text-gray-800'}`}>
                                    <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-800'}`}>Enhancement Suggestions:</h3>
                                    <p className="whitespace-pre-wrap">{planEnhancementFeedback}</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'mock-tests':
                const getMockTestPhaseDisplayName = (phaseKey) => rbiSyllabus[phaseKey]?.title || phaseKey;

                // Renders the content based on the mockTestViewLevel state
                const renderMockTestContent = () => {
                    switch (mockTestViewLevel) {
                        case 'phases':
                            const availableMockTestPhases = Object.keys(rbiSyllabus).sort((a, b) => {
                                if (a === 'Uncategorized Phase') return 1; // Uncategorized last
                                if (b === 'Uncategorized Phase') return -1;
                                return a.localeCompare(b);
                            });
                            return (
                                <div className={`p-6 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                    <h3 className={`text-2xl font-semibold mb-4 border-l-4 pl-3 ${isDarkMode ? 'text-gray-100 border-teal-400' : 'text-gray-700 border-teal-500'}`}>Select Phase for Mock Test</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {availableMockTestPhases.map(phaseKey => (
                                            <div
                                                key={phaseKey}
                                                className={`relative p-6 rounded-xl shadow-md border cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-br from-teal-900 to-teal-800 border-teal-700 text-teal-100' : 'bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 text-teal-800'}`}
                                                onClick={() => {
                                                    setCurrentMockTestPhase(phaseKey);
                                                    setMockTestViewLevel('subjects');
                                                }}
                                            >
                                                <Layers className={`mb-3 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} size={32} />
                                                <h4 className="text-xl font-bold mb-2">
                                                    {getMockTestPhaseDisplayName(phaseKey)}
                                                </h4>
                                                <p className={`text-sm ${isDarkMode ? 'text-teal-200' : 'text-gray-600'}`}>
                                                    Generate mock tests from this phase.
                                                </p>
                                                <ChevronRight size={20} className={`absolute top-6 right-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        case 'subjects':
                            const allMockTestSubjectsForPhase = rbiSyllabus[currentMockTestPhase]?.sections || [];
                            const sortedAllMockTestSubjects = [...allMockTestSubjectsForPhase].sort((a,b) => a.name.localeCompare(b.name));
                            return (
                                <div className={`p-6 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-center mb-4">
                                        <button
                                            onClick={() => {
                                                setMockTestViewLevel('phases');
                                                setCurrentMockTestPhase(null);
                                                // Reset test states when navigating back
                                                setGeneratedTestQuestions([]);
                                                setTestAnswers({});
                                                setTestResults(null);
                                            }}
                                            className="mr-3 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                                        >
                                            ← Back to Phases
                                        </button>
                                        <h3 className={`text-2xl font-semibold border-l-4 pl-3 ${isDarkMode ? 'text-gray-100 border-teal-400' : 'text-gray-700 border-teal-500'}`}>
                                            Select Subject in {getMockTestPhaseDisplayName(currentMockTestPhase)}
                                        </h3>
                                    </div>
                                    {sortedAllMockTestSubjects.length === 0 ? (
                                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-8`}>No subjects defined for this phase.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {sortedAllMockTestSubjects.map(section => (
                                                <div
                                                    key={section.name}
                                                    className={`relative p-6 rounded-xl shadow-md border cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-br from-yellow-900 to-yellow-800 border-yellow-700 text-yellow-100' : 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-800'}`}
                                                    onClick={() => {
                                                        setCurrentMockTestSubject(section.name);
                                                        setMockTestViewLevel('chapters');
                                                    }}
                                                >
                                                    <BookOpen className={`mb-3 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} size={32} />
                                                    <h4 className="text-xl font-bold mb-2">
                                                        {section.name}
                                                    </h4>
                                                    <p className={`text-sm ${isDarkMode ? 'text-yellow-200' : 'text-gray-600'}`}>
                                                        Select to generate chapter-wise mock tests.
                                                    </p>
                                                    <ChevronRight size={20} className={`absolute top-6 right-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        case 'chapters':
                            const syllabusMockTestChapters = rbiSyllabus[currentMockTestPhase]?.sections.find(
                                s => s.name === currentMockTestSubject
                            )?.topics || [];

                            const sortedMockTestChapters = [...syllabusMockTestChapters].sort((a, b) => {
                                // Specific sorting for "Current Affairs (Date-wise)"
                                if (currentMockTestSubject === "General Awareness" && a.match(/^\d{4}-\d{2}-\d{2}$/) && b.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                    return b.localeCompare(a); // Sort dates descending
                                }
                                // Generic chapter sorting (e.g., "Chapter 1", "Chapter 2A")
                                const numA = extractChapterNum(a);
                                const numB = extractChapterNum(b);
                                if (numA === Infinity && numB === Infinity) {
                                    return a.localeCompare(b); // Alphabetical for non-numbered
                                }
                                if (numA === Infinity) return 1; // Non-numbered after numbered
                                if (numB === Infinity) return -1;
                                return numA - numB; // Numeric sort for numbered chapters
                            });

                            return (
                                <div className={`p-6 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-center mb-4">
                                        <button
                                            onClick={() => {
                                                setMockTestViewLevel('subjects');
                                                setCurrentMockTestSubject(null);
                                                // Reset test states
                                                setGeneratedTestQuestions([]);
                                                setTestAnswers({});
                                                setTestResults(null);
                                            }}
                                            className="mr-3 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                                        >
                                            ← Back to Subjects
                                        </button>
                                        <h3 className={`text-2xl font-semibold border-l-4 pl-3 ${isDarkMode ? 'text-gray-100 border-teal-400' : 'text-gray-700 border-teal-500'}`}>
                                            Chapters in {currentMockTestSubject} ({getMockTestPhaseDisplayName(currentMockTestPhase)})
                                        </h3>
                                    </div>
                                    {sortedMockTestChapters.length === 0 ? (
                                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-8`}>No chapters found for this subject.</p>
                                    ) : (
                                        <div className="flex flex-col space-y-4">
                                            {sortedMockTestChapters.map(chapterName => {
                                                const displayChapterName = chapterName.match(/^\d{4}-\d{2}-\d{2}$/)
                                                    ? new Date(chapterName).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
                                                    : chapterName;
                                                return (
                                                    <div
                                                        key={chapterName}
                                                        className={`relative p-5 rounded-xl shadow-sm border flex items-center justify-between ${isDarkMode ? 'bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700 text-blue-100' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-800'}`}
                                                    >
                                                        <div className="flex items-center">
                                                            <ListTodo className={`mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} size={24} />
                                                            <h4 className="text-lg font-semibold flex-grow">{displayChapterName}</h4>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                // Call the existing handleGenerateChapterTest from here
                                                                handleGenerateChapterTest(currentMockTestPhase, currentMockTestSubject, chapterName);
                                                            }}
                                                            disabled={isTestLoading} // Use the general test loading state
                                                            className="px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-teal-700 transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {isTestLoading ? 'Generating...' : 'Generate Chapter Test'}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        default:
                            return null;
                    }
                };
                return (
                    <div className="p-6">
                        <h2 className={`text-3xl font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Mock Tests</h2>
                        {renderMockTestContent()}
                    </div>
                );
            case 'performance':
                return (
                    <div className="p-6">
                        <h2 className={`text-3xl font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Performance Analysis</h2>
                        <div className={`p-6 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <h3 className={`text-2xl font-semibold mb-4 border-l-4 pl-3 ${isDarkMode ? 'text-gray-100 border-gray-400' : 'text-gray-700 border-gray-500'}`}>Test History</h3>
                            {testResultsHistory.length === 0 ? (
                                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No test attempts recorded yet. Take a mock test!</p>
                            ) : (
                                <ul className="space-y-3 max-h-96 overflow-y-auto">
                                    {testResultsHistory.map(result => (
                                        <li key={result.id} className={`p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center ${result.isCorrect ? (isDarkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200') : (isDarkMode ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200')}`}>
                                            <div className="flex-grow">
                                                <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                    <span className="font-semibold">{result.subject} {result.chapter ? `(${result.chapter})` : ''}:</span> {result.question}
                                                </p>
                                                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    Your Answer: <span className="font-semibold">{result.selectedOption}</span>
                                                </p>
                                                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    Correct Answer: <span className="font-semibold">{result.correctAnswer}</span>
                                                </p>
                                                {result.explanation && (
                                                    <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        **Explanation:** {result.explanation}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex-shrink-0 mt-2 sm:mt-0 sm:ml-4 text-right">
                                                <p className={`text-lg font-bold ${result.isCorrect ? (isDarkMode ? 'text-green-300' : 'text-green-700') : (isDarkMode ? 'text-red-300' : 'text-red-700')}`}>
                                                    {result.isCorrect ? 'Correct' : 'Incorrect'}
                                                </p>
                                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(result.date).toLocaleString()}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className={`mt-6 p-4 rounded-lg italic ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                            Future enhancement: Visual charts and metrics for performance trends.
                        </div>
                    </div>
                );
            case 'ai-expert':
                return (
                    <div className="p-6">
                        <h2 className={`text-3xl font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Ask the AI Coach</h2>
                        <div className={`p-6 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <h3 className={`text-2xl font-semibold mb-4 border-l-4 pl-3 ${isDarkMode ? 'text-gray-100 border-purple-400' : 'text-gray-700 border-purple-500'}`}>Ask Question</h3>
                            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Ask any question related to RBI Grade B syllabus, concepts, or general preparation.
                                The AI will do its best to provide a helpful answer.
                            </p>
                            <textarea
                                className={`w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                rows="5"
                                placeholder="E.g., 'Explain the concept of Financial Inclusion.', 'What are the key differences between monetary and fiscal policy?'"
                                value={llmQuestion}
                                onChange={(e) => setLlmQuestion(e.target.value)}
                            ></textarea>
                            <button
                                onClick={askLlmExpert}
                                disabled={llmLoading}
                                className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {llmLoading ? 'Thinking...' : 'Ask Question'}
                            </button>
                            {llmAnswer && (
                                <div className={`mt-6 p-4 rounded-lg border ${isDarkMode ? 'bg-purple-900 border-purple-700 text-purple-100' : 'bg-purple-50 border-purple-200 text-gray-800'}`}>
                                    <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-800'}`}>Answer:</h3>
                                    <p className="whitespace-pre-wrap">{llmAnswer}</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'essay-evaluator':
                return (
                    <div className="p-6">
                        <h2 className={`text-3xl font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Essay/Precis Evaluator</h2>
                        <div className={`p-6 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <h3 className={`text-2xl font-semibold mb-4 border-l-4 pl-3 ${isDarkMode ? 'text-gray-100 border-orange-400' : 'text-gray-700 border-orange-500'}`}>Get Feedback</h3>
                            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Paste your essay or precis below and get AI-powered feedback on grammar, coherence, vocabulary, and conciseness for your English Writing Skills paper.
                            </p>
                            <textarea
                                className={`w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-orange-400 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                rows="10"
                                placeholder="Paste your essay or precis here..."
                                value={essayInput}
                                onChange={(e) => setEssayInput(e.target.value)}
                            ></textarea>
                            <button
                                onClick={getEssayFeedback}
                                disabled={essayLoading}
                                className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700 transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {essayLoading ? 'Analyzing...' : '  ✨   Get Feedback'}
                            </button>
                            {essayFeedback && (
                                <div className={`mt-6 p-4 rounded-lg border ${isDarkMode ? 'bg-orange-900 border-orange-700 text-orange-100' : 'bg-orange-50 border-orange-200 text-gray-800'}`}>
                                    <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-orange-300' : 'text-orange-800'}`}>Feedback:</h3>
                                    <p className="whitespace-pre-wrap">{essayFeedback}</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'resources':
                return (
                    <div className="p-6">
                        <h2 className={`text-3xl font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Recommended Resources</h2>
                        <div className={`p-6 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <h3 className={`text-2xl font-semibold mb-4 border-l-4 pl-3 ${isDarkMode ? 'text-gray-100 border-gray-400' : 'text-gray-700 border-gray-500'}`}>Books & Study Materials</h3>
                            <ul className={`list-disc list-inside space-y-2 mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <li>**General Awareness:** Lucent's General Knowledge, Current Affairs Magazines (e.g., "The Hindu," "The Economic Times")</li>
                                <li>**English Language:** "Word Power Made Easy" by Norman Lewis, "High School English Grammar and Composition" by Wren and Martin</li>
                                <li>**Quantitative Aptitude:** "Quantitative Aptitude for Competitive Examinations" by R.S. Aggarwal, "Magical Book on Quicker Maths" by M. Tyra</li>
                                <li>**Reasoning Ability:** "A Modern Approach to Verbal & Non-Verbal Reasoning" by R.S. Aggarwal, "Analytical Reasoning" by M.K. Pandey</li>
                                <li>**Economic and Social Issues (ESI):** "Indian Economy" by Ramesh Singh, Economic Survey, Union Budget, NITI Aayog Reports</li>
                                <li>**Finance and Management (FM):** "Indian Financial System" by Bharati V. Pathak, "Fundamentals of Financial Management" by Prasanna Chandra, "Organizational Behaviour" by Stephen P. Robbins</li>
                            </ul>
                            <h3 className={`text-2xl font-semibold mb-4 border-l-4 pl-3 ${isDarkMode ? 'text-gray-100 border-gray-400' : 'text-gray-700 border-gray-500'}`}>Previous Year Question Papers</h3>
                            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Practicing previous year papers is crucial. Here are some years for which papers are commonly available:
                            </p>
                            <ul className={`list-disc list-inside space-y-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                                <li><a href="https://www.adda247.com/jobs/rbi-grade-b-previous-year-question-papers/" target="_blank" rel="noopener noreferrer" className="hover:underline">RBI Grade B Previous Year Papers (Adda247)</a></li>
                                <li><a href="https://cracku.in/rbi-grade-b-previous-papers" target="_blank" rel="noopener noreferrer" className="hover:underline">RBI Grade B Previous Year Question Papers (Cracku)</a></li>
                                <li>Search online for specific years like "RBI Grade B 2024 Question Paper PDF"</li>
                            </ul>
                        </div>
                    </div>
                );
            case 'notes':
                // Organize notes hierarchically by phase, subject, and chapter
                const organizedNotesHierarchical = notes.reduce((acc, note) => {
                    const phaseKey = note.phase || 'Uncategorized Phase';
                    const subjectKey = note.subject || 'Uncategorized Subject';
                    const chapterKey = (note.subject === "General Awareness" && note.chapter && note.chapter.match(/^\d{4}-\d{2}-\d{2}$/))
                                       ? note.chapter // Use the date itself as the chapter key for current affairs
                                       : (note.chapter || 'Uncategorized Chapter'); // Use 'Uncategorized Chapter' if no chapter

                    if (!acc[phaseKey]) acc[phaseKey] = {};
                    if (!acc[phaseKey][subjectKey]) acc[phaseKey][subjectKey] = {};
                    if (!acc[phaseKey][subjectKey][chapterKey]) acc[phaseKey][subjectKey][chapterKey] = [];
                    acc[phaseKey][subjectKey][chapterKey].push(note);
                    return acc;
                }, {});

                // Helper to get display name for phases from syllabus
                const getPhaseDisplayName = (phaseKey) => rbiSyllabus[phaseKey]?.title || phaseKey;

                // Renders notes content based on the noteViewLevel state (phases, subjects, chapters, notes list)
                const renderNotesContent = () => {
                    switch (noteViewLevel) {
                        case 'phases':
                            const availablePhases = Object.keys(organizedNotesHierarchical).sort((a, b) => {
                                if (a === 'Uncategorized Phase') return 1; // Put uncategorized last
                                if (b === 'Uncategorized Phase') return -1;
                                return a.localeCompare(b);
                            });
                            return (
                                <div className={`p-6 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                    <h3 className={`text-2xl font-semibold mb-4 border-l-4 pl-3 ${isDarkMode ? 'text-gray-100 border-blue-400' : 'text-gray-700 border-blue-500'}`}>Browse Notes by Phase</h3>
                                    {availablePhases.length === 0 ? (
                                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-8`}>No notes available. Start by navigating to a chapter and adding one!</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {availablePhases.map(phaseKey => (
                                                <div
                                                    key={phaseKey}
                                                    className={`relative p-6 rounded-xl shadow-md border cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700 text-blue-100' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-800'}`}
                                                    onClick={() => {
                                                        setCurrentNotePhase(phaseKey);
                                                        setNoteViewLevel('subjects');
                                                    }}
                                                >
                                                    <Layers className={`mb-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} size={32} />
                                                    <h4 className="text-xl font-bold mb-2">
                                                        {getPhaseDisplayName(phaseKey)}
                                                    </h4>
                                                    <p className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-gray-600'}`}>
                                                        Contains notes for {Object.keys(organizedNotesHierarchical[phaseKey]).length} subjects.
                                                    </p>
                                                    <ChevronRight size={20} className={`absolute top-6 right-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        case 'subjects':
                            const allSubjectsForPhase = rbiSyllabus[currentNotePhase]?.sections || [];
                            const sortedAllSubjects = [...allSubjectsForPhase].sort((a,b) => a.name.localeCompare(b.name));
                            return (
                                <div className={`p-6 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-center mb-4">
                                        <button
                                            onClick={() => {
                                                setNoteViewLevel('phases');
                                                setCurrentNotePhase(null);
                                            }}
                                            className="mr-3 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                                        >
                                            ← Back to Phases
                                        </button>
                                        <h3 className={`text-2xl font-semibold border-l-4 pl-3 ${isDarkMode ? 'text-gray-100 border-blue-400' : 'text-gray-700 border-blue-500'}`}>
                                            Subjects in {getPhaseDisplayName(currentNotePhase)}
                                        </h3>
                                    </div>
                                    {sortedAllSubjects.length === 0 ? (
                                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-8`}>No subjects defined for this phase in the syllabus.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {sortedAllSubjects.map(section => {
                                                const notesCountForSubject = Object.values(organizedNotesHierarchical[currentNotePhase]?.[section.name] || {}).flat().length;
                                                return (
                                                    <div
                                                        key={section.name}
                                                        className={`relative p-6 rounded-xl shadow-md border cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-br from-green-900 to-green-800 border-green-700 text-green-100' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 text-green-800'}`}
                                                        onClick={() => {
                                                            setCurrentNoteSubject(section.name);
                                                            setNoteViewLevel('chapters');
                                                        }}
                                                    >
                                                        <BookOpen className={`mb-3 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} size={32} />
                                                        <h4 className="text-xl font-bold mb-2">
                                                            {section.name}
                                                        </h4>
                                                        <p className={`text-sm ${isDarkMode ? 'text-green-200' : 'text-gray-600'}`}>
                                                            {notesCountForSubject} notes across {section.topics.length} chapters.
                                                        </p>
                                                        <ChevronRight size={20} className={`absolute top-6 right-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        case 'chapters':
                            const syllabusChapters = rbiSyllabus[currentNotePhase]?.sections.find(
                                s => s.name === currentNoteSubject
                            )?.topics || [];
                            const notesForCurrentSubjectChapters = (organizedNotesHierarchical[currentNotePhase] && organizedNotesHierarchical[currentNotePhase][currentNoteSubject]) || {};

                            const sortedSyllabusChapters = [...syllabusChapters].sort((a, b) => {
                                // Specific sorting for "Current Affairs (Date-wise)"
                                if (currentNoteSubject === "General Awareness" && a.match(/^\d{4}-\d{2}-\d{2}$/) && b.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                    return b.localeCompare(a); // Sort dates descending
                                }
                                // Generic chapter sorting (e.g., "Chapter 1", "Chapter 2A")
                                const numA = extractChapterNum(a);
                                const numB = extractChapterNum(b);
                                if (numA === Infinity && numB === Infinity) {
                                    return a.localeCompare(b); // Alphabetical for non-numbered
                                }
                                if (numA === Infinity) return 1; // Non-numbered after numbered
                                if (numB === Infinity) return -1;
                                return numA - numB; // Numeric sort for numbered chapters
                            });

                            return (
                                <div className={`p-6 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-center mb-4">
                                        <button
                                            onClick={() => {
                                                setNoteViewLevel('subjects');
                                                setCurrentNoteSubject(null);
                                            }}
                                            className="mr-3 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                                        >
                                            ← Back to Subjects
                                        </button>
                                        <h3 className={`text-2xl font-semibold border-l-4 pl-3 ${isDarkMode ? 'text-gray-100 border-blue-400' : 'text-gray-700 border-blue-500'}`}>
                                            Chapters in {currentNoteSubject} ({getPhaseDisplayName(currentNotePhase)})
                                        </h3>
                                    </div>
                                    {sortedSyllabusChapters.length === 0 ? (
                                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-8`}>No chapters found for this subject. Add a note to begin!</p>
                                    ) : (
                                        <div className="flex flex-col space-y-4">
                                            {sortedSyllabusChapters.map(chapterName => {
                                                const displayChapterName = chapterName.match(/^\d{4}-\d{2}-\d{2}$/)
                                                    ? new Date(chapterName).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
                                                    : chapterName;
                                                const notesCount = (notesForCurrentSubjectChapters[chapterName] ? notesForCurrentSubjectChapters[chapterName].length : 0);
                                                return (
                                                    <div
                                                        key={chapterName}
                                                        className={`relative p-5 rounded-xl shadow-sm border flex items-center justify-between ${isDarkMode ? 'bg-gradient-to-br from-yellow-900 to-yellow-800 border-yellow-700 text-yellow-100' : 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-800'}`}
                                                    >
                                                        <div className="flex items-center">
                                                            <ListTodo className={`mr-3 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} size={24} />
                                                            <div>
                                                                <h4 className="text-lg font-semibold">{displayChapterName}</h4>
                                                                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{notesCount} notes</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // Prevent chapter box click
                                                                    setSelectedNotePhase(currentNotePhase);
                                                                    setSelectedNoteSubject(currentNoteSubject);
                                                                    setSelectedNoteChapter(chapterName);
                                                                    setNoteTitle(''); // Clear previous title
                                                                    setNewNoteContent(''); // Clear previous content
                                                                    setSelectedFile(null); // Clear previous file
                                                                    setCurrentAffairsDateInput(''); // Clear date input
                                                                    setShowAddNoteModal(true);
                                                                }}
                                                                className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
                                                                title={`Add Note for ${displayChapterName}`}
                                                            >
                                                                Add Note
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // Prevent chapter box click
                                                                    setCurrentNoteChapter(chapterName);
                                                                    setNoteViewLevel('notesList');
                                                                }}
                                                                className="px-4 py-2 bg-yellow-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-yellow-700 transition duration-300"
                                                                title={`View Notes for ${displayChapterName}`}
                                                            >
                                                                View Notes
                                                            </button>
                                                            {/* The "Take Test" button from Notes remains */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // Prevent chapter box click
                                                                    handleGenerateChapterTest(currentNotePhase, currentNoteSubject, chapterName);
                                                                }}
                                                                disabled={notesCount === 0 || isTestLoading}
                                                                className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-purple-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                title={`Generate Test from Notes for ${displayChapterName}`}
                                                            >
                                                                {isTestLoading ? 'Generating...' : 'Take Test'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        case 'notesList':
                            const notesForChapter = (organizedNotesHierarchical[currentNotePhase] &&
                                                    organizedNotesHierarchical[currentNotePhase][currentNoteSubject] &&
                                                    organizedNotesHierarchical[currentNotePhase][currentNoteSubject][currentNoteChapter]) || [];
                            return (
                                <div className={`p-6 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-center mb-4">
                                        <button
                                            onClick={() => {
                                                setNoteViewLevel('chapters');
                                                setCurrentNoteChapter(null);
                                            }}
                                            className="mr-3 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                                        >
                                            ← Back to Chapters
                                        </button>
                                        <h3 className={`text-2xl font-semibold border-l-4 pl-3 ${isDarkMode ? 'text-gray-100 border-blue-400' : 'text-gray-700 border-blue-500'}`}>
                                            Notes for {currentNoteChapter.match(/^\d{4}-\d{2}-\d{2}$/) ? new Date(currentNoteChapter).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : currentNoteChapter}
                                        </h3>
                                    </div>
                                    <div className="mb-6">
                                        <input
                                            type="text"
                                            placeholder="Search notes in this chapter..."
                                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    {notesForChapter.length === 0 ? (
                                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-8`}>No notes found for this chapter. Add one!</p>
                                    ) : (
                                        <ul className="space-y-3 max-h-96 overflow-y-auto">
                                            {notesForChapter
                                                .filter(note => searchTerm === '' || note.title.toLowerCase().includes(searchTerm.toLowerCase()) || (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase())))
                                                .map(note => (
                                                    <li
                                                        key={note.id}
                                                        onClick={() => { setCurrentViewingNote(note); setShowNoteModal(true); }}
                                                        className={`p-4 rounded-lg shadow-sm border cursor-pointer hover:bg-blue-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-100 hover:bg-blue-50'}`}
                                                    >
                                                            <div className="flex-grow flex items-center">
                                                                {note.uploadedFile ? <File size={18} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mr-2`} /> : <FileText size={18} className={`${isDarkMode ? 'text-blue-400' : 'text-blue-500'} mr-2`} />}
                                                                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{note.title}</p>
                                                            </div>
                                                            <div className="flex-shrink-0 mt-2 sm:mt-0 sm:ml-4 text-right">
                                                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(note.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </li>
                                                    ))}
                                            </ul>
                                        )}
                                    </div>
                                );
                        default:
                            return null;
                    }
                };
                return (
                    <div className="p-6">
                        <h2 className={`text-3xl font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Smart Notes Vault</h2>
                        {showStorageRulesMessage && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4" role="alert">
                                <strong className="font-bold">Permission Error!</strong>
                                <span className="block sm:inline ml-2">To upload files, you need to update your Firebase Storage security rules. Please check the instructions provided in the chat.</span>
                                <button
                                    onClick={() => setShowStorageRulesMessage(false)}
                                    className="ml-4 float-right text-red-700 hover:text-red-900 font-bold"
                                >
                                    &times;
                                </button>
                            </div>
                        )}
                        {renderNotesContent()}
                        {showAddNoteModal && (
                            <AddNoteModal onClose={() => setShowAddNoteModal(false)} />
                        )}
                    </div>
                );
            case 'daily-financial-news':
                // Filter news based on currentNewsCategoryFilter
                const filteredDailyNews = dailyNews.filter(newsItem => {
                    if (currentNewsCategoryFilter === 'All') {
                        return true;
                    }
                    return newsItem.category === currentNewsCategoryFilter;
                });

                // Group filtered news by year, then month, then day
                const groupedNews = filteredDailyNews.reduce((acc, newsItem) => {
                    const date = new Date(newsItem.date);
                    const year = date.getFullYear().toString();
                    const monthKey = `${year}-${(date.getMonth() + 1).toString().padStart(2, '0')}`; // e.g., "2025-06"
                    const dayKey = newsItem.date; // Use the full date string as day key for uniqueness
                    
                    if (!acc[year]) acc[year] = {};
                    if (!acc[year][monthKey]) acc[year][monthKey] = {};
                    if (!acc[year][monthKey][dayKey]) acc[year][monthKey][dayKey] = [];
                    
                    acc[year][monthKey][dayKey].push(newsItem);
                    return acc;
                }, {});

                // Generate a list of months from the start date (e.g., June 2025) up to the current month
                const currentMonth = new Date();
                const startMonth = new Date(2025, 5, 1); // June 2025 (Month is 0-indexed)
                const monthsToDisplay = [];
                let tempMonth = new Date(startMonth);
                while (tempMonth <= new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)) {
                    const year = tempMonth.getFullYear().toString();
                    const month = (tempMonth.getMonth() + 1).toString().padStart(2, '0');
                    monthsToDisplay.push(`${year}-${month}`);
                    tempMonth.setMonth(tempMonth.getMonth() + 1);
                }
                monthsToDisplay.reverse(); // Display most recent months first

                return (
                    <div className="p-6">
                        <h2 className={`text-3xl font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Daily Financial News</h2>
                        <p className={`text-lg text-center mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Track and review daily financial news summaries, organized by date and relevant RBI Grade B syllabus topics.
                        </p>

                        {/* Add News Entry Section */}
                        <div className={`mb-8 p-6 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <h3 className={`text-2xl font-semibold mb-4 border-l-4 pl-3 ${isDarkMode ? 'text-gray-100 border-orange-400' : 'text-gray-700 border-orange-500'}`}>Add New News Entry</h3>
                            <button
                                onClick={() => setShowAddNewsModal(true)}
                                className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700 transition duration-300 transform hover:scale-105"
                            >
                                + Add News for a Day
                            </button>
                        </div>

                        {/* Add News Modal */}
                        {showAddNewsModal && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                                <div className={`rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
                                    <button onClick={() => setShowAddNewsModal(false)} className={`absolute top-4 right-4 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                                        <X size={24} />
                                    </button>
                                    <h3 className="text-2xl font-bold mb-4">Add Daily Financial News Summary</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="newsDate" className={`block text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Date <span className="text-red-500">*</span>:</label>
                                            <input
                                                type="date"
                                                id="newsDate"
                                                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                                value={newNewsDate}
                                                onChange={(e) => setNewNewsDate(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="newsSummary" className={`block text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>News Summary <span className="text-red-500">*</span>:</label>
                                            <textarea
                                                id="newsSummary"
                                                rows="5"
                                                placeholder="Enter a summary of the day's financial news (e.g., 'RBI increases repo rate by 25 bps. New fiscal policy announced...')"
                                                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                                value={newNewsSummary}
                                                onChange={(e) => setNewNewsSummary(e.target.value)}
                                            ></textarea>
                                        </div>
                                        {/* New: News Category Select */}
                                        <div>
                                            <label htmlFor="newsCategory" className={`block text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>News Category <span className="text-red-500">*</span>:</label>
                                            <select
                                                id="newsCategory"
                                                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                                value={newsCategory}
                                                onChange={(e) => setNewNewsCategory(e.target.value)}
                                            >
                                                <option value="">-- Select Category --</option>
                                                <option value="RBI News">RBI News</option>
                                                <option value="PIB News">PIB News</option>
                                                <option value="Current Finance News">Current Finance News</option>
                                            </select>
                                        </div>
                                        <hr className={`my-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                                        <h4 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Syllabus Mapping (Optional)</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label htmlFor="newsPhase" className={`block text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Phase:</label>
                                                <select
                                                    id="newsPhase"
                                                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                                    value={newsPhase}
                                                    onChange={(e) => {
                                                        setNewsPhase(e.target.value);
                                                        setNewNewsSubject(''); // Reset subject and chapter when phase changes
                                                        setNewNewsChapter('');
                                                    }}
                                                >
                                                    <option value="">-- Select Phase --</option>
                                                    {Object.keys(rbiSyllabus).map(phaseKey => (
                                                        <option key={phaseKey} value={phaseKey}>{rbiSyllabus[phaseKey].title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor="newsSubject" className={`block text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Subject:</label>
                                                <select
                                                    id="newsSubject"
                                                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                                    value={newsSubject}
                                                    onChange={(e) => {
                                                        setNewNewsSubject(e.target.value);
                                                        setNewNewsChapter(''); // Reset chapter when subject changes
                                                    }}
                                                    disabled={!newsPhase}
                                                >
                                                    <option value="">-- Select Subject --</option>
                                                    {newsPhase && rbiSyllabus[newsPhase]?.sections.map(section => (
                                                        <option key={section.name} value={section.name}>{section.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor="newsChapter" className={`block text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Chapter:</label>
                                                <select
                                                    id="newsChapter"
                                                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                                    value={newsChapter}
                                                    onChange={(e) => setNewNewsChapter(e.target.value)}
                                                    disabled={!newsSubject}
                                                >
                                                    <option value="">-- Select Chapter --</option>
                                                    {newsSubject && newsPhase && rbiSyllabus[newsPhase]?.sections
                                                        .find(s => s.name === newsSubject)?.topics.map(topic => (
                                                            <option key={topic} value={topic}>{topic}</option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            onClick={() => setShowAddNewsModal(false)}
                                            className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition duration-300"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveDailyNews}
                                            disabled={!newNewsDate || !newNewsSummary.trim() || !newsCategory.trim()} // Category also required
                                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Save News
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* News Detail Modal */}
                        {showNewsDetailModal && (
                            <NewsDetailModal newsItem={currentViewingNewsItem} onClose={() => setShowNewsDetailModal(false)} />
                        )}

                        {/* News Category Tabs */}
                        <div className={`flex justify-center flex-wrap gap-4 mb-8 p-4 rounded-xl shadow-inner ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            {['All', 'RBI News', 'PIB News', 'Current Finance News'].map(category => (
                                <button
                                    key={category}
                                    onClick={() => {
                                        setCurrentNewsCategoryFilter(category);
                                        setExpandedItems({}); // Collapse all timeline sections when switching categories
                                    }}
                                    className={`px-5 py-2 rounded-lg text-lg font-semibold transition-all duration-300 ease-in-out
                                                ${currentNewsCategoryFilter === category
                                                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                                                    : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-200'}`
                                                }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>

                        {/* News Timeline Display */}
                        <div className={`p-6 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <h3 className={`text-2xl font-semibold mb-4 border-l-4 pl-3 ${isDarkMode ? 'text-gray-100 border-blue-400' : 'text-gray-700 border-blue-500'}`}>
                                {currentNewsCategoryFilter === 'All' ? 'All Financial News' : currentNewsCategoryFilter} Timeline
                            </h3>
                            {filteredDailyNews.length === 0 ? (
                                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-8`}>No news entries found for this category yet. Add your first news item!</p>
                            ) : (
                                <div className="space-y-6">
                                    {monthsToDisplay.map(monthKey => {
                                        const [year, monthNum] = monthKey.split('-');
                                        const monthName = new Date(parseInt(year), parseInt(monthNum) - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
                                        const isMonthExpanded = expandedItems[`news-month-${monthKey}`];
                                        const monthData = groupedNews[year] ? groupedNews[year][monthKey] : null;

                                        // Only render months that actually have data in the filtered news or are the current/future month
                                        // This prevents rendering empty month sections from the past
                                        if (!monthData && new Date(monthKey + '-01') > new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)) {
                                            return null;
                                        }

                                        // Filter day keys to only include those with news items in the current category
                                        const daysWithNewsInMonth = monthData ? Object.keys(monthData).filter(dayKey => monthData[dayKey].length > 0) : [];
                                        if (daysWithNewsInMonth.length === 0 && new Date(monthKey + '-01') <= new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)) {
                                            // Don't render month if it has no news for the selected category, unless it's a future month
                                            return null;
                                        }

                                        return (
                                            <div key={monthKey} className={`border rounded-lg overflow-hidden ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                                <button
                                                    onClick={() => toggleItem(`news-month-${monthKey}`)}
                                                    className={`w-full text-left p-4 transition-colors flex justify-between items-center text-lg font-semibold ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                                                >
                                                    {monthName}
                                                    {isMonthExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                <div className={`transition-all duration-300 ease-in-out ${isMonthExpanded ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                                    <div className="p-4 space-y-4">
                                                        {daysWithNewsInMonth.sort((a,b) => b.localeCompare(a)).map(dayKey => { // Sort days descending (most recent day first)
                                                            const dayNews = monthData[dayKey];
                                                            const isDayExpanded = expandedItems[`news-day-${dayKey}`];
                                                            const dayFormatted = new Date(dayKey).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
                                                            return (
                                                                <div key={dayKey} className={`border rounded-lg overflow-hidden ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                                                    <button
                                                                        onClick={() => toggleItem(`news-day-${dayKey}`)}
                                                                        className={`w-full text-left p-3 transition-colors flex justify-between items-center font-medium ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-white hover:bg-gray-50 text-gray-600'}`}
                                                                    >
                                                                        {dayFormatted} ({dayNews.length} news items)
                                                                        {isDayExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                                    </button>
                                                                    <div className={`transition-all duration-300 ease-in-out ${isDayExpanded ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                                                        <ul className={`p-3 space-y-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                                                            {dayNews.map(newsItem => (
                                                                                <li
                                                                                    key={newsItem.id}
                                                                                    onClick={() => { setCurrentViewingNewsItem(newsItem); setShowNewsDetailModal(true); }}
                                                                                    className={`p-3 rounded-lg shadow-sm border cursor-pointer hover:bg-blue-50 transition-colors flex items-center ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-600' : 'bg-gray-50 border-gray-50 hover:bg-blue-50'}`}
                                                                                >
                                                                                    <div className="flex-grow flex items-center">
                                                                                        <FileText size={20} className={`${isDarkMode ? 'text-blue-400' : 'text-blue-500'} mr-2`} />
                                                                                        <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                                                            {newsItem.summaryText ? `${newsItem.summaryText.substring(0, 50)}...` : 'News Summary'}
                                                                                        </p>
                                                                                    </div>
                                                                                    <p className={`text-xs ml-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                                        {newsItem.category && `Category: ${newsItem.category} • `}
                                                                                        {newsItem.phase && `Phase: ${rbiSyllabus[newsItem.phase]?.title || newsItem.phase}`}
                                                                                        {newsItem.subject && ` • Subject: ${newsItem.subject}`}
                                                                                        {newsItem.chapter && ` • Chapter: ${newsItem.chapter}`}
                                                                                    </p>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'take-test':
                // Format chapter name for display, especially for date-wise current affairs
                const displayTestChapterName = currentTestChapter && currentTestChapter.match(/^\d{4}-\d{2}-\d{2}$/)
                    ? new Date(currentTestChapter).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
                    : currentTestChapter;
                return (
                    <div className="p-6">
                        <h2 className={`text-3xl font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Take Test: {displayTestChapterName}</h2>
                        <button
                            onClick={() => {
                                setCurrentPage('mock-tests'); // Go back to mock tests view
                                setGeneratedTestQuestions([]); // Clear test questions
                                setTestAnswers({}); // Clear answers
                                setTestResults(null); // Clear results
                                setMockTestViewLevel('chapters'); // Return to chapters list in mock test section
                            }}
                            className="mb-4 px-4 py-2 bg-gray-500 text-white text-sm font-semibold rounded-lg hover:bg-gray-600 transition duration-300"
                        >
                            ← Back to Mock Tests
                        </button>
                        <div className={`p-6 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <h3 className={`text-2xl font-semibold mb-4 border-l-4 pl-3 ${isDarkMode ? 'text-gray-100 border-purple-400' : 'text-gray-700 border-purple-500'}`}>Questions</h3>
                            {isTestLoading ? (
                                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-8`}>Generating questions, please wait...</p>
                            ) : generatedTestQuestions.length === 0 ? (
                                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-8`}>No questions generated. Please ensure notes are available for this chapter and try again.</p>
                            ) : (
                                <div className="space-y-8">
                                    {generatedTestQuestions.map((q, qIndex) => (
                                        <div key={qIndex} className={`p-4 rounded-lg shadow-sm border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                                            <p className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{qIndex + 1}. {q.question}</p>
                                            <div className="space-y-2">
                                                {q.options.map((option, oIndex) => (
                                                    <label
                                                        key={oIndex}
                                                        className={`flex items-center p-2 rounded-md shadow-xs cursor-pointer transition duration-150
                                                                    ${testResults ?
                                                                        (testResults.details[qIndex].isCorrect && testResults.details[qIndex].correctAnswer === option
                                                                            ? (isDarkMode ? 'bg-green-900' : 'bg-green-100') // Correct answer after submission
                                                                            : (testAnswers[qIndex] === option && !testResults.details[qIndex].isCorrect
                                                                                ? (isDarkMode ? 'bg-red-900' : 'bg-red-100') // User's incorrect answer
                                                                                : (isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'))) // Unselected or correct answer not chosen
                                                                        : (isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100') // Before submission
                                                                    }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`question-${qIndex}`}
                                                            value={option}
                                                            checked={testAnswers[qIndex] === option}
                                                            onChange={() => handleTestOptionChange(qIndex, option)}
                                                            disabled={testResults !== null} // Disable radio buttons after test submission
                                                            className="form-radio h-4 w-4 text-purple-600"
                                                        />
                                                        <span className={`ml-3 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>{option}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            {testResults && (
                                                <>
                                                    <p className={`mt-3 text-sm font-semibold ${testResults.details[qIndex].isCorrect ? (isDarkMode ? 'text-green-300' : 'text-green-600') : (isDarkMode ? 'text-red-300' : 'text-red-600')}`}>
                                                        Your Answer: {testAnswers[qIndex] || 'Not Answered'}
                                                    </p>
                                                    {!testResults.details[qIndex].isCorrect && (
                                                        <p className={`mt-1 text-sm font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
                                                            Correct Answer: {q.answer}
                                                        </p>
                                                    )}
                                                    {q.explanation && (
                                                        <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            **Explanation:** {q.explanation}
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                    {!testResults && (
                                        <button
                                            onClick={submitTest}
                                            className="mt-6 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition duration-300 transform hover:scale-105"
                                        >
                                            Submit Test
                                        </button>
                                    )}
                                    {testResults && (
                                        <div className={`mt-6 p-4 rounded-lg border ${isDarkMode ? 'bg-blue-900 border-blue-700 text-blue-100' : 'bg-blue-50 border-blue-200 text-gray-800'}`}>
                                            <h3 className={`font-bold text-xl mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>Test Results:</h3>
                                            <p className="text-lg">You scored: <span className="font-semibold">{testResults.score} / {testResults.total}</span></p>
                                            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Review your answers above.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    // Main App component structure
    return (
        <div className={`min-h-screen font-inter flex flex-col ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
            {/* Global Message Modal */}
            {showMessage && (
                <div className="fixed top-4 right-4 bg-blue-600 text-white px-5 py-3 rounded-lg shadow-xl z-50 animate-fade-in-down">
                    {message}
                </div>
            )}

            {/* Note Details Modal */}
            {showNoteModal && (
                <NoteModal note={currentViewingNote} onClose={() => { setShowNoteModal(false); setCurrentViewingNote(null); }} />
            )}

            {/* Navigation Bar */}
            <nav className="bg-gradient-to-r from-indigo-700 to-blue-700 p-4 shadow-xl">
                <div className="container mx-auto flex flex-wrap justify-start items-center">
                    <div className="text-white text-2xl font-extrabold tracking-wide mb-2 sm:mb-0 mr-4">
                        RBI Grade B Success
                    </div>
                    {/* Navigation Buttons */}
                    <div className="flex flex-wrap flex-grow justify-start space-x-2 sm:space-x-4 mt-2 sm:mt-0">
                        <NavButton text="Dashboard" onClick={() => setCurrentPage('dashboard')} active={currentPage === 'dashboard'} />
                        <NavButton text="Syllabus" onClick={() => setCurrentPage('syllabus')} active={currentPage === 'syllabus'} />
                        <NavButton text="Notes" onClick={() => { setCurrentPage('notes'); setNoteViewLevel('phases'); setCurrentNotePhase(null); setCurrentNoteSubject(null); setCurrentNoteChapter(null); setSearchTerm(''); }} active={currentPage === 'notes'} />
                        <NavButton text="Mock Tests" onClick={() => { setCurrentPage('mock-tests'); setMockTestViewLevel('phases'); setCurrentMockTestPhase(null); setCurrentMockTestSubject(null); setCurrentMockTestChapter(null); setGeneratedTestQuestions([]); setTestAnswers({}); setTestResults(null); }} active={currentPage === 'mock-tests'} />
                        <NavButton text="Daily Financial News" onClick={() => setCurrentPage('daily-financial-news')} active={currentPage === 'daily-financial-news'} />
                        <NavButton text="AI Coach" onClick={() => setCurrentPage('ai-expert')} active={currentPage === 'ai-expert'} />
                        <NavButton text="Essay Evaluator" onClick={() => setCurrentPage('essay-evaluator')} active={currentPage === 'essay-evaluator'} />
                        <NavButton text="Performance" onClick={() => setCurrentPage('performance')} active={currentPage === 'performance'} />
                        <NavButton text="Resources" onClick={() => setCurrentPage('resources')} active={currentPage === 'resources'} />
                        <NavButton text="Study Plan" onClick={() => setSelectedPlan(null) || setCurrentPage('study-plan')} active={currentPage === 'study-plan'} />
                    </div>
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-2 ml-auto rounded-full bg-blue-500 hover:bg-blue-400 text-white transition-colors duration-200"
                        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className={`flex-grow container mx-auto my-8 p-4 rounded-xl shadow-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                {renderPage()}
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-white p-4 text-center text-sm">
                <div className="container mx-auto">
                    &copy; {new Date().getFullYear()} RBI Grade B Success App. All rights reserved.
                </div>
            </footer>
        </div>
    );
}

// Reusable Navigation Button Component
const NavButton = ({ text, onClick, active }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-300 whitespace-nowrap
            ${active
                ? 'bg-blue-500 text-white shadow-lg border-l-4 border-white'
                : 'text-blue-100 hover:bg-blue-600 hover:text-white'
            }`}
    >
        {text}
    </button>
);

// Reusable Dashboard Card Component
const DashboardCard = ({ icon, title, description, onClick, bgColor, borderColor, shadowColor }) => (
    <div
        className={`relative p-6 rounded-xl shadow-lg hover:${shadowColor} hover:shadow-xl transition-all duration-300 ease-in-out
                   transform hover:-translate-y-1 cursor-pointer border ${bgColor} ${borderColor}`}
        onClick={onClick}
    >
        <div>
            <div className="text-5xl mb-4 text-center">
                {icon}
            </div>
            <h3 className={`text-xl font-bold mb-2 text-center ${bgColor.includes('900') ? 'text-white' : 'text-gray-800'}`}>{title}</h3>
            <p className={`text-sm text-center ${bgColor.includes('900') ? 'text-gray-300' : 'text-gray-600'}`}>{description}</p>
        </div>
        <div className="mt-4 text-center">
             <span className={`font-semibold text-sm ${bgColor.includes('900') ? 'text-blue-300' : 'text-blue-600'}`}>Explore →</span>
        </div>
    </div>
);

export default App;