import { Injectable } from '@angular/core';

export interface ToneConfig {
    frequency: number;
    ear: 'left' | 'right';
    volumeLevel: number; // 0-7, where 0 is loudest
}

@Injectable({ providedIn: 'root' })
export class HearingPlayerService {
    private audioContext: AudioContext | null = null;
    private oscillator: OscillatorNode | null = null;
    private gainNode: GainNode | null = null;
    private pannerNode: StereoPannerNode | null = null;
    private isPlaying = false;

    // Volume levels from loud to soft
    readonly volumeLevels: number[] = [60, 45, 30, 20]; // Screening levels
    private readonly gainValues: number[] = [0.4, 0.15, 0.05, 0.015];

    readonly frequencies: number[] = [250, 500, 1000, 2000, 4000];

    async checkHeadphones(): Promise<boolean> {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            return true; // Fallback if not supported
        }
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            // Check for output devices that are likely headphones
            return devices.some(device =>
                device.kind === 'audiooutput' &&
                (device.label.toLowerCase().includes('headphone') ||
                    device.label.toLowerCase().includes('headset') ||
                    device.label.toLowerCase().includes('earbuds'))
            );
        } catch (e) {
            return true;
        }
    }

    private ensureContext(): AudioContext {
        if (!this.audioContext || this.audioContext.state === 'closed') {
            this.audioContext = new AudioContext();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        return this.audioContext;
    }

    playTone(config: ToneConfig): void {
        this.stopTone();

        const ctx = this.ensureContext();

        this.oscillator = ctx.createOscillator();
        this.gainNode = ctx.createGain();
        this.pannerNode = ctx.createStereoPanner();

        this.oscillator.type = 'sine';
        this.oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);

        // Set stereo pan: -1 for left, +1 for right
        this.pannerNode.pan.setValueAtTime(config.ear === 'left' ? -1 : 1, ctx.currentTime);

        // Get gain for volume level
        const gain = this.gainValues[Math.min(config.volumeLevel, this.gainValues.length - 1)];

        // Smooth ramp to avoid clicks
        this.gainNode.gain.setValueAtTime(0, ctx.currentTime);
        this.gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.05);

        // Connect: oscillator → gain → panner → destination
        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.pannerNode);
        this.pannerNode.connect(ctx.destination);

        this.oscillator.start(ctx.currentTime);
        this.isPlaying = true;
    }

    stopTone(): void {
        if (this.oscillator && this.isPlaying) {
            try {
                if (this.gainNode && this.audioContext) {
                    this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.05);
                }
                setTimeout(() => {
                    try {
                        this.oscillator?.stop();
                        this.oscillator?.disconnect();
                        this.gainNode?.disconnect();
                        this.pannerNode?.disconnect();
                    } catch (e) { /* already stopped */ }
                    this.oscillator = null;
                    this.gainNode = null;
                    this.pannerNode = null;
                }, 60);
            } catch (e) { /* ignore */ }
        }
        this.isPlaying = false;
    }

    getDbForLevel(level: number): number {
        return this.volumeLevels[Math.min(level, this.volumeLevels.length - 1)];
    }

    get playing(): boolean {
        return this.isPlaying;
    }

    dispose(): void {
        this.stopTone();
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}
