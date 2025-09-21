const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDashboardCalculations() {
  try {
    const now = new Date();

    // Calculate start of week (Sunday at 00:00:00 UTC)
    const startOfWeek = new Date(now);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - dayOfWeek);
    startOfWeek.setUTCHours(0, 0, 0, 0);

    // Calculate start of month (1st day at 00:00:00 UTC)
    const startOfMonth = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    // Calculate previous periods for percentage comparison
    const prevWeekStart = new Date(startOfWeek);
    prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7);
    const prevWeekEnd = new Date(startOfWeek);

    const prevMonthStart = new Date(now.getUTCFullYear(), now.getUTCMonth() - 1, 1);
    prevMonthStart.setUTCHours(0, 0, 0, 0);
    const prevMonthEnd = new Date(startOfMonth);

    console.log('Date ranges:');
    console.log('This week:', startOfWeek.toISOString(), 'to', now.toISOString());
    console.log('Previous week:', prevWeekStart.toISOString(), 'to', prevWeekEnd.toISOString());
    console.log('This month:', startOfMonth.toISOString(), 'to', now.toISOString());
    console.log('Previous month:', prevMonthStart.toISOString(), 'to', prevMonthEnd.toISOString());

    const whereClause = { isDraft: false };

    // Current period counts
    const totalSubmissions = await prisma.salesSubmission.count({ where: whereClause });
    const thisWeekSubmissions = await prisma.salesSubmission.count({
      where: { ...whereClause, createdAt: { gte: startOfWeek } },
    });
    const thisMonthSubmissions = await prisma.salesSubmission.count({
      where: { ...whereClause, createdAt: { gte: startOfMonth } },
    });
    const draftSubmissions = await prisma.salesSubmission.count({
      where: { ...whereClause, isDraft: true },
    });

    // Previous period counts
    const totalSubmissionsLastWeek = await prisma.salesSubmission.count({
      where: { ...whereClause, createdAt: { lt: startOfWeek } },
    });
    const prevWeekSubmissions = await prisma.salesSubmission.count({
      where: { ...whereClause, createdAt: { gte: prevWeekStart, lt: prevWeekEnd } },
    });
    const prevMonthSubmissions = await prisma.salesSubmission.count({
      where: { ...whereClause, createdAt: { gte: prevMonthStart, lt: prevMonthEnd } },
    });
    const prevDraftSubmissions = await prisma.salesSubmission.count({
      where: { ...whereClause, isDraft: true, createdAt: { lt: startOfWeek } },
    });

    // Helper function to calculate percentage change
    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return Math.round(((current - previous) / previous) * 100);
    };

    // Calculate percentage changes
    const totalSubmissionsChange = calculatePercentageChange(totalSubmissions, totalSubmissionsLastWeek);
    const thisWeekChange = calculatePercentageChange(thisWeekSubmissions, prevWeekSubmissions);
    const thisMonthChange = calculatePercentageChange(thisMonthSubmissions, prevMonthSubmissions);
    const draftsChange = calculatePercentageChange(draftSubmissions, prevDraftSubmissions);

    console.log('\nCurrent counts:');
    console.log('Total submissions:', totalSubmissions);
    console.log('This week submissions:', thisWeekSubmissions);
    console.log('This month submissions:', thisMonthSubmissions);
    console.log('Draft submissions:', draftSubmissions);

    console.log('\nPrevious counts:');
    console.log('Total submissions last week:', totalSubmissionsLastWeek);
    console.log('Previous week submissions:', prevWeekSubmissions);
    console.log('Previous month submissions:', prevMonthSubmissions);
    console.log('Previous draft submissions:', prevDraftSubmissions);

    console.log('\nPercentage changes:');
    console.log('Total submissions change:', totalSubmissionsChange + '%');
    console.log('This week change:', thisWeekChange + '%');
    console.log('This month change:', thisMonthChange + '%');
    console.log('Drafts change:', draftsChange + '%');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardCalculations();