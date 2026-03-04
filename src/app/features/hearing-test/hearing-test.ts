import { Component, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface Question {
  id: number;
  text: string;
  options: {
    label: string;
    description: string;
    icon: string;
    value: string;
  }[];
}

interface PersonOption {
  id: string;
  label: string;
  avatar: string;
}

type TestState = 'person-selection' | 'setup' | 'test' | 'lead-form' | 'result';

@Component({
  selector: 'app-hearing-test',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DecimalPipe],
  templateUrl: './hearing-test.html',
  styleUrls: ['./hearing-test.css'],
})
export class HearingTest {
  currentState: any = 'person-selection';
  currentStep = 0;
  answers: { [key: number]: string } = {};
  isTransitioning = false;
  private autoAdvanceTimer: any;

  // Lead Form Data
  leadForm = {
    fullName: '',
    phone: '',
    email: ''
  };

  // Person Selection Options
  personOptions: PersonOption[] = [
    { id: 'me', label: 'Me', avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' },
    { id: 'mom', label: 'Mom', avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135789.png' },
    { id: 'dad', label: 'Dad', avatar: 'https://cdn-icons-png.flaticon.com/512/488/488931.png' },
    { id: 'son', label: 'Son', avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135823.png' },
    { id: 'daughter', label: 'Daughter', avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135755.png' },
    { id: 'grandfather', label: 'Grand Father', avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135708.png' },
    { id: 'grandmother', label: 'Grand Mother', avatar: 'https://cdn-icons-png.flaticon.com/512/4134/4134175.png' },
    { id: 'others', label: 'Others', avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png' }
  ];

  selectedPersonId: string | null = null;

  questions: Question[] = [
    {
      id: 1,
      text: 'How well do you hear in noisy environments?',
      options: [
        { label: 'Perfectly', description: 'I can follow conversations clearly anywhere.', icon: 'sentiment_satisfied', value: 'good' },
        { label: 'With some difficulty', description: 'I often ask people to repeat themselves.', icon: 'sentiment_neutral', value: 'fair' },
        { label: 'Hardly at all', description: 'I find it almost impossible to communicate.', icon: 'sentiment_dissatisfied', value: 'poor' },
      ]
    },
    {
      id: 2,
      text: 'Do you find yourself turning up the TV volume?',
      options: [
        { label: 'Never', description: 'I listen at the same volume as everyone else.', icon: 'volume_up', value: 'good' },
        { label: 'Sometimes', description: 'Others sometimes complain it is too loud.', icon: 'volume_down', value: 'fair' },
        { label: 'Always', description: 'I need it much louder than anyone else.', icon: 'volume_off', value: 'poor' },
      ]
    },
    {
      id: 3,
      text: 'Do you struggle to hear on the phone?',
      options: [
        { label: 'No issues', description: 'I hear clearly on both ears.', icon: 'phone_in_talk', value: 'good' },
        { label: 'Occasionally', description: 'I prefer speakerphone or one specific ear.', icon: 'phone_missed', value: 'fair' },
        { label: 'Frequently', description: 'Talking on the phone is very frustrating.', icon: 'phone_disabled', value: 'poor' },
      ]
    },
    {
      id: 4,
      text: 'Do you experience ringing or buzzing (Tinnitus)?',
      options: [
        { label: 'Never', description: 'Complete silence when it is quiet.', icon: 'notifications_off', value: 'good' },
        { label: 'Sometimes', description: 'I notice it in quiet rooms.', icon: 'notifications_paused', value: 'fair' },
        { label: 'Constantly', description: 'It affects my sleep and concentration.', icon: 'notifications_active', value: 'poor' },
      ]
    },
    {
      id: 5,
      text: 'How often do you ask people to repeat themselves?',
      options: [
        { label: 'Rarely', description: 'Only if they mumble.', icon: 'record_voice_over', value: 'good' },
        { label: 'Sometimes', description: 'Especially women or children.', icon: 'hearing', value: 'fair' },
        { label: 'Very Often', description: 'It is a constant struggle.', icon: 'hearing_disabled', value: 'poor' },
      ]
    }
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private apiService: ApiService
  ) { }

  selectPerson(personId: string) {
    this.selectedPersonId = personId;
    this.isTransitioning = true;
    setTimeout(() => {
      this.currentState = 'setup';
      this.isTransitioning = false;
      this.cdr.detectChanges();
    }, 400);
  }

  startTest() {
    this.currentState = 'test';
    this.currentStep = 0;
    this.answers = {};
    this.cdr.detectChanges();
  }

  selectOption(optionValue: string) {
    if (this.isTransitioning) return;

    this.answers[this.currentStep] = optionValue;
    this.isTransitioning = true;

    if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);

    this.autoAdvanceTimer = setTimeout(() => {
      this.nextStep();
    }, 600);
  }

  nextStep() {
    if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);
    this.isTransitioning = false;

    if (this.currentStep < this.questions.length - 1) {
      this.currentStep++;
    } else {
      this.goToLeadForm();
    }
    this.cdr.detectChanges();
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.isTransitioning = false;
    } else {
      this.currentState = 'setup';
    }
    this.cdr.detectChanges();
  }

  goToLeadForm() {
    this.currentState = 'lead-form';
    this.cdr.detectChanges();
  }

  submitLead() {
    if (this.leadForm.fullName && this.leadForm.phone) {

      // Calculate score (simple logic: 'poor' = 0, 'fair' = 1, 'good' = 2)
      let totalScore = 0;
      const answerMap: any = {};

      Object.keys(this.answers).forEach(step => {
        const val = this.answers[parseInt(step)];
        answerMap[`Question ${parseInt(step) + 1}`] = val; // Store question number -> answer
        if (val === 'good') totalScore += 2;
        else if (val === 'fair') totalScore += 1;
        // poor = 0
      });

      const leadData = {
        fullName: this.leadForm.fullName,
        phone: this.leadForm.phone,
        email: this.leadForm.email,
        score: totalScore,
        answers: answerMap,
        status: 'NEW'
      };

      this.apiService.post('leads', leadData).subscribe({
        next: (res) => {
          console.log('Lead submitted successfully', res);
          this.currentState = 'result';
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to submit lead', err);
          // Fallback for demo
          if (confirm('API call failed. Show results anyway (Demo Mode)?')) {
            this.currentState = 'result';
            this.cdr.detectChanges();
          }
        }
      });
    } else {
      alert('Please fill in your name and phone number.');
    }
  }

  get progressPercentage() {
    return ((this.currentStep + 1) / this.questions.length) * 100;
  }

  get currentQuestion() {
    return this.questions[this.currentStep];
  }

  isOptionSelected(optionValue: string): boolean {
    return this.answers[this.currentStep] === optionValue;
  }
}
