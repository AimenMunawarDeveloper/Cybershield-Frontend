import { ApiClient } from "@/lib/api";
import { jsPDF } from "jspdf";

interface ReportData {
  organizationName?: string;
  reportDate: string;
  userSummary: {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    avgLearningScore: number;
    avgTrainingCompletion: number;
  };
  learningScores: {
    distribution: {
      "0-20": number;
      "21-40": number;
      "41-60": number;
      "61-80": number;
      "81-100": number;
    };
    breakdown: {
      email: number;
      whatsapp: number;
      lms: number;
      voice: number;
    };
  };
  voicePhishing: {
    totalConversations: number;
    completedConversations: number;
    averageScore: number;
    phishingScenarios: { total: number; fellForPhishing: number };
    normalScenarios: { total: number };
    resistanceLevels: { high: number; medium: number; low: number };
  };
  campaignPerformance: {
    email: {
      totalSent: number;
      totalDelivered: number;
      totalOpened: number;
      totalClicked: number;
      totalReported: number;
      deliveryRate: string;
      openRate: string;
      clickRate: string;
      reportRate: string;
    };
    whatsapp: {
      totalSent: number;
      totalDelivered: number;
      totalRead: number;
      totalClicked: number;
      totalReported: number;
      deliveryRate: string;
      readRate: string;
      clickRate: string;
      reportRate: string;
    };
  };
  campaigns: Array<{
    name: string;
    type: "email" | "whatsapp" | "unified";
    status: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export async function generateAnalyticsReport(
  getToken: () => Promise<string | null>,
  profile: { role: string; orgId?: string; orgName?: string }
): Promise<void> {
  try {
    const apiClient = new ApiClient(getToken);
    const reportData: Partial<ReportData> = {
      organizationName: profile.orgName || "Organization",
      reportDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };

    // Fetch users data
    let allUsers: any[] = [];
    if (profile.role === "system_admin") {
      const data = await apiClient.getAllUsers(1, 500);
      allUsers = (data.users || []).filter(
        (u: any) => u.role === "non_affiliated"
      );
    } else if (profile.role === "client_admin" && profile.orgId) {
      const data = await apiClient.getOrgUsers(profile.orgId, 1, 500);
      allUsers = data.users || [];
    }

    // Exclude admins from calculations
    const users = allUsers.filter(
      (u) => u.role !== "client_admin" && u.role !== "system_admin"
    );

    // Calculate user summary
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === "active").length;
    const suspendedUsers = users.filter((u) => u.status === "suspended").length;
    const sumScore = users.reduce((a, u) => {
      const score = typeof u.learningScore === "number" ? u.learningScore : 0;
      return a + score;
    }, 0);
    const avgLearningScore = users.length > 0 ? sumScore / users.length : 0;

    const usersWithLms = users.filter(
      (u) => typeof u.learningScores?.lms === "number"
    );
    const sumLms = usersWithLms.reduce(
      (a, u) => a + (u.learningScores?.lms ?? 0),
      0
    );
    const avgLms = usersWithLms.length > 0 ? sumLms / usersWithLms.length : 0;
    const avgTrainingCompletion = Math.round(avgLms * 100);

    reportData.userSummary = {
      totalUsers,
      activeUsers,
      suspendedUsers,
      avgLearningScore: Math.round(avgLearningScore * 10) / 10,
      avgTrainingCompletion,
    };

    // Calculate learning score distribution
    const distribution = {
      "0-20": 0,
      "21-40": 0,
      "41-60": 0,
      "61-80": 0,
      "81-100": 0,
    };

    users.forEach((user) => {
      const score = user.learningScore ?? 0;
      if (score <= 20) distribution["0-20"]++;
      else if (score <= 40) distribution["21-40"]++;
      else if (score <= 60) distribution["41-60"]++;
      else if (score <= 80) distribution["61-80"]++;
      else distribution["81-100"]++;
    });

    // Calculate learning score breakdown
    let emailSum = 0;
    let whatsappSum = 0;
    let lmsSum = 0;
    let voiceSum = 0;
    let emailCount = 0;
    let whatsappCount = 0;
    let lmsCount = 0;
    let voiceCount = 0;

    users.forEach((user) => {
      const scores = user.learningScores;
      if (scores) {
        if (typeof scores.email === "number") {
          emailSum += scores.email;
          emailCount++;
        }
        if (typeof scores.whatsapp === "number") {
          whatsappSum += scores.whatsapp;
          whatsappCount++;
        }
        if (typeof scores.lms === "number") {
          lmsSum += scores.lms;
          lmsCount++;
        }
        if (typeof scores.voice === "number") {
          voiceSum += scores.voice;
          voiceCount++;
        }
      }
    });

    reportData.learningScores = {
      distribution,
      breakdown: {
        email: emailCount > 0 ? Math.round((emailSum / emailCount) * 100) / 100 : 0,
        whatsapp: whatsappCount > 0 ? Math.round((whatsappSum / whatsappCount) * 100) / 100 : 0,
        lms: lmsCount > 0 ? Math.round((lmsSum / lmsCount) * 100) / 100 : 0,
        voice: voiceCount > 0 ? Math.round((voiceSum / voiceCount) * 100) / 100 : 0,
      },
    };

    // Fetch voice phishing analytics
    try {
      const voicePhishingData = await apiClient.getVoicePhishingAnalytics();
      if (voicePhishingData.success && voicePhishingData.data) {
        reportData.voicePhishing = voicePhishingData.data;
      }
    } catch (error) {
      console.error("Failed to fetch voice phishing analytics:", error);
      reportData.voicePhishing = {
        totalConversations: 0,
        completedConversations: 0,
        averageScore: 0,
        phishingScenarios: { total: 0, fellForPhishing: 0 },
        normalScenarios: { total: 0 },
        resistanceLevels: { high: 0, medium: 0, low: 0 },
      };
    }

    // Fetch campaign data
    let emailTotalSent = 0;
    let emailTotalDelivered = 0;
    let emailTotalOpened = 0;
    let emailTotalClicked = 0;
    let emailTotalReported = 0;

    let whatsappTotalSent = 0;
    let whatsappTotalDelivered = 0;
    let whatsappTotalRead = 0;
    let whatsappTotalClicked = 0;
    let whatsappTotalReported = 0;

    const campaigns: Array<{
      name: string;
      type: "email" | "whatsapp" | "unified";
      status: string;
      startDate?: string;
      endDate?: string;
    }> = [];

    try {
      const [emailRes, whatsappRes] = await Promise.all([
        apiClient.getCampaigns(1, 1000).catch(() => ({ success: false, data: { campaigns: [] } })),
        apiClient.getWhatsAppCampaigns(1, 1000).catch(() => ({ success: false, data: { campaigns: [] } })),
      ]);

      const emailCampaigns = emailRes.success && emailRes.data?.campaigns ? emailRes.data.campaigns : [];
      const whatsappCampaigns = whatsappRes.success && whatsappRes.data?.campaigns ? whatsappRes.data.campaigns : [];

      const standaloneWhatsapp = whatsappCampaigns.filter(
        (c: any) => !c.managedByParentCampaign
      );

      // Process email campaigns
      for (const campaign of emailCampaigns) {
        campaigns.push({
          name: campaign.name,
          type: campaign.whatsappEnabled ? "unified" : "email",
          status: campaign.status,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
        });

        try {
          const analytics = await apiClient.getCampaignAnalytics(campaign._id);
          if (analytics.success && analytics.data) {
            if (analytics.data.email) {
              const emailData = analytics.data.email;
              emailTotalSent += emailData.totalSent || 0;
              emailTotalDelivered += emailData.totalDelivered || 0;
              emailTotalOpened += emailData.totalOpened || 0;
              emailTotalClicked += emailData.totalClicked || 0;
              emailTotalReported += emailData.totalReported || 0;
            }
            if (analytics.data.whatsapp && analytics.data.whatsapp.enabled) {
              const whatsappData = analytics.data.whatsapp;
              whatsappTotalSent += whatsappData.totalSent || 0;
              whatsappTotalDelivered += whatsappData.totalDelivered || 0;
              whatsappTotalRead += whatsappData.totalRead || 0;
              whatsappTotalClicked += whatsappData.totalClicked || 0;
              whatsappTotalReported += whatsappData.totalReported || 0;
            }
          }
        } catch (error) {
          console.error(`Failed to fetch analytics for campaign ${campaign._id}:`, error);
        }
      }

      // Process standalone WhatsApp campaigns
      for (const campaign of standaloneWhatsapp) {
        campaigns.push({
          name: campaign.name,
          type: "whatsapp",
          status: campaign.status,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
        });

        try {
          const analytics = await apiClient.getWhatsAppCampaignAnalytics(campaign._id);
          if (analytics.success && analytics.data) {
            whatsappTotalSent += analytics.data.totalSent || 0;
            whatsappTotalDelivered += analytics.data.totalDelivered || 0;
            whatsappTotalRead += analytics.data.totalRead || 0;
            whatsappTotalClicked += analytics.data.totalClicked || 0;
            whatsappTotalReported += analytics.data.totalReported || 0;
          }
        } catch (error) {
          console.error(`Failed to fetch analytics for campaign ${campaign._id}:`, error);
        }
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    }

    reportData.campaignPerformance = {
      email: {
        totalSent: emailTotalSent,
        totalDelivered: emailTotalDelivered,
        totalOpened: emailTotalOpened,
        totalClicked: emailTotalClicked,
        totalReported: emailTotalReported,
        deliveryRate: emailTotalSent > 0 ? ((emailTotalDelivered / emailTotalSent) * 100).toFixed(1) : "0",
        openRate: emailTotalSent > 0 ? ((emailTotalOpened / emailTotalSent) * 100).toFixed(1) : "0",
        clickRate: emailTotalSent > 0 ? ((emailTotalClicked / emailTotalSent) * 100).toFixed(1) : "0",
        reportRate: emailTotalSent > 0 ? ((emailTotalReported / emailTotalSent) * 100).toFixed(1) : "0",
      },
      whatsapp: {
        totalSent: whatsappTotalSent,
        totalDelivered: whatsappTotalDelivered,
        totalRead: whatsappTotalRead,
        totalClicked: whatsappTotalClicked,
        totalReported: whatsappTotalReported,
        deliveryRate: whatsappTotalSent > 0 ? ((whatsappTotalDelivered / whatsappTotalSent) * 100).toFixed(1) : "0",
        readRate: whatsappTotalSent > 0 ? ((whatsappTotalRead / whatsappTotalSent) * 100).toFixed(1) : "0",
        clickRate: whatsappTotalSent > 0 ? ((whatsappTotalClicked / whatsappTotalSent) * 100).toFixed(1) : "0",
        reportRate: whatsappTotalSent > 0 ? ((whatsappTotalReported / whatsappTotalSent) * 100).toFixed(1) : "0",
      },
    };

    reportData.campaigns = campaigns;

    // Generate PDF and save to backend
    await generatePDF(reportData as ReportData, apiClient);
  } catch (error) {
    console.error("Failed to generate report:", error);
    throw error;
  }
}

async function generatePDF(data: ReportData, apiClient: ApiClient) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Color scheme
  const colors = {
    primary: [51, 102, 153],      // Navy blue
    neonBlue: [81, 176, 236],     // Neon blue
    electricBlue: [0, 180, 216],  // Electric blue
    success: [34, 197, 94],       // Green
    warning: [251, 191, 36],      // Yellow
    danger: [239, 68, 68],        // Red
    lightGray: [243, 244, 246],
    darkGray: [107, 114, 128],
    borderGray: [229, 231, 235],
    white: [255, 255, 255],
  };

  // Helper function to add a new page if needed
  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper function to draw a rounded rectangle
  const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number, fillColor?: number[], strokeColor?: number[]) => {
    if (fillColor) {
      doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
      doc.roundedRect(x, y, w, h, r, r, "F");
    }
    if (strokeColor) {
      doc.setDrawColor(strokeColor[0], strokeColor[1], strokeColor[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, w, h, r, r, "S");
    }
  };

  // Helper function to draw a metric card
  const drawMetricCard = (x: number, y: number, width: number, height: number, label: string, value: string, color: number[]) => {
    // Background
    drawRoundedRect(x, y, width, height, 3, colors.lightGray, colors.borderGray);
    
    // Colored accent bar
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x, y, 4, height, 0, 0, "F");
    
    // Label
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.darkGray[0], colors.darkGray[1], colors.darkGray[2]);
    doc.text(label, x + 10, y + 8);
    
    // Value
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(value, x + 10, y + 20);
    doc.setFont("helvetica", "normal");
  };

  // Header with colored background
  const headerHeight = 50;
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, headerHeight, "F");
  
  // Title
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.text("Analytics Report", margin, 25);
  
  // Organization and date
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(data.organizationName || "Organization", margin, 35);
  doc.text(`Generated: ${data.reportDate}`, pageWidth - margin, 35, { align: "right" });
  
  yPos = headerHeight + 20;

  // User Summary Section
  checkNewPage(60);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text("User Summary", margin, yPos);
  yPos += 12;

  // Metric cards in a grid
  const cardWidth = (pageWidth - 2 * margin - 20) / 3;
  const cardHeight = 28;
  const cardSpacing = 10;

  drawMetricCard(margin, yPos, cardWidth, cardHeight, "Total Users", data.userSummary.totalUsers.toString(), colors.neonBlue);
  drawMetricCard(margin + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, "Active Users", data.userSummary.activeUsers.toString(), colors.success);
  drawMetricCard(margin + 2 * (cardWidth + cardSpacing), yPos, cardWidth, cardHeight, "Suspended", data.userSummary.suspendedUsers.toString(), colors.danger);
  
  yPos += cardHeight + 10;
  
  drawMetricCard(margin, yPos, cardWidth, cardHeight, "Avg Learning Score", `${data.userSummary.avgLearningScore.toFixed(1)}/100`, colors.electricBlue);
  drawMetricCard(margin + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, "Training Completion", `${data.userSummary.avgTrainingCompletion}%`, colors.warning);
  
  yPos += cardHeight + 20;

  // Learning Score Distribution
  checkNewPage(70);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text("Learning Score Distribution", margin, yPos);
  yPos += 12;

  // Distribution boxes
  const distBoxWidth = (pageWidth - 2 * margin - 16) / 5;
  const distBoxHeight = 35;
  const distSpacing = 4;

  const distributionData = [
    { label: "0-20", value: data.learningScores.distribution["0-20"], color: colors.danger },
    { label: "21-40", value: data.learningScores.distribution["21-40"], color: colors.warning },
    { label: "41-60", value: data.learningScores.distribution["41-60"], color: colors.warning },
    { label: "61-80", value: data.learningScores.distribution["61-80"], color: colors.success },
    { label: "81-100", value: data.learningScores.distribution["81-100"], color: colors.success },
  ];

  distributionData.forEach((item, index) => {
    const x = margin + index * (distBoxWidth + distSpacing);
    drawRoundedRect(x, yPos, distBoxWidth, distBoxHeight, 3, colors.lightGray, colors.borderGray);
    
    // Colored top bar
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.roundedRect(x, yPos, distBoxWidth, 5, 0, 0, "F");
    
    // Value
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(item.value.toString(), x + distBoxWidth / 2, yPos + 18, { align: "center" });
    
    // Label
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.darkGray[0], colors.darkGray[1], colors.darkGray[2]);
    doc.text(item.label, x + distBoxWidth / 2, yPos + 28, { align: "center" });
  });

  yPos += distBoxHeight + 15;

  // Learning Score Breakdown
  checkNewPage(60);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text("Learning Score Breakdown by Category", margin, yPos);
  yPos += 12;

  // Breakdown boxes
  const breakdownBoxWidth = (pageWidth - 2 * margin - 12) / 4;
  const breakdownBoxHeight = 35;
  const breakdownSpacing = 4;

  const breakdownData = [
    { label: "Email", value: data.learningScores.breakdown.email, color: colors.neonBlue },
    { label: "WhatsApp", value: data.learningScores.breakdown.whatsapp, color: colors.electricBlue },
    { label: "LMS", value: data.learningScores.breakdown.lms, color: colors.success },
    { label: "Voice", value: data.learningScores.breakdown.voice, color: colors.warning },
  ];

  breakdownData.forEach((item, index) => {
    const x = margin + index * (breakdownBoxWidth + breakdownSpacing);
    drawRoundedRect(x, yPos, breakdownBoxWidth, breakdownBoxHeight, 3, colors.lightGray, colors.borderGray);
    
    // Colored top bar
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.roundedRect(x, yPos, breakdownBoxWidth, 5, 0, 0, "F");
    
    // Value
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`${(item.value * 100).toFixed(1)}%`, x + breakdownBoxWidth / 2, yPos + 18, { align: "center" });
    
    // Label
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.darkGray[0], colors.darkGray[1], colors.darkGray[2]);
    doc.text(item.label, x + breakdownBoxWidth / 2, yPos + 28, { align: "center" });
  });

  yPos += breakdownBoxHeight + 15;

  // Voice Phishing Section
  checkNewPage(80);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text("Voice Phishing Analytics", margin, yPos);
  yPos += 12;

  // Voice phishing metric cards
  const voiceCardWidth = (pageWidth - 2 * margin - 20) / 3;
  const voiceCardHeight = 28;
  const voiceCardSpacing = 10;

  drawMetricCard(margin, yPos, voiceCardWidth, voiceCardHeight, "Total Conversations", data.voicePhishing.totalConversations.toString(), colors.neonBlue);
  drawMetricCard(margin + voiceCardWidth + voiceCardSpacing, yPos, voiceCardWidth, voiceCardHeight, "Completed", data.voicePhishing.completedConversations.toString(), colors.success);
  drawMetricCard(margin + 2 * (voiceCardWidth + voiceCardSpacing), yPos, voiceCardWidth, voiceCardHeight, "Avg Score", `${data.voicePhishing.averageScore.toFixed(1)}/100`, colors.electricBlue);
  
  yPos += voiceCardHeight + 10;

  // Additional metrics in a box
  drawRoundedRect(margin, yPos, pageWidth - 2 * margin, 50, 3, colors.lightGray, colors.borderGray);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  doc.text(`Phishing Scenarios: ${data.voicePhishing.phishingScenarios.total}`, margin + 5, yPos + 8);
  doc.text(`Fell for Phishing: ${data.voicePhishing.phishingScenarios.fellForPhishing}`, margin + 5, yPos + 16);
  doc.text(`Normal Scenarios: ${data.voicePhishing.normalScenarios.total}`, margin + 5, yPos + 24);
  
  doc.text(`High Resistance: ${data.voicePhishing.resistanceLevels.high}`, margin + 100, yPos + 8);
  doc.text(`Medium Resistance: ${data.voicePhishing.resistanceLevels.medium}`, margin + 100, yPos + 16);
  doc.text(`Low Resistance: ${data.voicePhishing.resistanceLevels.low}`, margin + 100, yPos + 24);
  
  yPos += 60;

  // Campaign Performance - Email
  checkNewPage(70);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text("Email Campaign Performance", margin, yPos);
  yPos += 12;

  // Email metrics box
  drawRoundedRect(margin, yPos, pageWidth - 2 * margin, 50, 3, colors.lightGray, colors.borderGray);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  doc.text(`Total Sent: ${data.campaignPerformance.email.totalSent}`, margin + 5, yPos + 8);
  doc.text(`Delivered: ${data.campaignPerformance.email.totalDelivered} (${data.campaignPerformance.email.deliveryRate}%)`, margin + 5, yPos + 16);
  doc.text(`Opened: ${data.campaignPerformance.email.totalOpened} (${data.campaignPerformance.email.openRate}%)`, margin + 5, yPos + 24);
  doc.text(`Clicked: ${data.campaignPerformance.email.totalClicked} (${data.campaignPerformance.email.clickRate}%)`, margin + 5, yPos + 32);
  doc.text(`Credentials Entered: ${data.campaignPerformance.email.totalReported} (${data.campaignPerformance.email.reportRate}%)`, margin + 5, yPos + 40);
  
  yPos += 60;

  // Campaign Performance - WhatsApp
  checkNewPage(70);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text("WhatsApp Campaign Performance", margin, yPos);
  yPos += 12;

  // WhatsApp metrics box
  drawRoundedRect(margin, yPos, pageWidth - 2 * margin, 50, 3, colors.lightGray, colors.borderGray);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  doc.text(`Total Sent: ${data.campaignPerformance.whatsapp.totalSent}`, margin + 5, yPos + 8);
  doc.text(`Delivered: ${data.campaignPerformance.whatsapp.totalDelivered} (${data.campaignPerformance.whatsapp.deliveryRate}%)`, margin + 5, yPos + 16);
  doc.text(`Read: ${data.campaignPerformance.whatsapp.totalRead} (${data.campaignPerformance.whatsapp.readRate}%)`, margin + 5, yPos + 24);
  doc.text(`Clicked: ${data.campaignPerformance.whatsapp.totalClicked} (${data.campaignPerformance.whatsapp.clickRate}%)`, margin + 5, yPos + 32);
  doc.text(`Credentials Entered: ${data.campaignPerformance.whatsapp.totalReported} (${data.campaignPerformance.whatsapp.reportRate}%)`, margin + 5, yPos + 40);
  
  yPos += 60;

  // Campaigns List
  if (data.campaigns.length > 0) {
    checkNewPage(50);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text("Campaigns Overview", margin, yPos);
    yPos += 12;

    // Table header with background
    const headerHeight = 14;
    doc.setFillColor(colors.neonBlue[0], colors.neonBlue[1], colors.neonBlue[2]);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, headerHeight, 2, 2, "F");
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    // Center text vertically in the header (yPos + headerHeight/2 + 1.5 for better vertical centering)
    const headerTextY = yPos + headerHeight / 2 + 1.5;
    doc.text("Campaign Name", margin + 5, headerTextY);
    doc.text("Type", margin + 100, headerTextY);
    doc.text("Status", margin + 140, headerTextY);
    yPos += headerHeight + 4; // Add padding after header

    // Campaign rows
    data.campaigns.slice(0, 20).forEach((campaign, index) => {
      checkNewPage(10);
      
      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
        doc.roundedRect(margin, yPos - 7, pageWidth - 2 * margin, 9, 1, 1, "F");
      }
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const name = campaign.name.length > 30 ? campaign.name.substring(0, 27) + "..." : campaign.name;
      doc.text(name, margin + 5, yPos);
      doc.text(campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1), margin + 100, yPos);
      doc.text(campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1), margin + 140, yPos);
      yPos += 9;
    });

    if (data.campaigns.length > 20) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(colors.darkGray[0], colors.darkGray[1], colors.darkGray[2]);
      doc.text(`... and ${data.campaigns.length - 20} more campaigns`, margin, yPos);
    }
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(colors.borderGray[0], colors.borderGray[1], colors.borderGray[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Footer text
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.darkGray[0], colors.darkGray[1], colors.darkGray[2]);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    doc.text(
      "Cybershield Analytics Report",
      margin,
      pageHeight - 10
    );
  }

  // Generate PDF blob
  const fileName = `Analytics_Report_${data.organizationName?.replace(/\s+/g, "_") || "Report"}_${new Date().toISOString().split("T")[0]}.pdf`;
  const pdfBlob = doc.output("blob");

  // Save report to backend
  try {
    await apiClient.saveReport({
      reportName: `Analytics Report - ${data.organizationName || "Organization"}`,
      organizationName: data.organizationName,
      reportDate: data.reportDate,
      fileName: fileName,
      pdfBlob: pdfBlob,
      reportData: {
        userSummary: data.userSummary,
        learningScores: data.learningScores,
        voicePhishing: data.voicePhishing,
        campaignPerformance: data.campaignPerformance,
        campaignsCount: data.campaigns.length,
      },
    });
  } catch (saveError) {
    console.error("Failed to save report:", saveError);
    // Don't throw - report was generated successfully, saving is optional
  }

  // Download the PDF
  doc.save(fileName);
}
