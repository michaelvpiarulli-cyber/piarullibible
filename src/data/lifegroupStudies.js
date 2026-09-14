/**
 * Lifegroup discussion guides — open questions for shared study nights.
 * Not scored quizzes; meant to be read aloud and talked through together.
 *
 * Full *Epic of Eden* series (Sandra L. Richter). Mark one study with
 * `current: true` for “this week”; the portal opens there by default.
 */

export const LIFEGROUP_STUDIES = [
  {
    id: 'epic-of-eden-ch1',
    series: 'Epic of Eden',
    chapter: 1,
    title: 'The Bible as the Story of Redemption',
    author: 'Sandra L. Richter',
    blurb:
      'The Old Testament is not a cluttered closet of random facts—it is our family story. Redemption means being brought home into the Father’s household.',
    scriptureFocus: [
      { ref: 'Genesis 12:1–3', note: 'Blessing for the nations' },
      { ref: 'Exodus 6:6–8', note: 'I will redeem you' },
      { ref: 'Ruth 4:13–17', note: 'A kinsman redeems' },
      { ref: 'Ephesians 2:11–22', note: 'Household of God' },
      { ref: 'John 14:1–3', note: 'That where I am, you may be also' },
    ],
    bigIdea:
      'Yahweh presents himself as the patriarch who will pay any ransom to restore his lost family to the household—sending his firstborn Son so that where he is, we may be also.',
    icebreaker:
      'When you first started reading the Old Testament, did it feel like “your story,” someone else’s history, or a messy closet you could not organize? What shaped that feeling?',
    questions: [
      {
        id: 'q1',
        prompt:
          'Richter names “dysfunctional closet syndrome”—knowing lots of Bible pieces but having no organizing story. Where does your Old Testament knowledge still feel like a cluttered closet?',
        followUp:
          'What one “shelf” (a person, place, or theme) would help you most if it finally made sense?',
      },
      {
        id: 'q2',
        prompt:
          'She argues that many Christians were never taught that the Old Testament is their story. How would reading Scripture as family history change the way you approach a hard or strange passage?',
        followUp:
          'Which Old Testament character or scene have you treated as “not for you,” and why?',
      },
      {
        id: 'q3',
        prompt:
          'In Israel’s tribal world, the family (the bet ʾāb) was the axis of security, law, and identity. How does seeing redemption as “being brought back into the Father’s household” reshape what salvation means to you?',
        followUp:
          'Where are you still picturing salvation mainly as a private ticket rather than a restored family place?',
      },
      {
        id: 'q4',
        prompt:
          'A kinsman-redeemer restored a lost family member to safety within the kinship circle. How does that backdrop help you hear Yahweh’s claim: “I will redeem you”?',
        followUp: 'Read Ruth 4 or Exodus 6:6–8 together. What detail of redeeming love stands out?',
      },
      {
        id: 'q5',
        prompt:
          'Richter says God often stands against the cultural norms of his people—and that redemption critiques every human culture, including ours. Where might our culture’s version of “family,” “success,” or “security” need that critique?',
        followUp:
          'What cultural assumption in your own life is hardest to let Scripture challenge?',
      },
      {
        id: 'q6',
        prompt:
          'The goal of redemption is not a marble mansion but reincorporation into the Father’s house. How should that redirect the hopes you carry for “the good life”?',
        followUp:
          'What would it look like this week to treat someone in this group more like household—brother or sister—than like a classmate?',
      },
      {
        id: 'q7',
        prompt:
          'Yahweh sends the most cherished member of his household—his firstborn Son—to bring the lost home. How does that deepen your gratitude for Jesus, and how should it change the way this group talks about the gospel?',
        followUp:
          'Who needs to hear that they are not orphaned outsiders but invited family—and how might you say it?',
      },
    ],
    closingPrayer:
      'Father, you are the patriarch who will not abandon your lost children. Thank you for sending your Son to bring us home. Reorganize our cluttered hearts around your story, teach us to read the Old Testament as our own, and make us a true household of faith. Amen.',
  },
  {
    id: 'epic-of-eden-ch2',
    series: 'Epic of Eden',
    chapter: 2,
    title: 'The Bible in Real Time and Space',
    author: 'Sandra L. Richter',
    blurb:
      'Redemption happened among real people in real places. Geography, culture, and history are not optional extras—they are how God wrote the story.',
    scriptureFocus: [
      { ref: 'Genesis 11:31–12:9', note: 'From Ur to Canaan' },
      { ref: 'Genesis 13:10–12', note: 'Jordan plain and choices' },
      { ref: 'Exodus 3:1–12', note: 'Sinai, outside empire' },
      { ref: 'Deuteronomy 8:7–10', note: 'A good land' },
      { ref: 'Luke 10:25–37', note: 'Jerusalem to Jericho' },
    ],
    bigIdea:
      'If we want to hear the biblical writers as they intended, we must take their world seriously—real time, real space, real faith—rather than flattening Scripture into a timeless slogan.',
    icebreaker:
      'Have you ever visited a place and suddenly understood a story differently because you were standing there? What changed?',
    questions: [
      {
        id: 'q1',
        prompt:
          'Richter insists the story of redemption comes through real time and space. Why does it matter that Abraham, Moses, and Jesus lived in particular lands—and not in a vague “Bible world”?',
        followUp:
          'Where have you read Scripture as if setting and culture were disposable packaging?',
      },
      {
        id: 'q2',
        prompt:
          'Ancient genealogies often stated identity more than exhaustive chronology. How does that caution change the questions you bring to biblical family lists?',
        followUp:
          'What is the difference between asking “What is this text doing?” and “How do I make it fit my modern expectations?”',
      },
      {
        id: 'q3',
        prompt:
          'Sinai sits in no-man’s-land, far from urban power centers. What does that geography say about how God forms a people?',
        followUp:
          'Where might God still be meeting you “outside” the places of status and control?',
      },
      {
        id: 'q4',
        prompt:
          'Richter notes that Jerusalem to Jericho is a short trip with a dramatic elevation drop—and that “Mount” Zion is not an impressive mountain. How does ordinary geography make biblical drama more concrete for you?',
        followUp: 'Read Luke 10:25–37. How does the road itself become part of Jesus’ point?',
      },
      {
        id: 'q5',
        prompt:
          'Studying the Old Testament is a cross-cultural task. What habits help you listen to the text in its world before forcing it into yours?',
        followUp:
          'What tool, map, study Bible note, or practice has most helped you “see their words as they did”?',
      },
      {
        id: 'q6',
        prompt:
          'Real places shaped real choices—Lot toward the Jordan plain, Israel toward Canaan’s hills and valleys. Where is your current “place” (home, job, city) shaping your discipleship for better or worse?',
        followUp:
          'What is one concrete way geography or daily environment could become an ally of faithfulness this month?',
      },
      {
        id: 'q7',
        prompt:
          'If God wrote redemption into history rather than myth, how should that affect your confidence when Scripture feels distant or strange?',
        followUp:
          'Who in your life needs a faith that is rooted in something that actually happened—and how can this group help?',
      },
    ],
    closingPrayer:
      'Lord of heaven and earth, you wrote your story in real dust and real years. Give us curiosity for the world of Scripture, humility to listen across cultures, and courage to live faithfully in the places you have planted us. Amen.',
  },
  {
    id: 'epic-of-eden-ch3',
    series: 'Epic of Eden',
    chapter: 3,
    title: 'The Concept of Covenant',
    author: 'Sandra L. Richter',
    blurb:
      'Covenant is the “general law” that organizes the biblical closet—God co-opting an ancient treaty form to make family out of non-family.',
    scriptureFocus: [
      { ref: 'Genesis 15:7–21', note: 'Covenant ceremony' },
      { ref: 'Exodus 19:3–8', note: 'Sinai: if you obey…' },
      { ref: 'Exodus 20:1–17', note: 'Words of the covenant' },
      { ref: 'Deuteronomy 30:15–20', note: 'Life and death set before you' },
      { ref: 'Hebrews 9:11–22', note: 'Blood of the covenant' },
    ],
    bigIdea:
      'By covenant, Yahweh makes kin out of non-kin. He did not invent the treaty form—he co-opted it—and in the new covenant he is both suzerain and sacrifice.',
    icebreaker:
      'Where in everyday life do you still use covenant-like language—vows, contracts, memberships, “I got you”? What makes those bonds feel weighty?',
    questions: [
      {
        id: 'q1',
        prompt:
          'Richter says facts are “stupid things” until connected to a general law—and covenant is that organizing law for Scripture. How does covenant help you hang the Bible’s pieces on one storyline?',
        followUp:
          'Which part of the Bible has felt most disconnected for you, and how might covenant reattach it?',
      },
      {
        id: 'q2',
        prompt:
          'In the ancient world, covenant created fictive kinship—making family out of non-family by oath. How does that help you understand God’s relationship with Abraham’s line and with the church?',
        followUp:
          'Where do you still live like a contractor with God instead of like family under oath?',
      },
      {
        id: 'q3',
        prompt:
          'Suzerain/vassal treaties bound a greater king and a lesser partner with love language: to keep the treaty was to “love”; to break it was to “hate.” How does that background reframe biblical talk of loving God?',
        followUp:
          'What does “love” look like this week if it includes loyalty, obedience, and trust—not only warm feelings?',
      },
      {
        id: 'q4',
        prompt:
          'Treaty form included preamble, history, stipulations, blessings and curses, witnesses, and deposit in sacred space. Where do you see that shape at Sinai—and why does the historical prologue matter before the commands?',
        followUp: 'Read Exodus 19–20. What comes before “you shall,” and why does that order preach the gospel?',
      },
      {
        id: 'q5',
        prompt:
          'Yahweh did not create covenant; he co-opted it to speak redemption in a language Israel could understand. What does that suggest about how God meets people inside their cultures today?',
        followUp:
          'Where might we need similar “translation” without diluting the message?',
      },
      {
        id: 'q6',
        prompt:
          'Richter highlights that in the new covenant the Lord of the cosmos is both suzerain and sacrifice. How does that double role uniquely comfort and confront you?',
        followUp:
          'Where are you tempted to keep God as King but refuse him as the One who bleeds for the treaty?',
      },
      {
        id: 'q7',
        prompt:
          'If covenant is the skeleton of Scripture, how should this group read, pray, and obey differently because we are bound to God and to one another?',
        followUp:
          'What is one covenant practice (shared confession, mutual aid, kept promises) you want to strengthen together?',
      },
    ],
    closingPrayer:
      'Covenant-keeping God, thank you for making family out of strangers and for binding yourself to us at such great cost. Teach us to love you with loyal hearts, to trust the One who is both King and sacrifice, and to live as people under a better word. Amen.',
  },
  {
    id: 'epic-of-eden-ch4',
    series: 'Epic of Eden',
    chapter: 4,
    title: 'God’s Original Intent',
    author: 'Sandra L. Richter',
    blurb:
      'Eden is the blueprint: God’s people in God’s place with access to God’s presence. The Fall is not just loss—it is the reversal of blessing.',
    scriptureFocus: [
      { ref: 'Genesis 1:26–31', note: 'Image and blessing' },
      { ref: 'Genesis 2:8–17', note: 'Garden, work, and boundary' },
      { ref: 'Genesis 3:1–24', note: 'Fracture and exile' },
      { ref: 'Psalm 8', note: 'What is man…?' },
      { ref: 'Romans 8:18–23', note: 'Creation waits' },
    ],
    bigIdea:
      'Genesis 1–2 shows God’s original intent—people, place, presence—while Genesis 3 shows blessings reversed. Salvation asks what the first Adam lost and what the Second Adam buys back.',
    icebreaker:
      'If you had to describe “the way life was supposed to be” in one image or sentence, what would you say? How close is that to Eden’s picture?',
    questions: [
      {
        id: 'q1',
        prompt:
          'Richter reads Genesis 1 as a lens for the whole Bible: Who is God, and what is his relationship to us? How does starting there change the questions you bring to the opening chapters?',
        followUp:
          'Where have you asked Genesis to answer modern debates it was not primarily written to settle?',
      },
      {
        id: 'q2',
        prompt:
          'God’s perfect plan was the people of God in the place of God with access to the presence of God. Which of those three—people, place, presence—do you most long for right now?',
        followUp:
          'Which one do you most often try to secure without God?',
      },
      {
        id: 'q3',
        prompt:
          'We are tselem—image—the nearest representation of Yahweh that exists. How should that dignity change how you see yourself and your neighbor?',
        followUp:
          'Where is the image of God being ignored, exploited, or dismissed in your daily world?',
      },
      {
        id: 'q4',
        prompt:
          'The Fall is not merely subtraction of blessings but reversal—gift becomes burden, paradise becomes exile. Name one reversed blessing you still feel in your body, work, or relationships.',
        followUp:
          'How does naming it as “reversal” (not just “bad luck”) help you hope for undoing in Christ?',
      },
      {
        id: 'q5',
        prompt:
          'Humanity’s vocation included work and boundary—“serve and keep,” with a tree withheld. How does Eden challenge both laziness and limitless autonomy?',
        followUp:
          'Where do you need holy limits, and where do you need renewed purpose in your work?',
      },
      {
        id: 'q6',
        prompt:
          'Richter says we wait not only for personal deliverance but for creation to be “born again.” How should that widen your hope beyond “my soul going to heaven”?',
        followUp: 'Read Romans 8:18–23. What part of creation’s groan do you hear most clearly?',
      },
      {
        id: 'q7',
        prompt:
          '“What did the first Adam lose? What did the Second Adam buy back?” How would answering those two questions reshape the way you share the gospel this month?',
        followUp:
          'Practice in the group: say the gospel in 60 seconds using Eden’s loss and Christ’s recovery.',
      },
    ],
    closingPrayer:
      'Creator God, you made us for your presence in a good world. We grieve every reversed blessing and we wait for all creation to be made new. Restore in us the dignity of your image, the joy of holy work, and hope in the Second Adam who buys back what was lost. Amen.',
  },
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
  {
    id: 'epic-of-eden-ch6',
    series: 'Epic of Eden',
    chapter: 6,
    title: 'Noah and Abraham',
    author: 'Sandra L. Richter',
    current: true,
    blurb:
      'The rescue plan begins in earnest: God reboots a corrupt world through Noah, then names a people, a place, and his presence through Abraham.',
    scriptureFocus: [
      { ref: 'Genesis 6–9', note: 'Flood, ark, and Noah’s covenant' },
      { ref: 'Genesis 8:20–9:17', note: 'Rainbow promise — never again' },
      { ref: 'Genesis 12:1–9', note: 'Abram’s call: go, and I will bless' },
      { ref: 'Genesis 15', note: 'Covenant ceremony — God walks alone' },
      { ref: 'Genesis 17:1–8', note: 'New names: Abraham and Sarah' },
    ],
    bigIdea:
      'God answers human ruin with a second chance (Noah) and then begins gathering a covenant family (Abraham)—people, place, and presence back on the table.',
    icebreaker:
      'Have you ever needed a true reset—a clean slate after something you could not fix yourself? What did “second chance” feel like in that season?',
    questions: [
      {
        id: 'q1',
        prompt:
          'Richter frames the flood as a de-creational event, not only a natural disaster—God returning the world toward chaos so he can start again. How does that change the way you hear Genesis 6–9?',
        followUp:
          'Where do you still picture the flood mainly as “kids’ ark art,” and what would it mean to take its terror and mercy more seriously?',
      },
      {
        id: 'q2',
        prompt:
          'Unlike some ancient flood stories that treat the cataclysm as the start of an inferior age, Genesis presents the flood as rescue—God saving humanity from itself. Where do you need to believe that God’s judgment and mercy can arrive in the same act?',
        followUp:
          'Is there a hard providence in your life that you have only named as loss, and not yet as a severe mercy?',
      },
      {
        id: 'q3',
        prompt:
          'After the flood, God reestablishes contact with fallen humanity through the Noahic covenant. What does it mean that God binds himself with a promise (“never again”) before humanity has proven trustworthy?',
        followUp: 'Read Genesis 9:8–17 together. What detail in the rainbow covenant steadies you?',
      },
      {
        id: 'q4',
        prompt:
          'Richter traces an expanding rescue: Eden welcomed everyone; the Fall excluded all; Noah saves one family; Abraham welcomes an extended family permanently. How does watching the circle widen help you trust God’s patience with history—and with you?',
        followUp:
          'Who is someone “outside the circle” you are tempted to write off, and how might Abraham’s call challenge that?',
      },
      {
        id: 'q5',
        prompt:
          'With Abraham, the pattern of people / place / presence comes into focus: offspring, the land of Canaan, and Yahweh as “your very great reward.” Which of those three feels hardest for you to believe God still offers in Christ?',
        followUp:
          'How does “I am your shield, your very great reward” (Genesis 15:1) reframe what you are asking God for right now?',
      },
      {
        id: 'q6',
        prompt:
          'When God renames Abram and Sarai, Richter says he is designating a new Adam and Eve—parents of a chosen line. What does it mean that redemption advances through renamed, imperfect people rather than through a return to flawless Eden stock?',
        followUp:
          'If God put a new name over a weary part of your story this week, what would that name need to declare?',
      },
      {
        id: 'q7',
        prompt:
          'In Genesis 15 God alone walks between the pieces—he takes on the covenant curse himself. How does that scene prepare you to see the cross, and how should it change the way this group carries one another’s failures?',
        followUp:
          'Where do you need to stop trying to “keep the covenant” for God, and instead rest in the God who keeps it for you?',
      },
    ],
    closingPrayer:
      'Lord of the flood and the promise, thank you that you do not abandon a ruined world. You gave Noah a second chance and called Abraham into a family of blessing. Teach us to trust your widening mercy, to walk by faith toward the land you show us, and to rest in the God who keeps covenant when we cannot. Through Jesus, the true offspring of Abraham—Amen.',
  },
  {
    id: 'epic-of-eden-ch7',
    series: 'Epic of Eden',
    chapter: 7,
    title: 'Moses and the Tabernacle',
    author: 'Sandra L. Richter',
    blurb:
      'At Sinai God claims a nation of freed slaves and pitches his tent among them. The kingdom of God becomes visible again in Adam’s world.',
    scriptureFocus: [
      { ref: 'Exodus 3:7–12', note: 'I have come down to rescue' },
      { ref: 'Exodus 19:1–8', note: 'A holy nation' },
      { ref: 'Exodus 25:8–9', note: 'Let them make me a sanctuary' },
      { ref: 'Exodus 40:34–38', note: 'Glory fills the tabernacle' },
      { ref: 'Hebrews 9:1–14', note: 'Greater and more perfect tent' },
    ],
    bigIdea:
      'Yahweh identifies himself forever as the God who frees slaves and dwells with them. The tabernacle’s holy space says God lives here—draw near holy, or not at all—while pointing beyond itself to a greater presence.',
    icebreaker:
      'When have you felt “rescued from bondage” in a literal or figurative way? What did freedom require of you afterward?',
    questions: [
      {
        id: 'q1',
        prompt:
          'Richter notes that for all of history God chooses to be known as the One who rescues slaves and claims them as his own. How should that identity shape the way this group speaks about God?',
        followUp:
          'Where do we talk about God as if he were mainly a life coach or idea, rather than a Liberator?',
      },
      {
        id: 'q2',
        prompt:
          'Covenant logic says Israel serves Yahweh because he first saved them. How does that order (grace, then response) confront both legalism and cheap grace?',
        followUp: 'Read Exodus 19:4–6. What vocation comes with belonging?',
      },
      {
        id: 'q3',
        prompt:
          'The tabernacle’s zones of increasing holiness communicate: God lives here. How does that holy nearness both attract and unsettle you?',
        followUp:
          'Where do you want God’s presence without God’s holiness—or holiness without presence?',
      },
      {
        id: 'q4',
        prompt:
          'Richter introduces typology: an earlier person or event that finds a limited parallel later. How does the tabernacle function as a type—and what are the dangers of over-allegorizing?',
        followUp:
          'What New Testament “antitype” (Christ, church, new creation) helps you read the tent without emptying it of its own meaning?',
      },
      {
        id: 'q5',
        prompt:
          'Jeremiah 31 does not scrap God’s law so much as promise a people who can keep covenant from a transformed heart. How does that nuance change debates about “law vs. grace”?',
        followUp:
          'Where do you need a new heart more than new information?',
      },
      {
        id: 'q6',
        prompt:
          'With the Mosaic covenant, Richter says the kingdom of God may once again be found in Adam’s world. What would it mean for your street, workplace, or dinner table to be a place where God’s reign is visible?',
        followUp:
          'Name one practice of justice, worship, or neighbor-love that would make the kingdom more “findable” around you.',
      },
      {
        id: 'q7',
        prompt:
          'Hebrews says we have a greater tent and a better sacrifice. How does Jesus fulfill what the tabernacle promised without making Israel’s story irrelevant?',
        followUp:
          'How can this group honor the Old Testament’s gravity while clinging to Christ’s finished access?',
      },
    ],
    closingPrayer:
      'God of the exodus, you still free captives and come to dwell with your people. Make us holy as you are holy, grateful for rescue, and eager for your presence. Pitch your tent among us by your Spirit, and lead us through Christ into the true sanctuary. Amen.',
  },
  {
    id: 'epic-of-eden-ch8',
    series: 'Epic of Eden',
    chapter: 8,
    title: 'David and the Monarchy',
    author: 'Sandra L. Richter',
    blurb:
      'When everyone does what is right in their own eyes, God raises a shepherd-king. David becomes the template—and the longing—for a true Son who will set things right.',
    scriptureFocus: [
      { ref: 'Judges 21:25', note: 'Right in his own eyes' },
      { ref: '1 Samuel 16:1–13', note: 'A shepherd anointed' },
      { ref: '2 Samuel 7:8–17', note: 'Davidic covenant' },
      { ref: 'Psalm 72:1–14', note: 'A king for the poor' },
      { ref: 'Isaiah 9:6–7', note: 'Government on his shoulders' },
    ],
    bigIdea:
      'The Davidic covenant supplies the missing typological piece: a king for God’s kingdom and a shepherd for God’s people—someone to lead covenant faithfulness, defend the inheritance, and defeat the enemies.',
    icebreaker:
      'Where do you see “everyone did what was right in their own eyes” showing up in our culture—or in your own decision-making?',
    questions: [
      {
        id: 'q1',
        prompt:
          'Judges ends with covenant people inventing their own morality until they look like (or worse than) the Canaanites. Where is self-made morality eroding covenant identity around us?',
        followUp:
          'What is one area where you prefer a personal code to God’s word?',
      },
      {
        id: 'q2',
        prompt:
          'Richter argues the answer to oppression was not mainly a better military but renewed covenant loyalty. How does that challenge political or cultural “rescue plans” we trust?',
        followUp:
          'Where do you need repentance more than a strategy?',
      },
      {
        id: 'q3',
        prompt:
          'David becomes the measuring stick for every later king. What about David’s heart and vocation (not his failures alone) makes him the paradigm?',
        followUp: 'Read 2 Samuel 7. Which promise to David most fuels your hope in Jesus?',
      },
      {
        id: 'q4',
        prompt:
          'The shepherd-king represents the people, leads obedience, defends inheritance, and defeats enemies. Which of those royal jobs do you most need Jesus to do for you right now?',
        followUp:
          'Which job are you trying to do for yourself without him?',
      },
      {
        id: 'q5',
        prompt:
          'Faithful Israelites learned to ask: “Is there a son of David who can clean up this mess?” How does that ancient ache teach us to pray in messy churches and messy lives?',
        followUp:
          'What mess are you asking the Son of David to confront—without you controlling the outcome?',
      },
      {
        id: 'q6',
        prompt:
          'Psalm 72 pictures a king who defends the poor and crushes the oppressor. How should hope in that King change the way this group uses power, money, and voice?',
        followUp:
          'Name one concrete advocacy or generosity step that would look like loyalty to David’s greater Son.',
      },
      {
        id: 'q7',
        prompt:
          'David’s story includes catastrophic failure and real repentance. How does that both warn leaders and comfort sinners who still hope under God’s covenant?',
        followUp:
          'Where do you need to stop hiding failure and start practicing David’s honesty before God?',
      },
    ],
    closingPrayer:
      'Shepherd-King, we live in an age of self-made rightness. Raise our eyes to the Son of David. Lead us in faithfulness, defend what you have given, defeat what destroys, and teach us to long for your righteous reign. Amen.',
  },
  {
    id: 'epic-of-eden-ch9',
    series: 'Epic of Eden',
    chapter: 9,
    title: 'The New Covenant and the Return of the King',
    author: 'Sandra L. Richter',
    blurb:
      'The story comes full circle: what began in Eden ends in Eden renewed. In Jesus the great rescue is accomplished—Adam is brought home.',
    scriptureFocus: [
      { ref: 'Jeremiah 31:31–34', note: 'New covenant promised' },
      { ref: 'Matthew 1:1–17', note: 'Credentials of the King' },
      { ref: 'Luke 22:19–20', note: 'New covenant in my blood' },
      { ref: 'Hebrews 8:6–13', note: 'Better covenant' },
      { ref: 'Revelation 21:1–5', note: 'God dwelling with humanity' },
    ],
    bigIdea:
      'Jesus holds every covenant credential. In him God’s desire to dwell with his people is fulfilled: kingdom citizenship reopened, the city rebuilt in God’s presence, Adam safely home.',
    icebreaker:
      'If you had to tell the whole Bible story in three sentences to a friend, what would you say? (We’ll refine it after tonight.)',
    questions: [
      {
        id: 'q1',
        prompt:
          'Many expected a son of David who would restore national glory like the old days. How does knowing God’s larger Eden-to-New-Jerusalem plan correct small political hopes for Jesus?',
        followUp:
          'Where are you still asking Jesus mainly to “restore my comfort” rather than bring Adam home?',
      },
      {
        id: 'q2',
        prompt:
          'Matthew opens with a genealogy as Jesus’ essential credentials. After reading Epic of Eden, which names in that list now feel heavy with meaning?',
        followUp: 'Skim Matthew 1:1–17. Where do you see people, place, and promise converging?',
      },
      {
        id: 'q3',
        prompt:
          'The incarnation’s aim, Richter says, is that Adam’s children might be born again to a second chance at life. How does that frame both Christmas and the cross?',
        followUp:
          'Where do you need a second chance that only union with Christ can give?',
      },
      {
        id: 'q4',
        prompt:
          '“What began in Eden ends in Eden.” How does that full-circle ending protect us from a gospel that abandons creation—or from a hope that never needs Jesus?',
        followUp:
          'Which imbalance do you lean toward: escape from the world, or repairing the world without the King?',
      },
      {
        id: 'q5',
        prompt:
          'Jeremiah’s new covenant promises internalized law and known-by-God relationship. How have you experienced that—or longed for it—this year?',
        followUp:
          'What old pattern still needs the Spirit’s rewriting on the heart?',
      },
      {
        id: 'q6',
        prompt:
          'Richter’s conclusion: the great rescue is accomplished; Adam is safely home. If that is true, what should change in how this group confesses sin, takes the Lord’s Supper, and faces death?',
        followUp:
          'What fear loses power if the King has truly brought us home?',
      },
      {
        id: 'q7',
        prompt:
          'Tell the Epic of Eden aloud as a group: original intent, fall, covenant stages, Christ, new creation. What piece do you want to keep teaching your household or friends?',
        followUp:
          'Who will you invite into this story next—and which chapter will you start them in?',
      },
    ],
    closingPrayer:
      'Returning King, thank you that the story does not end in exile. You have opened the way home. Write your law on our hearts, gather your people, renew your world, and keep us faithful until the day God dwells with humanity forever. In Jesus’ name—Amen.',
  },
];

/** Studies in chapter order for browsing the full book. */
export function getStudiesInOrder() {
  return [...LIFEGROUP_STUDIES].sort((a, b) => a.chapter - b.chapter);
}

export function getStudyById(id) {
  return LIFEGROUP_STUDIES.find((s) => s.id === id) || null;
}

/** The guide marked current, else the highest chapter. */
export function getCurrentStudy() {
  return (
    LIFEGROUP_STUDIES.find((s) => s.current) ||
    getStudiesInOrder()[getStudiesInOrder().length - 1] ||
    null
  );
}
