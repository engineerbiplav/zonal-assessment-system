const Club = require("../models/Club");
const ContactPerson = require("../models/ContactPerson");
const Response = require("../models/Response");

// GET /api/analytics/overview
const overview = async (req, res) => {
  const adminId = req.admin._id;

  const clubs = await Club.find({ admin: adminId });
  const contacts = await ContactPerson.find({ admin: adminId });
  const responses = await Response.find({ admin: adminId }).sort({ submittedAt: -1 });

  const requiredContacts = contacts.filter((c) => c.requiresResponse);
  const respondedContacts = requiredContacts.filter((c) => c.hasResponded);

  const perClub = clubs.map((club) => {
    const clubContacts = contacts.filter((c) => String(c.club) === String(club._id));
    const clubRequired = clubContacts.filter((c) => c.requiresResponse);
    const clubResponded = clubRequired.filter((c) => c.hasResponded);
    const clubResponses = responses.filter((r) => String(r.club) === String(club._id));

    return {
      clubId: club._id,
      clubName: club.name,
      clubNumber: club.clubNumber,
      logoUrl: club.logoUrl,
      totalContacts: clubContacts.length,
      requiredResponses: clubRequired.length,
      completedResponses: clubResponded.length,
      completionRate: clubRequired.length ? Math.round((clubResponded.length / clubRequired.length) * 100) : 0,
      positions: clubContacts.map((c) => ({
        position: c.position,
        name: c.name,
        requiresResponse: c.requiresResponse,
        hasResponded: c.hasResponded,
        respondedAt: c.respondedAt,
      })),
      lastSubmission: clubResponses[0] ? clubResponses[0].submittedAt : null,
    };
  });

  // Simple submission timeline: count of responses per calendar date
  const timelineMap = {};
  responses.forEach((r) => {
    const day = new Date(r.submittedAt).toISOString().slice(0, 10);
    timelineMap[day] = (timelineMap[day] || 0) + 1;
  });
  const timeline = Object.entries(timelineMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  res.json({
    totals: {
      totalClubs: clubs.length,
      totalContacts: contacts.length,
      requiredResponses: requiredContacts.length,
      completedResponses: respondedContacts.length,
      pendingResponses: requiredContacts.length - respondedContacts.length,
      overallCompletionRate: requiredContacts.length
        ? Math.round((respondedContacts.length / requiredContacts.length) * 100)
        : 0,
    },
    perClub,
    timeline,
    recentResponses: responses.slice(0, 10).map((r) => ({
      id: r._id,
      clubId: r.club,
      respondentName: r.respondentName,
      position: r.position,
      submittedAt: r.submittedAt,
    })),
  });
};

module.exports = { overview };
