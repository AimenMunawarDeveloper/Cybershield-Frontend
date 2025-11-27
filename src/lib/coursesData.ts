export interface Submodule {
  id: string;
  title: string;
}

export interface Module {
  id: string;
  title: string;
  submodules: Submodule[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  levelName: string;
  duration: string;
  difficulty: string;
  category: string;
  modules: Module[];
  skills: string[];
  hours: number;
  labs: number;
  targetAudience: string;
  goal: string;
  imageUrl: string;
  isPremium: boolean;
  isCustom: boolean;
}

export const courses: Course[] = [
  // LEVEL 1 — BEGINNER
  {
    id: "1",
    title: "Cybersecurity Essentials",
    description:
      "Introduces basic cybersecurity concepts, risks, and best practices for staying safe online.",
    level: "beginner",
    levelName: "Level 1 — Beginner (Awareness Track)",
    duration: "2 hours",
    difficulty: "Beginner",
    category: "Security Awareness",
    hours: 2,
    labs: 3,
    targetAudience:
      "Students, general public, new employees, non-technical users",
    goal: "Identify, avoid, and report common cyber threats",
    imageUrl:
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isPremium: false,
    isCustom: false,
    modules: [
      {
        id: "1",
        title: "What is Cybersecurity?",
        submodules: [],
      },
      {
        id: "2",
        title: "Types of Cyber Threats",
        submodules: [
          { id: "2.1", title: "Phishing" },
          { id: "2.2", title: "Malware" },
          { id: "2.3", title: "Scams" },
        ],
      },
      {
        id: "3",
        title: "Safe Internet Practices",
        submodules: [],
      },
      {
        id: "4",
        title: "Password Hygiene & MFA",
        submodules: [],
      },
      {
        id: "5",
        title: "Protecting Personal Devices",
        submodules: [],
      },
      {
        id: "6",
        title: "Social Media Safety",
        submodules: [],
      },
      {
        id: "7",
        title: "Dynamic Module: Latest Digital Threats",
        submodules: [],
      },
    ],
    skills: [
      "Threat Identification",
      "Safe Browsing",
      "Password Management",
      "Device Security",
      "Social Media Privacy",
    ],
  },
  {
    id: "2",
    title: "Phishing & Scam Awareness",
    description:
      "Learn to identify and avoid phishing attacks through interactive scenarios and real-world examples from Pakistan.",
    level: "beginner",
    levelName: "Level 1 — Beginner (Awareness Track)",
    duration: "1.5 hours",
    difficulty: "Beginner",
    category: "Security Awareness",
    hours: 1.5,
    labs: 2,
    targetAudience:
      "Students, general public, new employees, non-technical users",
    goal: "Identify, avoid, and report common cyber threats",
    imageUrl:
      "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isPremium: false,
    isCustom: false,
    modules: [
      {
        id: "1",
        title: "What is Phishing?",
        submodules: [],
      },
      {
        id: "2",
        title: "Types of Phishing",
        submodules: [
          { id: "2.1", title: "Email Phishing" },
          { id: "2.2", title: "SMS Phishing" },
          { id: "2.3", title: "WhatsApp Phishing" },
        ],
      },
      {
        id: "3",
        title: "Recognizing Suspicious Links",
        submodules: [],
      },
      {
        id: "4",
        title: "Real Examples from Pakistan",
        submodules: [
          { id: "4.1", title: "JazzCash Scams" },
          { id: "4.2", title: "HBL Scams" },
          { id: "4.3", title: "NADRA Scams" },
        ],
      },
      {
        id: "5",
        title: "Safe Browsing & Fake Websites",
        submodules: [],
      },
      {
        id: "6",
        title: "Reporting Phishing",
        submodules: [],
      },
      {
        id: "7",
        title: "Dynamic Module: New Global + Local Phishing Trends",
        submodules: [],
      },
    ],
    skills: [
      "Phishing Detection",
      "Link Analysis",
      "Scam Recognition",
      "Threat Reporting",
    ],
  },
  {
    id: "3",
    title: "Password Security & Authentication",
    description:
      "Master the art of creating and managing strong passwords to protect your digital identity and accounts.",
    level: "beginner",
    levelName: "Level 1 — Beginner (Awareness Track)",
    duration: "1 hour",
    difficulty: "Beginner",
    category: "Access Control",
    hours: 1,
    labs: 1,
    targetAudience:
      "Students, general public, new employees, non-technical users",
    goal: "Identify, avoid, and report common cyber threats",
    imageUrl:
      "https://images.unsplash.com/photo-1590736969955-71cc94901144?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isPremium: false,
    isCustom: false,
    modules: [
      {
        id: "1",
        title: "What makes a strong password?",
        submodules: [],
      },
      {
        id: "2",
        title: "Password managers",
        submodules: [],
      },
      {
        id: "3",
        title: "What is MFA?",
        submodules: [],
      },
      {
        id: "4",
        title: "Common password mistakes",
        submodules: [],
      },
      {
        id: "5",
        title: "Role of biometrics",
        submodules: [],
      },
      {
        id: "6",
        title: "Authentication attacks (Beginner explanation)",
        submodules: [],
      },
    ],
    skills: [
      "Password Management",
      "Multi-Factor Authentication",
      "Biometric Security",
      "Account Protection",
    ],
  },
  {
    id: "4",
    title: "Mobile & Social Media Security",
    description:
      "Protect your mobile devices and learn about mobile-specific security threats and best practices.",
    level: "beginner",
    levelName: "Level 1 — Beginner (Awareness Track)",
    duration: "1.5 hours",
    difficulty: "Beginner",
    category: "Device Security",
    hours: 1.5,
    labs: 2,
    targetAudience:
      "Students, general public, new employees, non-technical users",
    goal: "Identify, avoid, and report common cyber threats",
    imageUrl:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isPremium: false,
    isCustom: false,
    modules: [
      {
        id: "1",
        title: "Social media privacy settings",
        submodules: [],
      },
      {
        id: "2",
        title: "WhatsApp safety",
        submodules: [],
      },
      {
        id: "3",
        title: "Avoiding clickbait",
        submodules: [],
      },
      {
        id: "4",
        title: "Recognizing scam calls",
        submodules: [],
      },
      {
        id: "5",
        title: "App permissions",
        submodules: [],
      },
      {
        id: "6",
        title: "Mobile malware basics",
        submodules: [],
      },
    ],
    skills: [
      "Mobile Security",
      "Social Media Privacy",
      "App Security",
      "Mobile Threat Awareness",
    ],
  },
  {
    id: "5",
    title: "Cyber Hygiene for Daily Life",
    description:
      "Learn essential cybersecurity practices for everyday digital activities and device management.",
    level: "beginner",
    levelName: "Level 1 — Beginner (Awareness Track)",
    duration: "1.5 hours",
    difficulty: "Beginner",
    category: "Security Awareness",
    hours: 1.5,
    labs: 2,
    targetAudience:
      "Students, general public, new employees, non-technical users",
    goal: "Identify, avoid, and report common cyber threats",
    imageUrl:
      "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isPremium: false,
    isCustom: false,
    modules: [
      {
        id: "1",
        title: "Updating devices",
        submodules: [],
      },
      {
        id: "2",
        title: "Safe downloads",
        submodules: [],
      },
      {
        id: "3",
        title: "Public Wi-Fi risks",
        submodules: [],
      },
      {
        id: "4",
        title: "Cloud storage basics",
        submodules: [],
      },
      {
        id: "5",
        title: "Backups",
        submodules: [],
      },
      {
        id: "6",
        title: "Digital footprint",
        submodules: [],
      },
    ],
    skills: [
      "Device Management",
      "Safe Downloads",
      "Network Security",
      "Data Backup",
    ],
  },
  // LEVEL 2 — INTERMEDIATE
  {
    id: "6",
    title: "Intermediate Phishing Defense",
    description:
      "Understand how phishing attacks work and learn advanced techniques to defend against them.",
    level: "intermediate",
    levelName: "Level 2 — Intermediate (Operational Track)",
    duration: "2.5 hours",
    difficulty: "Intermediate",
    category: "Security Awareness",
    hours: 2.5,
    labs: 4,
    targetAudience:
      "IT students, cybersecurity learners, power users, organization staff",
    goal: "Understand how attacks work and how to defend against them",
    imageUrl:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isPremium: false,
    isCustom: false,
    modules: [
      {
        id: "1",
        title: "Psychology of Phishing",
        submodules: [],
      },
      {
        id: "2",
        title: "Spear Phishing vs Mass Phishing",
        submodules: [],
      },
      {
        id: "3",
        title: "Email Header Analysis (simplified)",
        submodules: [],
      },
      {
        id: "4",
        title: "Domain Spoofing",
        submodules: [],
      },
      {
        id: "5",
        title: "Vishing & Smishing",
        submodules: [],
      },
      {
        id: "6",
        title: "Real-World Campaign Analysis",
        submodules: [],
      },
      {
        id: "7",
        title: "Dynamic Module: Emerging Threat Vectors",
        submodules: [],
      },
    ],
    skills: [
      "Phishing Analysis",
      "Email Forensics",
      "Threat Intelligence",
      "Attack Pattern Recognition",
    ],
  },
  {
    id: "7",
    title: "Malware Fundamentals",
    description:
      "Learn about different types of malware, how they spread, and how to protect against them.",
    level: "intermediate",
    levelName: "Level 2 — Intermediate (Operational Track)",
    duration: "3 hours",
    difficulty: "Intermediate",
    category: "Threat Protection",
    hours: 3,
    labs: 5,
    targetAudience:
      "IT students, cybersecurity learners, power users, organization staff",
    goal: "Understand how attacks work and how to defend against them",
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isPremium: false,
    isCustom: false,
    modules: [
      {
        id: "1",
        title: "Malware Types",
        submodules: [
          { id: "1.1", title: "Worm" },
          { id: "1.2", title: "Trojan" },
          { id: "1.3", title: "Ransomware" },
          { id: "1.4", title: "Spyware" },
        ],
      },
      {
        id: "2",
        title: "How malware spreads",
        submodules: [],
      },
      {
        id: "3",
        title: "Indicators of compromise (IOCs)",
        submodules: [],
      },
      {
        id: "4",
        title: "How ransomware works",
        submodules: [],
      },
      {
        id: "5",
        title: "Real case studies",
        submodules: [],
      },
      {
        id: "6",
        title: "Safe handling of suspicious files",
        submodules: [],
      },
    ],
    skills: [
      "Malware Analysis",
      "Threat Detection",
      "IOC Identification",
      "Ransomware Defense",
    ],
  },
  {
    id: "8",
    title: "Network & Cloud Security Basics",
    description:
      "Understand network security fundamentals and learn how to secure cloud environments.",
    level: "intermediate",
    levelName: "Level 2 — Intermediate (Operational Track)",
    duration: "2.5 hours",
    difficulty: "Intermediate",
    category: "Network Security",
    hours: 2.5,
    labs: 4,
    targetAudience:
      "IT students, cybersecurity learners, power users, organization staff",
    goal: "Understand how attacks work and how to defend against them",
    imageUrl:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isPremium: false,
    isCustom: false,
    modules: [
      {
        id: "1",
        title: "What is a network?",
        submodules: [],
      },
      {
        id: "2",
        title: "Firewalls & VPN basics",
        submodules: [],
      },
      {
        id: "3",
        title: "Public vs Private cloud",
        submodules: [],
      },
      {
        id: "4",
        title: "Common cloud risks",
        submodules: [],
      },
      {
        id: "5",
        title: "Securing cloud accounts",
        submodules: [],
      },
      {
        id: "6",
        title: "Misconfigurations",
        submodules: [],
      },
    ],
    skills: [
      "Network Security",
      "Cloud Security",
      "Firewall Configuration",
      "VPN Usage",
    ],
  },
  {
    id: "9",
    title: "Data Privacy & Protection",
    description:
      "Learn about data privacy principles, regulations, and best practices for protecting personal information.",
    level: "intermediate",
    levelName: "Level 2 — Intermediate (Operational Track)",
    duration: "2 hours",
    difficulty: "Intermediate",
    category: "Compliance",
    hours: 2,
    labs: 3,
    targetAudience:
      "IT students, cybersecurity learners, power users, organization staff",
    goal: "Understand how attacks work and how to defend against them",
    imageUrl:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isPremium: false,
    isCustom: false,
    modules: [
      {
        id: "1",
        title: "What is personal data?",
        submodules: [],
      },
      {
        id: "2",
        title: "Data minimization",
        submodules: [],
      },
      {
        id: "3",
        title: "Privacy laws",
        submodules: [
          { id: "3.1", title: "Global regulations" },
          { id: "3.2", title: "Pakistan's PDPL basics" },
        ],
      },
      {
        id: "4",
        title: "Social engineering & privacy",
        submodules: [],
      },
      {
        id: "5",
        title: "Securing files and communication",
        submodules: [],
      },
    ],
    skills: [
      "Data Privacy",
      "Regulatory Compliance",
      "Data Protection",
      "Privacy Best Practices",
    ],
  },
  {
    id: "10",
    title: "Social Engineering Defense",
    description:
      "Understand human psychology in cyber attacks and learn to defend against social engineering tactics.",
    level: "intermediate",
    levelName: "Level 2 — Intermediate (Operational Track)",
    duration: "2.5 hours",
    difficulty: "Intermediate",
    category: "Security Awareness",
    hours: 2.5,
    labs: 4,
    targetAudience:
      "IT students, cybersecurity learners, power users, organization staff",
    goal: "Understand how attacks work and how to defend against them",
    imageUrl:
      "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isPremium: false,
    isCustom: false,
    modules: [
      {
        id: "1",
        title: "Human psychology in attacks",
        submodules: [],
      },
      {
        id: "2",
        title: "Impersonation techniques",
        submodules: [],
      },
      {
        id: "3",
        title: "Credential harvesting",
        submodules: [],
      },
      {
        id: "4",
        title: "Pretexting",
        submodules: [],
      },
      {
        id: "5",
        title: "Baiting",
        submodules: [],
      },
      {
        id: "6",
        title: "Role-based defenses",
        submodules: [],
      },
    ],
    skills: [
      "Social Engineering Awareness",
      "Psychological Defense",
      "Threat Recognition",
      "Behavioral Analysis",
    ],
  },
  // LEVEL 3 — ADVANCED
  {
    id: "11",
    title: "Advanced Phishing & Threat Analysis",
    description:
      "Deep dive into phishing attack methodologies, email authentication, and advanced threat analysis techniques.",
    level: "advanced",
    levelName: "Level 3 — Advanced (Technical & Analytical Track)",
    duration: "4 hours",
    difficulty: "Advanced",
    category: "Threat Protection",
    hours: 4,
    labs: 6,
    targetAudience:
      "Students serious about cybersecurity, SOC interns, technical staff",
    goal: "Understand deeper technical concepts & basic incident response",
    imageUrl:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isPremium: true,
    isCustom: false,
    modules: [
      {
        id: "1",
        title: "How attackers build phishing KITs",
        submodules: [],
      },
      {
        id: "2",
        title: "Email authentication",
        submodules: [
          { id: "2.1", title: "SPF" },
          { id: "2.2", title: "DKIM" },
          { id: "2.3", title: "DMARC" },
        ],
      },
      {
        id: "3",
        title: "Analyzing malicious URLs",
        submodules: [],
      },
      {
        id: "4",
        title: "Detecting fake SSL certificates",
        submodules: [],
      },
      {
        id: "5",
        title: "Reverse-engineering phishing sites (high-level)",
        submodules: [],
      },
      {
        id: "6",
        title: "Incident response to phishing",
        submodules: [],
      },
      {
        id: "7",
        title: "Practical Tasks",
        submodules: [],
      },
    ],
    skills: [
      "Email Forensics",
      "Threat Analysis",
      "Incident Response",
      "Technical Investigation",
    ],
  },
  {
    id: "12",
    title: "Ransomware & Malware Analysis",
    description:
      "Learn about ransomware campaigns, encryption basics, lateral movement, and incident handling procedures.",
    level: "advanced",
    levelName: "Level 3 — Advanced (Technical & Analytical Track)",
    duration: "5 hours",
    difficulty: "Advanced",
    category: "Threat Protection",
    hours: 5,
    labs: 7,
    targetAudience:
      "Students serious about cybersecurity, SOC interns, technical staff",
    goal: "Understand deeper technical concepts & basic incident response",
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isPremium: true,
    isCustom: false,
    modules: [
      {
        id: "1",
        title: "Anatomy of ransomware campaigns",
        submodules: [],
      },
      {
        id: "2",
        title: "Encryption basics",
        submodules: [],
      },
      {
        id: "3",
        title: "Lateral movement",
        submodules: [],
      },
      {
        id: "4",
        title: "MITRE ATT&CK mapping",
        submodules: [],
      },
      {
        id: "5",
        title: "Incident handling steps",
        submodules: [],
      },
      {
        id: "6",
        title: "Case studies",
        submodules: [
          { id: "6.1", title: "WannaCry" },
          { id: "6.2", title: "NotPetya" },
          { id: "6.3", title: "LockBit" },
        ],
      },
      {
        id: "7",
        title: "Practical Tasks",
        submodules: [],
      },
    ],
    skills: [
      "Malware Analysis",
      "Ransomware Defense",
      "MITRE ATT&CK",
      "Incident Response",
    ],
  },
  {
    id: "13",
    title: "Threat Intelligence Basics",
    description:
      "Introduction to threat intelligence, IOCs, IOAs, TTPs, and how to use threat feeds effectively.",
    level: "advanced",
    levelName: "Level 3 — Advanced (Technical & Analytical Track)",
    duration: "3.5 hours",
    difficulty: "Advanced",
    category: "Threat Intelligence",
    hours: 3.5,
    labs: 5,
    targetAudience:
      "Students serious about cybersecurity, SOC interns, technical staff",
    goal: "Understand deeper technical concepts & basic incident response",
    imageUrl:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isPremium: true,
    isCustom: false,
    modules: [
      {
        id: "1",
        title: "What is threat intelligence?",
        submodules: [],
      },
      {
        id: "2",
        title: "IOC, IOA, TTPs",
        submodules: [],
      },
      {
        id: "3",
        title: "Reading threat feeds",
        submodules: [
          { id: "3.1", title: "CISA" },
          { id: "3.2", title: "CVE" },
          { id: "3.3", title: "OTX" },
          { id: "3.4", title: "Abuse.ch" },
        ],
      },
      {
        id: "4",
        title: "Mapping to ATT&CK",
        submodules: [],
      },
      {
        id: "5",
        title: "Creating simple TI reports",
        submodules: [],
      },
    ],
    skills: [
      "Threat Intelligence",
      "IOC Analysis",
      "TTP Mapping",
      "Threat Reporting",
    ],
  },
  {
    id: "14",
    title: "Cloud Security (Advanced Basics)",
    description:
      "Advanced cloud security concepts including IAM, access control, API security, and cloud monitoring.",
    level: "advanced",
    levelName: "Level 3 — Advanced (Technical & Analytical Track)",
    duration: "4 hours",
    difficulty: "Advanced",
    category: "Cloud Security",
    hours: 4,
    labs: 6,
    targetAudience:
      "Students serious about cybersecurity, SOC interns, technical staff",
    goal: "Understand deeper technical concepts & basic incident response",
    imageUrl:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isPremium: true,
    isCustom: false,
    modules: [
      {
        id: "1",
        title: "Cloud shared responsibility model",
        submodules: [],
      },
      {
        id: "2",
        title: "IAM & access control",
        submodules: [],
      },
      {
        id: "3",
        title: "Multi-factor authentication",
        submodules: [],
      },
      {
        id: "4",
        title: "Securing API keys",
        submodules: [],
      },
      {
        id: "5",
        title: "Cloud misconfigurations",
        submodules: [],
      },
      {
        id: "6",
        title: "Logging & monitoring",
        submodules: [],
      },
    ],
    skills: [
      "Cloud Security",
      "IAM Management",
      "API Security",
      "Cloud Monitoring",
    ],
  },
  {
    id: "15",
    title: "Incident Response Fundamentals",
    description:
      "Learn the fundamentals of cybersecurity incident response, evidence collection, and SOC communication.",
    level: "advanced",
    levelName: "Level 3 — Advanced (Technical & Analytical Track)",
    duration: "4.5 hours",
    difficulty: "Advanced",
    category: "Incident Management",
    hours: 4.5,
    labs: 7,
    targetAudience:
      "Students serious about cybersecurity, SOC interns, technical staff",
    goal: "Understand deeper technical concepts & basic incident response",
    imageUrl:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isPremium: true,
    isCustom: false,
    modules: [
      {
        id: "1",
        title: "What is an incident?",
        submodules: [],
      },
      {
        id: "2",
        title: "Phases of IR (NIST 800-61)",
        submodules: [],
      },
      {
        id: "3",
        title: "Collecting evidence",
        submodules: [],
      },
      {
        id: "4",
        title: "Reporting incidents",
        submodules: [],
      },
      {
        id: "5",
        title: "Communicating with SOC/IT",
        submodules: [],
      },
      {
        id: "6",
        title: "Case drills",
        submodules: [],
      },
    ],
    skills: [
      "Incident Response",
      "Evidence Collection",
      "NIST Framework",
      "SOC Communication",
    ],
  },
];

export const getCourseById = (id: string): Course | undefined => {
  return courses.find((course) => course.id === id);
};

export const getCoursesByLevel = (
  level: "beginner" | "intermediate" | "advanced"
): Course[] => {
  return courses.filter((course) => course.level === level);
};
