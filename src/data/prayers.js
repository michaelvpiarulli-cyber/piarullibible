/**
 * Prayers shown at the close of each day, from three streams: the church
 * fathers and saints, Scripture itself, and a few modern voices.
 *
 * Provenance:
 * - `attributed: true` marks traditional prayers long associated with a figure
 *   but not always firmly documented in their own hand; the rest are from their
 *   known writings.
 * - Scripture prayers use the World English Bible (public domain), matching the
 *   app's reader.
 * - Modern entries are only included where a genuine, documented prayer exists.
 *   John Piper's is his well-attested daily "IOUS" pattern — four Psalms he
 *   prays, so the words are Scripture, not his own composition. Short excerpts
 *   from copyrighted modern works are used sparingly and attributed.
 *
 * Prayers commonly MISattributed (e.g. the "Peace Prayer" popularly tied to St.
 * Francis, or "Christ has no body now but yours" to St. Teresa) are deliberately
 * excluded. Some longer prayers are gently excerpted.
 *
 * Fields: { text, author, era, attributed?, label?, cite? }
 * `label` overrides the "Closing Prayer" heading; `cite` overrides the
 * "— Author · era" credit line.
 */
export const PRAYERS = [
  {
    text: 'You have made us for yourself, O Lord, and our heart is restless until it rests in you.',
    author: 'Augustine of Hippo',
    era: '354–430',
  },
  {
    text: 'Late have I loved you, beauty so old and so new: late have I loved you. You were within me, but I was outside, and there I sought you.',
    author: 'Augustine of Hippo',
    era: '354–430',
  },
  {
    text: 'Grant me, O Lord my God, a mind to know you, a heart to seek you, wisdom to find you, a way of life to please you, and a hope of finally embracing you.',
    author: 'Thomas Aquinas',
    era: '1225–1274',
  },
  {
    text: 'Take, Lord, and receive all my liberty, my memory, my understanding, and my entire will. You have given all to me; to you I return it. Give me only your love and your grace; that is enough for me.',
    author: 'Ignatius of Loyola',
    era: '1491–1556',
  },
  {
    text: 'Teach us, good Lord, to serve you as you deserve; to give and not to count the cost; to fight and not to heed the wounds; to labor and not to seek for rest; to give and not to ask reward, save that of knowing that we do your will.',
    author: 'Ignatius of Loyola',
    era: '1491–1556',
    attributed: true,
  },
  {
    text: 'Let nothing disturb you, let nothing frighten you. All things pass away; God never changes. Patience obtains all things. Whoever has God lacks nothing; God alone suffices.',
    author: 'Teresa of Ávila',
    era: '1515–1582',
  },
  {
    text: 'Christ with me, Christ before me, Christ behind me, Christ within me, Christ beneath me, Christ above me, Christ on my right, Christ on my left.',
    author: 'St. Patrick',
    era: '5th century',
    attributed: true,
  },
  {
    text: 'Most High, glorious God, enlighten the darkness of my heart, and give me true faith, certain hope, and perfect charity, that I may carry out your holy and true command.',
    author: 'Francis of Assisi',
    era: '1181–1226',
  },
  {
    text: 'O Lord and Master of my life, take from me the spirit of sloth, despair, lust of power, and idle talk. But grant to your servant a spirit of chastity, humility, patience, and love.',
    author: 'Ephrem the Syrian',
    era: 'c. 306–373',
  },
  {
    text: 'O Lord my God, teach my heart this day where and how to see you, where and how to find you. Let me seek you in longing, and long for you in seeking; let me find you in love, and love you in finding.',
    author: 'Anselm of Canterbury',
    era: '1033–1109',
  },
  {
    text: 'God, of your goodness, give me yourself, for you are enough for me. And only in you do I have everything.',
    author: 'Julian of Norwich',
    era: 'c. 1343–1416',
  },
  {
    text: 'All shall be well, and all shall be well, and all manner of thing shall be well.',
    author: 'Julian of Norwich',
    era: 'c. 1343–1416',
  },
  {
    text: 'Thanks be to you, my Lord Jesus Christ, for all the benefits you have given me, for all the pains and insults you have borne for me. May I know you more clearly, love you more dearly, and follow you more nearly, day by day.',
    author: 'Richard of Chichester',
    era: '1197–1253',
  },
  {
    text: 'May the Lord support us all the day long, till the shadows lengthen and the evening comes, and the busy world is hushed, and our work is done. Then in his mercy may he give us a safe lodging, and a holy rest, and peace at the last.',
    author: 'John Henry Newman',
    era: '1801–1890',
  },
  {
    text: 'Grant me, O Lord, to know what is worth knowing, to love what is worth loving, to praise what delights you most, and to value what is precious in your sight.',
    author: 'Thomas à Kempis',
    era: 'c. 1380–1471',
  },
  {
    text: 'We beseech you, Master, be our help and defender. Save those among us who are in trouble; have mercy on the lowly; raise up the fallen; heal the sick; and bring back the wandering of your people.',
    author: 'Clement of Rome',
    era: 'c. AD 96',
  },
  {
    text: 'O Lord God Almighty, Father of your beloved Son Jesus Christ, I bless you that you have counted me worthy of this day and hour, to take my part among the number of your witnesses.',
    author: 'Polycarp of Smyrna',
    era: 'c. 69–155',
  },
  {
    text: 'I pray you, good Jesus, that as you have graciously given me to drink in with delight the words of your knowledge, so you would mercifully grant me to come at length to yourself, the fountain of all wisdom, and to dwell before your face forever.',
    author: 'The Venerable Bede',
    era: 'c. 672–735',
  },
  {
    text: 'Eternal God, eternal Trinity, you are a deep sea, into which the more I enter the more I find, and the more I find the more I seek you still.',
    author: 'Catherine of Siena',
    era: '1347–1380',
  },
  {
    text: 'Do not look forward in fear to the changes of life; rather look to them with full hope that, as they arise, God, whose own you are, will lead you safely through all things; and when you cannot stand it, God will carry you in his arms.',
    author: 'Francis de Sales',
    era: '1567–1622',
    attributed: true,
  },
  {
    text: 'Almighty God, who has given us grace with one accord to make our common supplication to you, fulfill now the desires and petitions of your servants as may be best for us; granting us in this world knowledge of your truth, and in the age to come life everlasting.',
    author: 'John Chrysostom',
    era: 'c. 347–407',
    attributed: true,
  },
  {
    text: 'Be a bright flame before me, a guiding star above me, a smooth path below me, and a kindly shepherd behind me, today, tonight, and forever.',
    author: 'St. Columba',
    era: '521–597',
    attributed: true,
  },
  {
    text: 'Mine are the heavens and mine is the earth. What do you ask, then, and seek, my soul? All is yours, and all is for you.',
    author: 'John of the Cross',
    era: '1542–1591',
  },
  {
    text: 'O Holy Spirit, breathe in me that my thoughts may all be holy. Move in me that my work, too, may be holy. Draw my heart that I may love only what is holy, and guard me that I may always be holy.',
    author: 'Augustine of Hippo',
    era: '354–430',
    attributed: true,
  },
  {
    text: 'Jesus, the very thought of you fills my heart with sweetness; but sweeter far your face to see, and in your presence rest.',
    author: 'Bernard of Clairvaux',
    era: '1090–1153',
    attributed: true,
  },
  {
    text: 'Lead, kindly Light, amid the encircling gloom, lead me on. The night is dark, and I am far from home; lead me on. Keep my feet; I do not ask to see the distant scene — one step enough for me.',
    author: 'John Henry Newman',
    era: '1801–1890',
  },
  {
    text: 'Bless to me, O God, the earth beneath my feet; bless to me, O God, the path on which I go; bless to me, O God, the thing of my desire; O God of gods, bless to me my rest.',
    author: 'Celtic tradition',
    era: 'medieval',
    attributed: true,
  },
  {
    text: 'O Lord, support me by your grace, that I may never presume upon your mercy, but always remember the greatness of your love, and walk before you in reverence and gladness all my days.',
    author: 'Basil the Great',
    era: '330–379',
    attributed: true,
  },

  // --- Prayers straight from Scripture (World English Bible, public domain) ---
  {
    text: 'Our Father in heaven, may your name be kept holy. Let your Kingdom come. Let your will be done, as in heaven, so on earth. Give us today our daily bread. Forgive us our debts, as we also forgive our debtors. Bring us not into temptation, but deliver us from the evil one. For yours is the Kingdom, the power, and the glory forever. Amen.',
    label: 'The Lord’s Prayer',
    cite: 'Matthew 6:9–13 · World English Bible',
  },
  {
    text: 'Yahweh is my shepherd: I shall lack nothing. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul. He guides me in the paths of righteousness for his name’s sake. Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me. Your rod and your staff, they comfort me. You prepare a table before me in the presence of my enemies. You anoint my head with oil. My cup runs over. Surely goodness and loving kindness shall follow me all the days of my life, and I will dwell in Yahweh’s house forever.',
    label: 'A Prayer from Scripture',
    cite: 'Psalm 23 · World English Bible',
  },
  {
    text: 'Yahweh bless you, and keep you. Yahweh make his face to shine on you, and be gracious to you. Yahweh lift up his face toward you, and give you peace.',
    label: 'A Blessing from Scripture',
    cite: 'Numbers 6:24–26 · World English Bible',
  },
  {
    text: 'Create in me a clean heart, O God. Renew a right spirit within me. Don’t throw me from your presence, and don’t take your holy Spirit from me. Restore to me the joy of your salvation. Uphold me with a willing spirit.',
    label: 'A Prayer from Scripture',
    cite: 'Psalm 51:10–12 · World English Bible',
  },
  {
    text: 'Let the words of my mouth and the meditation of my heart be acceptable in your sight, Yahweh, my rock, and my redeemer.',
    label: 'A Prayer from Scripture',
    cite: 'Psalm 19:14 · World English Bible',
  },
  {
    text: 'Search me, God, and know my heart. Try me, and know my thoughts. See if there is any wicked way in me, and lead me in the everlasting way.',
    label: 'A Prayer from Scripture',
    cite: 'Psalm 139:23–24 · World English Bible',
  },
  {
    text: 'So teach us to count our days, that we may gain a heart of wisdom.',
    label: 'A Prayer from Scripture',
    cite: 'Psalm 90:12 · World English Bible',
  },
  {
    text: 'I pray that you may be strengthened with power through his Spirit in the inward man, that Christ may dwell in your hearts through faith; that you, being rooted and grounded in love, may comprehend with all the saints the width and length and height and depth, and to know Christ’s love which surpasses knowledge, that you may be filled with all the fullness of God.',
    label: 'A Prayer from Scripture',
    cite: 'Ephesians 3:16–19 · World English Bible',
  },
  {
    text: 'This I pray, that your love may abound yet more and more in knowledge and all discernment, so that you may approve the things that are excellent, that you may be sincere and without offense to the day of Christ, being filled with the fruits of righteousness, which are through Jesus Christ, to the glory and praise of God.',
    label: 'A Prayer from Scripture',
    cite: 'Philippians 1:9–11 · World English Bible',
  },
  {
    text: 'Now may the God of hope fill you with all joy and peace in believing, that you may abound in hope, in the power of the Holy Spirit.',
    label: 'A Prayer from Scripture',
    cite: 'Romans 15:13 · World English Bible',
  },
  {
    text: 'Now may the God of peace, who brought again from the dead the great shepherd of the sheep with the blood of an eternal covenant, our Lord Jesus, make you complete in every good work to do his will, working in you that which is well pleasing in his sight, through Jesus Christ, to whom be the glory forever and ever. Amen.',
    label: 'A Prayer from Scripture',
    cite: 'Hebrews 13:20–21 · World English Bible',
  },
  {
    text: 'Now to him who is able to keep you from stumbling, and to present you faultless before the presence of his glory in great joy, to God our Savior, who alone is wise, be glory and majesty, dominion and power, both now and forever. Amen.',
    label: 'A Prayer from Scripture',
    cite: 'Jude 24–25 · World English Bible',
  },
  {
    text: 'Though the fig tree doesn’t flourish, nor fruit be in the vines; though the labor of the olive fails, and the fields yield no food; though the flocks are cut off from the fold, and there is no herd in the stalls: yet I will rejoice in Yahweh. I will be joyful in the God of my salvation!',
    label: 'A Prayer from Scripture',
    cite: 'Habakkuk 3:17–18 · World English Bible',
  },
  {
    text: 'The grace of the Lord Jesus Christ, God’s love, and the fellowship of the Holy Spirit, be with you all. Amen.',
    label: 'A Blessing from Scripture',
    cite: '2 Corinthians 13:14 · World English Bible',
  },

  // --- Modern voices (see note in header re: sourcing) ---
  {
    // The four Scriptures John Piper is widely documented to pray daily; the
    // acronym I-O-U-S is his. Words are Scripture (WEB), not his own composition.
    text: 'Turn my heart toward your statutes, not toward selfish gain. Open my eyes, that I may see wondrous things out of your law. Make my heart undivided to fear your name. Satisfy us in the morning with your loving kindness, that we may rejoice and be glad all our days.',
    label: 'A Prayer from Scripture',
    cite: 'John Piper’s daily “IOUS” prayer · Psalm 119, 86 & 90 (WEB)',
  },
  {
    text: 'O God, early in the morning I cry to you. Help me to pray, and to gather my thoughts to you; I cannot do this alone. In me it is dark, but with you there is light. I am lonely, but you do not leave me. I am restless, but with you there is peace.',
    author: 'Dietrich Bonhoeffer',
    era: '1906–1945',
  },
  {
    text: 'From prayer that asks that I may be sheltered from winds that beat on Thee, from fearing when I should aspire, from faltering when I should climb higher — from silken self, O Captain, free Thy soldier who would follow Thee.',
    author: 'Amy Carmichael',
    era: '1867–1951',
  },
  {
    text: 'O God, I have tasted your goodness, and it has both satisfied me and made me thirsty for more. I am painfully conscious of my need of further grace. Show me your glory, I pray, that I may know you indeed.',
    author: 'A.W. Tozer',
    era: '1897–1963',
    attributed: true,
  },
];

/** Deterministic so a given day always shows the same prayer; cycles yearly. */
export function prayerForDay(day) {
  return PRAYERS[(day - 1) % PRAYERS.length];
}
