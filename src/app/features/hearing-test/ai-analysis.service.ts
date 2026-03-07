import { Injectable } from '@angular/core';

export interface EarResult {
    thresholds: { [freq: number]: number };  // frequency → dB threshold
    pta: number;                              // Pure Tone Average
    category: string;                         // Normal, Mild, etc.
    categoryClass: string;                    // CSS class for badge color
}

export interface HearingAnalysis {
    leftEar: EarResult;
    rightEar: EarResult;
    overallCategory: string;
    overallCategoryClass: string;
    aiMessage: string;
    hasAsymmetry: boolean;
    inconsistencies: string[];
}

@Injectable({ providedIn: 'root' })
export class AiAnalysisService {

    private readonly frequencies = [500, 1000, 2000, 4000, 8000];

    // Volume level index → simulated dB HL
    private readonly volumeToDb: number[] = [50, 40, 30, 20, 10];

    /**
     * Analyze hearing test results.
     * @param responses Map of `${ear}-${frequency}` → last heard volume level index (0-7),
     *                  or -1 if never heard
     */
    analyze(responses: Map<string, number>): HearingAnalysis {
        const frequencies = [500, 1000, 2000, 4000, 8000]; // Frequencies used for this analysis
        const leftThresholds = this.computeThresholds('left', responses);
        const rightThresholds = this.computeThresholds('right', responses);

        const leftPta = this.computePTA(leftThresholds);
        const rightPta = this.computePTA(rightThresholds);

        const leftCategory = this.categorize(leftPta);
        const rightCategory = this.categorize(rightPta);

        const overallPta = Math.max(leftPta, rightPta);
        const overallCategory = this.categorize(overallPta);

        const hasAsymmetry = this.detectAsymmetry(leftThresholds, rightThresholds);
        const inconsistencies = this.detectInconsistencies(responses);

        const aiMessage = this.generateAiMessage(
            leftPta, rightPta, leftCategory, rightCategory,
            leftThresholds, rightThresholds, hasAsymmetry, inconsistencies
        );

        return {
            leftEar: {
                thresholds: leftThresholds,
                pta: leftPta,
                category: leftCategory.label,
                categoryClass: leftCategory.cssClass,
            },
            rightEar: {
                thresholds: rightThresholds,
                pta: rightPta,
                category: rightCategory.label,
                categoryClass: rightCategory.cssClass,
            },
            overallCategory: overallCategory.label,
            overallCategoryClass: overallCategory.cssClass,
            aiMessage,
            hasAsymmetry,
            inconsistencies,
        };
    }

    private computeThresholds(ear: string, responses: Map<string, number>): { [freq: number]: number } {
        const thresholds: { [freq: number]: number } = {};
        for (const freq of this.frequencies) {
            const key = `${ear}-${freq}`;
            const lastHeard = responses.get(key);
            if (lastHeard === undefined || lastHeard === -1) {
                // Never heard → profound loss at this frequency
                thresholds[freq] = 80;
            } else {
                // Threshold is the dB of the softest level they still heard
                thresholds[freq] = this.volumeToDb[Math.min(lastHeard, this.volumeToDb.length - 1)];
            }
        }
        return thresholds;
    }

    private computePTA(thresholds: { [freq: number]: number }): number {
        // Standard PTA uses 500, 1000, 2000 Hz
        const ptaFreqs = [500, 1000, 2000];
        const sum = ptaFreqs.reduce((s, f) => s + (thresholds[f] || 0), 0);
        return Math.round(sum / ptaFreqs.length);
    }

    private categorize(pta: number): { label: string; cssClass: string } {
        if (pta <= 25) return { label: 'Normal', cssClass: 'cat-normal' };
        if (pta <= 40) return { label: 'Mild', cssClass: 'cat-mild' };
        if (pta <= 55) return { label: 'Moderate', cssClass: 'cat-moderate' };
        if (pta <= 70) return { label: 'Severe', cssClass: 'cat-severe' };
        return { label: 'Profound', cssClass: 'cat-profound' };
    }

    private detectAsymmetry(left: { [f: number]: number }, right: { [f: number]: number }): boolean {
        for (const freq of this.frequencies) {
            if (Math.abs((left[freq] || 0) - (right[freq] || 0)) > 20) {
                return true;
            }
        }
        return false;
    }

    private detectInconsistencies(responses: Map<string, number>): string[] {
        const issues: string[] = [];

        // Check if low frequencies (should be easier) have worse thresholds than high
        for (const ear of ['left', 'right']) {
            const t500 = responses.get(`${ear}-500`);
            const t1000 = responses.get(`${ear}-1000`);
            if (t500 !== undefined && t1000 !== undefined && t500 > t1000 + 2) {
                issues.push(`Unusual pattern in ${ear} ear: low frequency response weaker than mid frequency.`);
            }
        }

        return issues;
    }

    private generateAiMessage(
        leftPta: number, rightPta: number,
        leftCat: { label: string }, rightCat: { label: string },
        leftThresholds: { [f: number]: number },
        rightThresholds: { [f: number]: number },
        hasAsymmetry: boolean, inconsistencies: string[]
    ): string {
        const parts: string[] = [];

        if (leftCat.label === 'Normal' && rightCat.label === 'Normal') {
            parts.push('Great news! Based on your responses, your hearing appears to be within the normal range for both ears.');
            parts.push('We recommend periodic hearing check-ups to maintain your hearing health.');
        } else {
            // Determine which ear(s) have loss
            const bothAffected = leftCat.label !== 'Normal' && rightCat.label !== 'Normal';
            const worseEar = leftPta > rightPta ? 'left' : 'right';
            const worseThresholds = worseEar === 'left' ? leftThresholds : rightThresholds;
            const worseCat = worseEar === 'left' ? leftCat : rightCat;

            if (bothAffected) {
                parts.push(`Based on your responses, there are signs of hearing loss in both ears.`);
                parts.push(`Your left ear shows ${leftCat.label.toLowerCase()} hearing loss (PTA: ${leftPta} dB), and your right ear shows ${rightCat.label.toLowerCase()} hearing loss (PTA: ${rightPta} dB).`);
            } else {
                const affectedEar = leftCat.label !== 'Normal' ? 'left' : 'right';
                const affectedCat = leftCat.label !== 'Normal' ? leftCat : rightCat;
                const affectedPta = leftCat.label !== 'Normal' ? leftPta : rightPta;
                parts.push(`Based on your responses, there are signs of ${affectedCat.label.toLowerCase()} hearing loss in the ${affectedEar} ear (PTA: ${affectedPta} dB).`);
            }

            // Check high-frequency emphasis
            const highFreqAvg = ((worseThresholds[4000] || 0) + (worseThresholds[8000] || 0)) / 2;
            const lowFreqAvg = ((worseThresholds[500] || 0) + (worseThresholds[1000] || 0)) / 2;
            if (highFreqAvg > lowFreqAvg + 15) {
                parts.push('The loss is more pronounced at higher frequencies, which can affect clarity of speech, especially in noisy environments.');
            }

            parts.push('We strongly recommend scheduling a comprehensive clinical audiometric evaluation with a certified audiologist for an accurate diagnosis.');
        }

        if (hasAsymmetry) {
            parts.push('⚠️ We detected a significant difference between your ears. A clinical evaluation is especially important to rule out underlying conditions.');
        }

        if (inconsistencies.length > 0) {
            parts.push('Note: Some of your responses showed unusual patterns. For the most accurate results, we recommend retaking the test in a quieter environment with headphones.');
        }

        return parts.join(' ');
    }
}
