/**
 * Weekly glimpse of how God is forming the baby + one gentle tip.
 * Weeks follow standard pregnancy dating (LMP). Soft, wonder-focused language.
 */

const STAGES = [
  {
    week: 1,
    title: 'A new story begins',
    forming:
      'Even before a tiny life is visible, God is already writing a story. This week is about preparation — the quiet beginning of something holy.',
    tip: 'Start a simple habit of thanking God each morning for what you cannot yet see.',
  },
  {
    week: 2,
    title: 'The womb prepares',
    forming:
      'Your body is being readied as a dwelling place. God designs every detail of the environment where new life will grow.',
    tip: 'Rest when you can, and drink water like it’s part of the work of love.',
  },
  {
    week: 3,
    title: 'Life takes root',
    forming:
      'Conception may be happening now — a unique person known by God. Cells begin dividing with astonishing order.',
    tip: 'If you’re trying or waiting, keep prenatal vitamins and gentle walks in the rhythm of your days.',
  },
  {
    week: 4,
    title: 'A heart-sized beginning',
    forming:
      'The embryo is implanting and the foundations of body systems are being laid. God is knitting in secret.',
    tip: 'Avoid alcohol and check any medicines with your doctor — small choices guard a great work.',
  },
  {
    week: 5,
    title: 'A beating beginning',
    forming:
      'The neural tube is forming and a tiny heart tube is starting its work. Life’s rhythm is already underway.',
    tip: 'Nausea may begin soon; keep simple snacks nearby and eat before you feel empty.',
  },
  {
    week: 6,
    title: 'Features take shape',
    forming:
      'Facial features, arm and leg buds, and early brain structures are appearing. God is shaping identity cell by cell.',
    tip: 'Short rests beat long push-throughs. Honor tiredness as part of growing a person.',
  },
  {
    week: 7,
    title: 'Hands and feet emerge',
    forming:
      'Little hands and feet are forming; the brain is growing quickly. Your baby is becoming unmistakably human.',
    tip: 'If smells turn you off food, try cooler meals and bland proteins until appetite returns.',
  },
  {
    week: 8,
    title: 'Fingers and toes',
    forming:
      'Fingers and toes separate; eyelids form. The heart has chambers now — a masterpiece in miniature.',
    tip: 'Schedule prenatal care if you haven’t yet; early visits help you steward this gift well.',
  },
  {
    week: 9,
    title: 'Essential organs at work',
    forming:
      'Major organs are present and beginning to function. God is establishing the systems that will sustain life outside the womb.',
    tip: 'Gentle stretching and good posture can ease early back and hip strain.',
  },
  {
    week: 10,
    title: 'From embryo to fetus',
    forming:
      'Your baby is now called a fetus — vital organs are in place and growth accelerates. Hair follicles and nails begin.',
    tip: 'Keep caffeine modest and choose water first when you’re thirsty.',
  },
  {
    week: 11,
    title: 'Bones begin to harden',
    forming:
      'Bones are starting to harden; tooth buds form. The face looks more defined — wonder you can almost imagine.',
    tip: 'Calcium-rich foods (dairy, leafy greens, fortified options) support the skeleton God is building.',
  },
  {
    week: 12,
    title: 'Reflexes awaken',
    forming:
      'Reflexes are developing; the baby can open and close fists. Kidneys begin producing urine — systems coming online.',
    tip: 'Many feel a turn toward energy as the first trimester ends; ease back into movement you enjoy.',
  },
  {
    week: 13,
    title: 'Unique fingerprints',
    forming:
      'Unique fingerprints are forming. Vocal cords develop. This child already bears an unrepeatable design.',
    tip: 'Celebrate the end of the first trimester with something small and kind for yourself.',
  },
  {
    week: 14,
    title: 'Expressions appear',
    forming:
      'Facial muscles allow tiny expressions. The baby can squint and frown. Growth is steady and strong.',
    tip: 'Second-trimester hunger is common — keep nourishing snacks ready so you aren’t running empty.',
  },
  {
    week: 15,
    title: 'Sensing light',
    forming:
      'Bones continue strengthening; the baby may sense light. Legs are growing longer than arms now.',
    tip: 'Side-sleeping with a pillow between your knees can help hips and breathing as you grow.',
  },
  {
    week: 16,
    title: 'Hearing begins',
    forming:
      'The ears are developed enough to hear — your voice and heartbeat are already a familiar world.',
    tip: 'Talk or sing to your baby. Your voice is one of the first gifts they receive.',
  },
  {
    week: 17,
    title: 'Fat stores begin',
    forming:
      'Brown stores start forming for warmth and energy. The skeleton continues to harden from cartilage.',
    tip: 'Iron-rich foods (beans, meat, greens) support both your blood volume and baby’s growth.',
  },
  {
    week: 18,
    title: 'A unique nervous system',
    forming:
      'Myelin begins coating nerves so messages travel faster. Fingerprints are set. The baby is increasingly active.',
    tip: 'You may feel flutters soon — pause when you notice them and thank God for movement.',
  },
  {
    week: 19,
    title: 'A protective coating',
    forming:
      'Vernix, a protective coating, covers the skin. Sensory development continues — touch, taste, hearing.',
    tip: 'A warm (not hot) shower and loose clothes can soothe stretched skin and growing belly.',
  },
  {
    week: 20,
    title: 'Halfway wonder',
    forming:
      'Halfway! The baby swallows, and you may feel clearer kicks. Hair and brows are forming.',
    tip: 'The anatomy scan often comes around now — bring questions, and breathe; God already knows this child.',
  },
  {
    week: 21,
    title: 'Bone marrow makes blood',
    forming:
      'Bone marrow begins making blood cells. Eyebrows and lids are more defined. Growth is rapid.',
    tip: 'Practice getting out of bed by rolling to your side first — kinder on your back and pelvis.',
  },
  {
    week: 22,
    title: 'Senses sharpen',
    forming:
      'Taste buds are forming; the baby may sense sweet or bitter in the amniotic fluid. Lips and eyelids more complete.',
    tip: 'Swelling in ankles? Elevate your feet when you can and skip standing still for long stretches.',
  },
  {
    week: 23,
    title: 'Practice breathing',
    forming:
      'Lungs are developing; the baby practices breathing motions. Hearing is sharper — voices and music matter.',
    tip: 'Play calm music or read a short Psalm aloud. You’re already parenting with presence.',
  },
  {
    week: 24,
    title: 'Viability threshold',
    forming:
      'Lungs and brain keep maturing. With intensive care, survival outside the womb becomes more possible — a reminder of how far God has brought this life.',
    tip: 'Learn your hospital’s maternity tour options; familiarity lowers fear later.',
  },
  {
    week: 25,
    title: 'Responding to voice',
    forming:
      'The baby may respond to your voice with movement. Hands are fully developed; fat layers increase.',
    tip: 'Braxton Hicks can start — hydrate and change positions; call your provider if contractions become regular or painful.',
  },
  {
    week: 26,
    title: 'Eyes open',
    forming:
      'Eyes may open; eyelashes form. Brain wave activity consistent with hearing and response continues to grow.',
    tip: 'Support your bump in the car with the seatbelt under the belly and across the chest.',
  },
  {
    week: 27,
    title: 'Sleep cycles',
    forming:
      'Sleep cycles appear — including REM. The third trimester is near; lungs and brain still have rich work ahead.',
    tip: 'Nap without guilt. Growing a brain and lungs is real labor for your body.',
  },
  {
    week: 28,
    title: 'Third trimester',
    forming:
      'Entering the third trimester: rapid brain growth, stronger kicks, and more coordinated movements. God is finishing what He started.',
    tip: 'Count kicks once a day when settled — a simple way to stay attentive to your baby’s patterns.',
  },
  {
    week: 29,
    title: 'Muscles strengthen',
    forming:
      'Muscles and lungs keep strengthening. The baby can turn toward light. Head growth supports a booming brain.',
    tip: 'Heartburn is common — smaller meals, upright after eating, and ask your doctor about safe relief.',
  },
  {
    week: 30,
    title: 'Rapid brain growth',
    forming:
      'Brain volume increases quickly; bone marrow is fully making red blood cells. Fat softens the features.',
    tip: 'Pack a draft hospital bag list this week — even if you fill it later, clarity brings peace.',
  },
  {
    week: 31,
    title: 'Processing information',
    forming:
      'All five senses work; the baby processes more information. Kicks may feel like rolls as space tightens.',
    tip: 'Practice slow breathing for labor: in for four, out for six. A calm body helps a calm mind.',
  },
  {
    week: 32,
    title: 'Practicing for birth',
    forming:
      'Toenails and fingernails are formed; the baby practices breathing and sucking. Skin softens with fat.',
    tip: 'Discuss feeding plans and postpartum support with someone you trust — you won’t do this alone.',
  },
  {
    week: 33,
    title: 'Immune gifts',
    forming:
      'The baby receives antibodies from you — an early covering of protection. Bones harden, though the skull stays flexible for birth.',
    tip: 'Stretch hips gently and keep walking if your provider says it’s okay; movement eases later discomfort.',
  },
  {
    week: 34,
    title: 'Central nervous system matures',
    forming:
      'The central nervous system is maturing; lungs are nearly ready. Vernix thickens as a birth-day protection.',
    tip: 'Install the car seat now and get it checked — one less task when baby arrives.',
  },
  {
    week: 35,
    title: 'Kidneys and liver ready',
    forming:
      'Kidneys are fully developed; liver can process some waste. Most babies settle head-down around now.',
    tip: 'Watch for signs of preeclampsia (sudden swelling, headache, vision changes) and call promptly if worried.',
  },
  {
    week: 36,
    title: 'Lungs nearly ready',
    forming:
      'Lungs are likely ready to breathe air. Baby is gaining about an ounce a day — finishing touches of strength.',
    tip: 'Wash a few newborn outfits and set out postpartum pads/ice packs so home feels ready.',
  },
  {
    week: 37,
    title: 'Early term',
    forming:
      'Early term: organs can function outside the womb. Fat fills cheeks; grasp is strong. God has prepared a birthable body.',
    tip: 'Rest hard this week. Say no to extra commitments; conserve for labor and the first nights.',
  },
  {
    week: 38,
    title: 'Fully developed',
    forming:
      'The baby is considered fully developed. Meconium is building in the intestines; lungs keep refining to the end.',
    tip: 'Know your go-to-hospital signs: regular contractions, water breaking, strong constant pain, or baby’s movement slowing.',
  },
  {
    week: 39,
    title: 'Waiting on timing',
    forming:
      'Organs continue subtle finishing. Waiting is part of the design — birth often comes in God’s timing, not the calendar’s.',
    tip: 'Alternate short walks with feet-up rest. Pack snacks and chargers in the hospital bag.',
  },
  {
    week: 40,
    title: 'Ready to meet you',
    forming:
      'Due time: this child is ready to be held. However labor unfolds, the One who formed your baby in secret will be with you in the revealing.',
    tip: 'When labor begins, advocate kindly for what you need — water, dim lights, a hand to hold, a whispered prayer.',
  },
];

/** @param {number} week pregnancy week 1–40 */
export function pregnancyStageForWeek(week) {
  const w = Math.min(40, Math.max(1, Math.round(Number(week) || 1)));
  return STAGES[w - 1];
}
