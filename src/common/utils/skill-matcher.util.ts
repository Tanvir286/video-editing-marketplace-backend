import * as natural from 'natural';

/**
 *
 * @param jobSkillStr example: "htlm, js, premier pro"
 * @param editorSkills example: ["html", "css", "premiere pro"]
 */
export function calculateSkillMatch(
    jobSkillStr: string | null, 
    editorSkills: string[]):number 
{
  
 if (!jobSkillStr || editorSkills.length === 0) return 0;

  const jobSkills = jobSkillStr
    .split(',')
    .map((s) => s.toLowerCase().trim())
    .filter((s) => s.length > 0);

  if (jobSkills.length === 0) return 0;

  let totalScore = 0;

  for (const jobSkill of jobSkills) {
    let bestMatchScore = 0;

    for (const userSkill of editorSkills) {
      const score = natural.JaroWinklerDistance(userSkill, jobSkill);
      if (score > bestMatchScore) {
        bestMatchScore = score;
      }
    }

    // 85% percentage threshold for considering a skill match
    if (bestMatchScore >= 0.85) {
      totalScore += bestMatchScore;
    }
  }

  // Average global percentage return
  return Math.round((totalScore / jobSkills.length) * 100);
}