import { Component, ChangeDetectorRef, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HearingPlayerService } from './hearing-player.service';
import { ToastrService } from 'ngx-toastr';

type TestState = 'intro' | 'test' | 'result';

interface ConsultationData {
  condition: string;
  advice: string;
  recommendations: string[];
}

@Component({
  selector: 'app-hearing-test',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './hearing-test.html',
  styleUrls: ['./hearing-test.css'],
})
export class HearingTest implements OnDestroy, AfterViewInit {
  currentState: TestState = 'intro';
  hasHeadphones = false;

  // Test state
  readonly frequencies = [250, 500, 1000, 2000, 4000];
  readonly ears: ('left' | 'right')[] = ['left', 'right'];
  currentFreqIndex = 0;
  currentEarIndex = 0;
  readonly testVolumeLevel = 2; // Fixed screening level

  isPlayingTone = false;
  isTransitioning = false;
  toneTimeout: any = null;
  transitionTimeout: any = null;
  statusMessage = '';

  responses = new Map<string, boolean>(); // true = heard, false = not heard
  completedSteps = 0;
  totalSteps = 0;

  analysis: any = null;

  // Consultation State
  showConsultation = false;
  isAnalyzing = false;
  consultationData: ConsultationData | null = null;

  // AI Assistant (Chatbot) State
  showAiAssistant = false;
  assistantMessages: { text: string, type: 'bot' | 'user' | 'result', options?: string[] }[] = [];
  currentQuestionIndex = -1;
  userAnswers: Record<string, string> = {};

  readonly questions = [
    {
      id: 'q1',
      text: 'What is your age group?',
      options: ['Under 18', '18 – 40', '41 – 60', '60+']
    },
    {
      id: 'q2',
      text: 'How would you describe your lifestyle?',
      options: ['Office-based', 'Active / Outdoor', 'Mostly at home', 'Social / Frequent meetings']
    },
    {
      id: 'q3',
      text: 'Do you experience difficulty hearing in conversations?',
      options: ['Yes, frequently', 'Sometimes', 'Rarely', 'No']
    },
    {
      id: 'q4',
      text: 'In which situations do you find hearing most difficult?',
      options: ['Phone calls', 'Group conversations', 'Watching TV', 'Noisy environments']
    },
    {
      id: 'q5',
      text: 'Do you often ask people to repeat what they said?',
      options: ['Yes, very often', 'Sometimes', 'Rarely', 'Never']
    },
    {
      id: 'q6',
      text: 'Have you used hearing aids before?',
      options: ['Yes', 'No']
    },
    {
      id: 'q7',
      text: 'What type of hearing aid did you use?',
      options: ['BTE (Behind-The-Ear)', 'RIC (Receiver In Canal)', 'ITE (In-The-Ear)', 'Not sure'],
      condition: (answers: any) => answers['q6'] === 'Yes'
    },
    {
      id: 'q8',
      text: 'What is your preferred budget range?',
      options: ['Budget Range', 'Mid-range (Standard)', 'Premium']
    },
    {
      id: 'q9',
      text: 'Which feature is most important to you?',
      options: ['Bluetooth connectivity', 'Rechargeable battery', 'Noise cancellation', 'Small / invisible design']
    },
    {
      id: 'q10',
      text: 'Which listening environment is most important for you?',
      options: ['Phone Calls', 'Office meetings', 'Watching TV', 'Outdoor conversations']
    }
  ];

  private cdr = inject(ChangeDetectorRef);
  private player = inject(HearingPlayerService);
  private toastr = inject(ToastrService);
  private router = inject(Router);

  constructor() {
    this.totalSteps = this.frequencies.length * this.ears.length;
  }

  ngAfterViewInit(): void {
    this.checkHeadphones();
  }

  ngOnDestroy(): void {
    this.player.dispose();
    if (this.toneTimeout) clearTimeout(this.toneTimeout);
    if (this.transitionTimeout) clearTimeout(this.transitionTimeout);
  }

  async checkHeadphones(): Promise<void> {
    this.hasHeadphones = await this.player.checkHeadphones();
    this.cdr.detectChanges();
  }

  startInstructions(): void {
    this.currentState = 'test';
    this.currentFreqIndex = 0;
    this.currentEarIndex = 0;
    this.responses.clear();
    this.completedSteps = 0;
    this.statusMessage = 'Sit back. Testing Left Ear first.';
    this.cdr.detectChanges();
    setTimeout(() => this.playCurrentTone(), 1500);
  }

  get currentFrequency(): number {
    return this.frequencies[this.currentFreqIndex];
  }

  get currentEar(): 'left' | 'right' {
    return this.ears[this.currentEarIndex];
  }

  get progressPercentage(): number {
    return Math.round((this.completedSteps / this.totalSteps) * 100);
  }

  get frequencyLabel(): string {
    const f = this.currentFrequency;
    return f >= 1000 ? `${f / 1000} kHz` : `${f} Hz`;
  }

  playCurrentTone(): void {
    this.isTransitioning = false;
    this.player.playTone({
      frequency: this.currentFrequency,
      ear: this.currentEar,
      volumeLevel: this.testVolumeLevel,
    });
    this.isPlayingTone = true;
    this.statusMessage = `🔉 Testing ${this.frequencyLabel}...`;
    this.cdr.detectChanges();

    if (this.toneTimeout) clearTimeout(this.toneTimeout);
    this.toneTimeout = setTimeout(() => {
      this.player.stopTone();
      this.isPlayingTone = false;
      this.cdr.detectChanges();
    }, 2000);
  }

  onHeard(): void {
    if (this.isTransitioning) return;
    this.stopAndClear();
    const key = `${this.currentEar}-${this.currentFrequency}`;
    this.responses.set(key, true);
    this.statusMessage = '✅ Recorded. Next...';
    this.cdr.detectChanges();
    setTimeout(() => this.advanceToNext(), 500);
  }

  onNotHeard(): void {
    if (this.isTransitioning) return;
    this.stopAndClear();
    const key = `${this.currentEar}-${this.currentFrequency}`;
    this.responses.set(key, false);
    this.statusMessage = '❌ Recorded. Next...';
    this.cdr.detectChanges();
    setTimeout(() => this.advanceToNext(), 500);
  }

  private stopAndClear(): void {
    this.player.stopTone();
    this.isPlayingTone = false;
    if (this.toneTimeout) clearTimeout(this.toneTimeout);
  }

  private advanceToNext(): void {
    this.completedSteps++;
    if (this.currentFreqIndex < this.frequencies.length - 1) {
      this.currentFreqIndex++;
    } else if (this.currentEarIndex < this.ears.length - 1) {
      this.currentFreqIndex = 0;
      this.currentEarIndex++;
      this.statusMessage = 'Left Ear Done. Testing Right Ear next...';
      this.cdr.detectChanges();
      setTimeout(() => this.playCurrentTone(), 2000);
      return;
    } else {
      this.finishTest();
      return;
    }
    this.isTransitioning = true;
    this.cdr.detectChanges();
    if (this.transitionTimeout) clearTimeout(this.transitionTimeout);
    this.transitionTimeout = setTimeout(() => this.playCurrentTone(), 1000);
  }

  private finishTest(): void {
    const getCategory = (passes: number) => {
      if (passes === 5) return 'Normal';
      if (passes >= 4) return 'Slight Hearing Loss';
      if (passes >= 3) return 'Mild Hearing Loss';
      if (passes >= 1) return 'Moderate Hearing Loss';
      return 'Severe Hearing Loss';
    };

    const leftPasses = this.frequencies.filter(f => this.responses.get(`left-${f}`)).length;
    const rightPasses = this.frequencies.filter(f => this.responses.get(`right-${f}`)).length;

    this.analysis = {
      left: getCategory(leftPasses),
      right: getCategory(rightPasses),
      showDifferenceMessage: Math.abs(leftPasses - rightPasses) >= 2
    };

    this.currentState = 'result';
    this.cdr.detectChanges();
  }

  getConsultation(): void {
    this.isAnalyzing = true;
    this.showConsultation = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.generateAiAdvice();
      this.isAnalyzing = false;
      this.cdr.detectChanges();
    }, 2500);
  }

  private generateAiAdvice(): void {
    const left = (f: number) => this.responses.get(`left-${f}`);
    const right = (f: number) => this.responses.get(`right-${f}`);

    const lowFreq = left(250) && left(500) && right(250) && right(500);
    const speechFreq = left(1000) && left(2000) && right(1000) && right(2000);
    const highFreq = left(4000) && right(4000);

    let advice = '';
    let condition = 'Normal';

    if (lowFreq && speechFreq && highFreq) {
      condition = 'Normal';
      advice = 'Based on your hearing test results, your hearing ability is excellent across all frequencies. Your ears can pick up subtle high-pitched sounds without difficulty.';
    } else if (lowFreq && speechFreq && !highFreq) {
      condition = 'High-Frequency Loss';
      advice = 'Your hearing is generally good for low and speech frequencies, but there is some difficulty detecting higher frequency sounds (4000Hz). This can occasionally affect the clarity of consonants in speech.';
    } else if (lowFreq && !speechFreq) {
      condition = 'Moderate Loss';
      advice = 'Your results show significant difficulty in the speech frequency range (1000Hz - 2000Hz). This may cause frequent misunderstandings in conversation.';
    } else {
      condition = 'Mild to Moderate Loss';
      advice = 'The screening indicates some hearing difficulties across multiple frequencies. We recommend a clinical evaluation to prevent further strain on your auditory system.';
    }

    this.consultationData = {
      condition,
      advice: advice + ' We recommend scheduling a professional hearing evaluation for a precise diagnostic assessment.',
      recommendations: [
        'Book a clinical hearing consultation',
        'Visit our nearest hearing care center',
        'Explore digital hearing aid devices',
        'Speak with our senior audiologist'
      ]
    };
  }

  closeConsultation(): void {
    this.showConsultation = false;
    this.cdr.detectChanges();
  }

  // AI Assistant Logic
  openAssistant(): void {
    this.showAiAssistant = true;
    this.currentQuestionIndex = 0;
    this.userAnswers = {};
    this.assistantMessages = [
      {
        text: `Hello! I'm your Claritone Assistant. To give you the best recommendation, I have a few questions for you.`,
        type: 'bot'
      }
    ];
    this.nextQuestion();
    this.cdr.detectChanges();
  }

  private nextQuestion(): void {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.generateFinalRecommendation();
      return;
    }

    const question = this.questions[this.currentQuestionIndex];

    // Check condition
    if (question.condition && !question.condition(this.userAnswers)) {
      this.currentQuestionIndex++;
      this.nextQuestion();
      return;
    }

    this.assistantMessages.push({
      text: question.text,
      type: 'bot',
      options: question.options
    });
    this.cdr.detectChanges();
  }

  handleAssistantOption(option: string): void {
    this.assistantMessages.push({ text: option, type: 'user' });

    const question = this.questions[this.currentQuestionIndex];
    this.userAnswers[question.id] = option;

    this.currentQuestionIndex++;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.nextQuestion();
    }, 600);
  }

  private generateFinalRecommendation(): void {
    const budget = this.userAnswers['q8'];
    const lifestyle = this.userAnswers['q2'];
    const feature = this.userAnswers['q9'];
    const loss = this.analysis ? this.analysis.left : 'Normal';

    let model = '';
    let description = '';

    if (budget === 'Premium' || feature === 'Noise cancellation' || lifestyle === 'Active / Outdoor') {
      model = 'Phonak Lumity L90-R';
      description = 'A premium hearing aid featuring StereoZoom 2.0 and SpeechSensor technology for exceptional clarity in noisy environments.';
    } else if (budget === 'Budget Range') {
      model = 'Signia Pure Charge&Go T AX';
      description = 'Reliable performance with Augmented Xperience technology, providing up to 36 hours of battery life and integrated telecoil.';
    } else {
      model = 'Oticon Real 1';
      description = 'Features RealSound Technology and Wind & Handling Stabilizer, offering BrainHearing optimization for a natural listening experience.';
    }

    this.assistantMessages.push({
      text: `Based on your lifestyle (${lifestyle}) and results, here is our recommendation:`,
      type: 'bot'
    });

    this.assistantMessages.push({
      text: `✨ Recommended Model: ${model}\n\n${description}`,
      type: 'result'
    });

    this.cdr.detectChanges();
  }

  closeAiAssistant(): void {
    this.showAiAssistant = false;
    this.cdr.detectChanges();
  }

  restartTest(): void {
    this.currentState = 'intro';
    this.responses.clear();
    this.analysis = null;
    this.currentFreqIndex = 0;
    this.currentEarIndex = 0;
    this.completedSteps = 0;
    this.isPlayingTone = false;
    this.isTransitioning = false;
    this.statusMessage = '';
    this.showConsultation = false;
    this.consultationData = null;
    this.showAiAssistant = false;
    this.assistantMessages = [];
    this.cdr.detectChanges();
  }

  closeTest(): void {
    this.router.navigate(['/']);
  }
}
