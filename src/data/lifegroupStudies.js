/**
 * Lifegroup discussion guides — open questions for shared study nights.
 * Not scored quizzes; meant to be read aloud and talked through together.
 */

export const LIFEGROUP_STUDIES = [
  {
    id: 'epic-of-eden-ch5',
    series: 'Epic of Eden',
    chapter: 5,
    title: 'God’s Final Intent: The New Jerusalem',
    author: 'Sandra L. Richter',
    blurb:
      'Richter bookends Scripture: Eden’s lost fellowship finds its answer in the New Jerusalem. God’s original intent is his final intent.',
    scriptureFocus: [
      { ref: 'Genesis 2–3', note: 'Eden lost' },
      { ref: 'Ezekiel 47:1–12', note: 'River from the temple' },
      { ref: 'Revelation 21–22', note: 'New heaven and new earth' },
      { ref: 'Romans 5:12–21', note: 'Adam and Christ' },
    ],
    bigIdea:
      'Redemptive history is about getting Adam back into the garden—God’s people dwelling in God’s place with full access to his presence.',
    icebreaker:
      'When you picture “heaven,” what image comes first—clouds and harps, reunion with loved ones, or something more like a restored garden city? Where did that picture come from?',
    questions: [
      {
        id: 'q1',
        prompt:
          'Richter says God’s original intent is his final intent. In your own words, what was God after in Eden—and how does Revelation 21–22 show him finishing that same project?',
        followUp:
          'Where have you tended to treat the gospel as an escape from earth instead of the restoration of God’s presence with his people?',
      },
      {
        id: 'q2',
        prompt:
          'She frames the Bible’s plot as one cosmic question: “How do we get Adam back into the garden?” How does that reorganize the way you read the Old Testament covenants?',
        followUp:
          'Which covenant stage (Noah, Abraham, Moses, David, New) has felt most “alive” in your walk with God lately—and why?',
      },
      {
        id: 'q3',
        prompt:
          'Cherubim, trees, and rivers show up from Eden to the Tabernacle/Temple to the New Jerusalem. Pick one of those images. How does tracing it across Scripture help you trust that God is telling one story?',
        followUp: 'Read Ezekiel 47:1–12 or Revelation 22:1–5 together. What detail surprises you?',
      },
      {
        id: 'q4',
        prompt:
          'Richter’s climber metaphor: Adam has fallen onto a ledge—too far from top or bottom for a single simple rescue. How does that reshape your patience with “slow” seasons of God’s work in you or in someone you love?',
        followUp:
          'Where are you tempted to demand a one-step fix from God when he seems to be working through a series of rescues?',
      },
      {
        id: 'q5',
        prompt:
          '“What went wrong in Eden is what must go right in redemption; what was done in the garden must be undone in Christ.” Name one specific fracture from Genesis 3 (shame, blame, exile, fear, broken work, broken relationship) that you still feel. How does Jesus address that fracture?',
        followUp: 'Who in the group needs prayer for that fracture this week?',
      },
      {
        id: 'q6',
        prompt:
          'Richter notes that we still live in the “not yet.” How should hope in the New Jerusalem change how we treat creation, our neighborhood, and the church this month—not someday?',
        followUp:
          'What is one concrete practice (hospitality, peacemaking, care for the vulnerable, Sabbath rest) that would make your life look more like people who expect God’s dwelling to come?',
      },
      {
        id: 'q7',
        prompt:
          'Romans 5 and 1 Corinthians 15 put Christ as the last Adam. How does his obedience and resurrection secure the “yes” that Adam failed to give?',
        followUp:
          'Where do you need to receive Christ’s finished work again instead of trying to climb back into the garden on your own effort?',
      },
    ],
    closingPrayer:
      'Father, you walked with us in the garden and you will dwell with us in the city. Thank you that your first intent is still your final intent. By the Spirit, teach us to live as people of the New Jerusalem—honest about the fall, hopeful in Christ, and faithful in the not yet. Amen.',
  },
];

export function getStudyById(id) {
  return LIFEGROUP_STUDIES.find((s) => s.id === id) || null;
}
