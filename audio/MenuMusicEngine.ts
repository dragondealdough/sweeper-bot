/**
 * Menu Music Engine for Sweeper Bot
 * Generates melodic, uplifting ambient music for the main menu
 * Features a light, rhythmic melody without heavy bass
 */

// Musical constants - moderate tempo with good rhythm
const TEMPO = 84; // BPM - lively but relaxed
const BEAT_DURATION = 60 / TEMPO;
const BAR_DURATION = BEAT_DURATION * 4;

// Scale: C major for bright, uplifting feel
const ROOT_FREQ = 261.63; // C4 (middle C) - higher, lighter register
const SCALE_RATIOS = [1, 9 / 8, 5 / 4, 4 / 3, 3 / 2, 5 / 3, 15 / 8, 2]; // C major scale

// Melodic patterns (scale degrees)
const MELODY_A = [0, 2, 4, 2, 0, -1, 0, 2]; // Hopeful ascending phrase
const MELODY_B = [4, 2, 0, 2, 4, 5, 4, 2]; // Playful variation
const MELODY_C = [7, 5, 4, 2, 4, 5, 7, 5]; // Higher register
const MELODY_D = [0, 4, 7, 4, 5, 4, 2, 0]; // Resolution phrase

export class MenuMusicEngine {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private reverbGain: GainNode | null = null;
    private isPlaying = false;
    private loopStartTime = 0;
    private animationFrame: number | null = null;
    private activeOscillators: Set<OscillatorNode> = new Set();
    private volume = 0.7;
    private scheduledLoops = new Set<number>();

    // 32 bar loop (~90 seconds at 84 BPM)
    private readonly LOOP_BARS = 32;
    private get loopDuration() {
        return this.LOOP_BARS * BAR_DURATION;
    }

    init() {
        if (this.audioContext) return;

        this.audioContext = new AudioContext();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = this.volume * 0.3;

        // Light reverb
        this.reverbGain = this.audioContext.createGain();
        this.reverbGain.gain.value = 0.25;
        this.createReverb();

        this.masterGain.connect(this.audioContext.destination);
    }

    private createReverb() {
        if (!this.audioContext || !this.masterGain) return;

        const delay = this.audioContext.createDelay(0.5);
        const feedback = this.audioContext.createGain();
        const wetGain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        delay.delayTime.value = 0.08;
        feedback.gain.value = 0.2;
        wetGain.gain.value = 0.3;
        filter.type = 'lowpass';
        filter.frequency.value = 3000;

        this.reverbGain!.connect(delay);
        delay.connect(filter);
        filter.connect(feedback);
        feedback.connect(delay);
        delay.connect(wetGain);
        wetGain.connect(this.masterGain!);
    }

    setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume / 100));
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(this.volume * 0.3, this.audioContext!.currentTime, 0.1);
        }
    }

    start() {
        if (this.isPlaying) return;

        this.init();
        if (!this.audioContext || !this.masterGain) return;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.isPlaying = true;
        this.loopStartTime = this.audioContext.currentTime;
        this.scheduledLoops.clear();
        this.scheduleLoop(this.loopStartTime);
        this.startScheduler();
    }

    stop() {
        this.isPlaying = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        if (this.masterGain && this.audioContext) {
            this.masterGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.3);
        }

        setTimeout(() => {
            this.activeOscillators.forEach(osc => {
                try { osc.stop(); } catch { }
            });
            this.activeOscillators.clear();
            this.scheduledLoops.clear();
        }, 600);
    }

    private startScheduler() {
        const schedule = () => {
            if (!this.isPlaying || !this.audioContext) return;

            const currentTime = this.audioContext.currentTime;
            const timeInLoop = currentTime - this.loopStartTime;
            const loopsCompleted = Math.floor(timeInLoop / this.loopDuration);
            const nextLoopStart = this.loopStartTime + (loopsCompleted + 1) * this.loopDuration;

            if (nextLoopStart - currentTime < 5 && !this.scheduledLoops.has(loopsCompleted + 1)) {
                this.scheduledLoops.add(loopsCompleted + 1);
                this.scheduleLoop(nextLoopStart);
            }

            this.animationFrame = requestAnimationFrame(schedule);
        };

        this.animationFrame = requestAnimationFrame(schedule);
    }

    private scheduleLoop(startTime: number) {
        if (!this.audioContext || !this.masterGain) return;

        for (let bar = 0; bar < this.LOOP_BARS; bar++) {
            const barTime = startTime + bar * BAR_DURATION;
            const section = this.getSection(bar);

            // Light pad harmony (no heavy bass)
            this.scheduleLightPad(barTime, bar, section);

            // Rhythmic pulse (gentle rhythm)
            this.scheduleRhythmicPulse(barTime, bar, section);

            // Main melody
            this.scheduleMelody(barTime, bar, section);

            // Counter melody (chorus and outro)
            if (section === 'chorus' || section === 'outro') {
                this.scheduleCounterMelody(barTime, bar, section);
            }

            // Sparkle decorations
            if (section !== 'intro') {
                this.scheduleSparkles(barTime, bar, section);
            }
        }
    }

    private getSection(bar: number): 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' {
        if (bar < 4) return 'intro';
        if (bar < 12) return 'verse';
        if (bar < 20) return 'chorus';
        if (bar < 24) return 'bridge';
        return 'outro';
    }

    private getFrequency(degree: number, octave: number = 1): number {
        // Handle negative degrees
        let adjustedDegree = degree;
        let octaveAdjust = 0;
        while (adjustedDegree < 0) {
            adjustedDegree += 7;
            octaveAdjust -= 1;
        }
        const ratio = SCALE_RATIOS[adjustedDegree % 7];
        octaveAdjust += Math.floor(adjustedDegree / 7);
        return ROOT_FREQ * ratio * Math.pow(2, octaveAdjust) * octave;
    }

    private scheduleLightPad(time: number, bar: number, section: string) {
        if (!this.audioContext || !this.masterGain || !this.reverbGain) return;

        // Lighter chord progression in higher register: I - V - vi - IV
        const chordRoots = [0, 4, 5, 3];
        const chordRoot = chordRoots[bar % 4];
        const volume = section === 'intro' ? 0.06 : section === 'chorus' ? 0.1 : 0.08;

        // Play chord tones in higher register (no bass)
        [0, 2, 4].forEach((interval, i) => {
            const freq = this.getFrequency(chordRoot + interval, 1); // Octave 1 (middle register)

            const osc = this.audioContext!.createOscillator();
            const gain = this.audioContext!.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(volume * (i === 0 ? 1 : 0.6), time + 0.3);
            gain.gain.setValueAtTime(volume * (i === 0 ? 1 : 0.6), time + BAR_DURATION - 0.3);
            gain.gain.linearRampToValueAtTime(0, time + BAR_DURATION);

            osc.connect(gain);
            gain.connect(this.masterGain!);
            gain.connect(this.reverbGain!);

            osc.start(time);
            osc.stop(time + BAR_DURATION + 0.1);
            this.activeOscillators.add(osc);
            osc.onended = () => this.activeOscillators.delete(osc);
        });
    }

    private scheduleRhythmicPulse(time: number, bar: number, section: string) {
        if (!this.audioContext || !this.masterGain) return;

        // Gentle rhythmic pattern - 8th notes with accents
        const pattern = [1, 0.3, 0.6, 0.3, 0.8, 0.3, 0.5, 0.4]; // Volume multipliers
        const noteLength = BEAT_DURATION / 2; // 8th notes
        const baseVolume = section === 'chorus' ? 0.05 : section === 'intro' ? 0.02 : 0.04;

        const chordRoots = [0, 4, 5, 3];
        const chordRoot = chordRoots[bar % 4];

        pattern.forEach((accent, i) => {
            const noteTime = time + i * noteLength;
            const freq = this.getFrequency(chordRoot, 2); // Higher octave for brightness

            const osc = this.audioContext!.createOscillator();
            const gain = this.audioContext!.createGain();

            osc.type = 'triangle';
            osc.frequency.value = freq;

            const vol = baseVolume * accent;
            gain.gain.setValueAtTime(0, noteTime);
            gain.gain.linearRampToValueAtTime(vol, noteTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteLength * 0.7);

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.start(noteTime);
            osc.stop(noteTime + noteLength);
            this.activeOscillators.add(osc);
            osc.onended = () => this.activeOscillators.delete(osc);
        });
    }

    private scheduleMelody(time: number, bar: number, section: string) {
        if (!this.audioContext || !this.masterGain || !this.reverbGain) return;

        // Select melody pattern based on bar position
        let melody: number[];
        const barInPhrase = bar % 8;
        if (barInPhrase < 2) melody = MELODY_A;
        else if (barInPhrase < 4) melody = MELODY_B;
        else if (barInPhrase < 6) melody = MELODY_C;
        else melody = MELODY_D;

        const noteLength = BEAT_DURATION / 2; // 8th notes for rhythm
        const volume = section === 'intro' ? 0.08 : section === 'chorus' ? 0.14 : 0.11;

        melody.forEach((degree, i) => {
            const noteTime = time + i * noteLength;
            const freq = this.getFrequency(degree, 1);

            const osc = this.audioContext!.createOscillator();
            const gain = this.audioContext!.createGain();
            const filter = this.audioContext!.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.value = freq;

            filter.type = 'lowpass';
            filter.frequency.value = 2500;

            // Staccato-ish attack for rhythm, slightly longer sustain
            gain.gain.setValueAtTime(0, noteTime);
            gain.gain.linearRampToValueAtTime(volume, noteTime + 0.02);
            gain.gain.setValueAtTime(volume * 0.8, noteTime + noteLength * 0.3);
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteLength * 0.9);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain!);
            gain.connect(this.reverbGain!);

            osc.start(noteTime);
            osc.stop(noteTime + noteLength);
            this.activeOscillators.add(osc);
            osc.onended = () => this.activeOscillators.delete(osc);
        });
    }

    private scheduleCounterMelody(time: number, bar: number, section: string) {
        if (!this.audioContext || !this.masterGain || !this.reverbGain) return;

        // Simple counter melody - longer notes, offset rhythm
        const counterNotes = [7, 5, 4, 2]; // Descending from high
        const noteLength = BEAT_DURATION; // Quarter notes
        const volume = section === 'outro' ? 0.09 : 0.07;

        counterNotes.forEach((degree, i) => {
            const noteTime = time + i * noteLength + BEAT_DURATION / 4; // Offset by 8th note
            const freq = this.getFrequency(degree, 1.5); // Higher register

            const osc = this.audioContext!.createOscillator();
            const gain = this.audioContext!.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, noteTime);
            gain.gain.linearRampToValueAtTime(volume, noteTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteLength * 0.85);

            osc.connect(gain);
            gain.connect(this.masterGain!);
            gain.connect(this.reverbGain!);

            osc.start(noteTime);
            osc.stop(noteTime + noteLength);
            this.activeOscillators.add(osc);
            osc.onended = () => this.activeOscillators.delete(osc);
        });
    }

    private scheduleSparkles(time: number, bar: number, section: string) {
        if (!this.audioContext || !this.masterGain) return;

        // Random high sparkle notes for magic/mystery
        const numSparkles = section === 'chorus' ? 3 : 2;
        const volume = 0.04;

        for (let i = 0; i < numSparkles; i++) {
            const noteTime = time + Math.random() * BAR_DURATION * 0.9;
            const degree = Math.floor(Math.random() * 5) + 7; // High scale degrees
            const freq = this.getFrequency(degree, 2);

            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, noteTime);
            gain.gain.linearRampToValueAtTime(volume, noteTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.start(noteTime);
            osc.stop(noteTime + 0.4);
            this.activeOscillators.add(osc);
            osc.onended = () => this.activeOscillators.delete(osc);
        }
    }
}

// Singleton instance
let menuMusicEngineInstance: MenuMusicEngine | null = null;

export const getMenuMusicEngine = (): MenuMusicEngine => {
    if (!menuMusicEngineInstance) {
        menuMusicEngineInstance = new MenuMusicEngine();
    }
    return menuMusicEngineInstance;
};
