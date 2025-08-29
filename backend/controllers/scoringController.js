import pool from "../config/db.js";

export const handlePsqiScore = async (userAnswers, res) => {
    try {
        const rulesResult = await pool.query("SELECT * FROM scoring_rules WHERE quiz_name = 'psqi'");
        const rules = rulesResult.rows;
        
        const findRuleScore = (category, questionKey, answer) => {
            const rule = rules.find(r => r.score_category === category && r.question_key === questionKey && r.answer_value === answer);
            return rule ? Number(rule.score_value) : 0;
        };

        let scores = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0, c6: 0, c7: 0 };

        // Component 1: Direct lookup
        scores.c1 = findRuleScore('c1', '6', userAnswers['6']);

        // Component 2: Logic + DB lookup
        const q2Val = parseInt(userAnswers['2'], 10) || 0;
        let q2Score = (q2Val > 60) ? 3 : (q2Val > 30) ? 2 : (q2Val > 15) ? 1 : 0;
        const q5aScore = findRuleScore('c2_q5a_score', '5a', userAnswers['5a']);
        const sumC2 = q2Score + q5aScore;
        scores.c2 = (sumC2 === 0) ? 0 : (sumC2 <= 2) ? 1 : (sumC2 <= 4) ? 2 : 3;

        // Component 3: Pure computational logic
        const q4Val = parseFloat(userAnswers['4']) || 0;
        scores.c3 = (q4Val >= 7) ? 0 : (q4Val >= 6) ? 1 : (q4Val >= 5) ? 2 : 3;
        
        // Component 4: Pure computational logic (time math)
        if (userAnswers['1'] && userAnswers['3'] && userAnswers['4']) {
            const [bedH, bedM] = userAnswers['1'].split(':').map(Number);
            const [wakeH, wakeM] = userAnswers['3'].split(':').map(Number);
            let bedTime = new Date(); bedTime.setHours(bedH, bedM, 0, 0);
            let wakeTime = new Date(); wakeTime.setHours(wakeH, wakeM, 0, 0);
            if (wakeTime <= bedTime) wakeTime.setDate(wakeTime.getDate() + 1);
            const hoursInBed = Math.abs(wakeTime - bedTime) / 36e5;
            const hoursSlept = parseFloat(userAnswers['4']);
            if (hoursInBed > 0) {
                const efficiency = (hoursSlept / hoursInBed) * 100;
                scores.c4 = (efficiency >= 85) ? 0 : (efficiency >= 75) ? 1 : (efficiency >= 65) ? 2 : 3;
            }
        }
        
        // Component 5: Summation using DB lookups
        const disturbanceKeys = ["5b", "5c", "5d", "5e", "5f", "5g", "5h", "5i"];
        let disturbanceSum = 0;
        disturbanceKeys.forEach(key => {
            disturbanceSum += findRuleScore('c5_disturbance_sum', key, userAnswers[key]);
        });
        scores.c5 = (disturbanceSum === 0) ? 0 : (disturbanceSum <= 9) ? 1 : (disturbanceSum <= 18) ? 2 : 3;

        // Component 6: Direct lookup
        scores.c6 = findRuleScore('c6', '7', userAnswers['7']);

        // Component 7: Logic + DB lookups
        const q8Score = findRuleScore('c7_q8_score', '8', userAnswers['8']);
        const q9Score = findRuleScore('c7_q9_score', '9', userAnswers['9']);
        const sumC7 = q8Score + q9Score;
        scores.c7 = (sumC7 === 0) ? 0 : (sumC7 <= 2) ? 1 : (sumC7 <= 4) ? 2 : 3;

        // Final Global Score and Interpretation
        const globalScore = Object.values(scores).reduce((sum, val) => sum + val, 0);

        const interpretationResult = await pool.query(
            `SELECT interpretation_text FROM result_interpretations 
             WHERE quiz_name = 'psqi' AND (min_score IS NULL OR $1 >= min_score) AND (max_score IS NULL OR $1 <= max_score)`,
            [globalScore]
        );
        const interpretation = interpretationResult.rows[0]?.interpretation_text || 'No interpretation.';

        return {
        quizName: 'psqi',
        ...scores,
        globalScore,
        interpretation
    };
        
    } catch (error) {
        console.error('PSQI scoring failed:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

