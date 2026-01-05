/**
 * Procedural Music Engine for Sweeper Bot
 * Generates ambient, Minecraft-style music using Web Audio API
 * 
 * Structure: Intro → Verse → Chorus → Post-Chorus → Verse 2 → Chorus 2 → Post-Chorus → Outro (building) → Loop
 * Total duration: ~4 minutes (240 seconds)
 */

// Musical constants
const TEMPO = 72; // BPM - slow and contemplative
const BEAT_DURATION = 60 / TEMPO; // seconds per beat
const BAR_DURATION = BEAT_DURATION * 4; // 4/4 time

// Scale: D major pentatonic for a warm, cozy feel
const ROOT_FREQ = 146.83; // D3
const SCALE_RATIOS = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2]; // D, E, F#, A, B, D (pentatonic)
const BASS_OCTAVE = 0.5;
const PAD_OCTAVE = 1;
const ARPEGGIO_OCTAVE = 2;
const MELODY_OCTAVE = 2;

// Chord progressions (scale degrees, 0-indexed)
const VERSE_CHORDS = [0, 3, 4, 0]; // I - IV - V - I
const CHORUS_CHORDS = [0, 2, 3, 4]; // I - iii - IV - V
const OUTRO_CHORDS = [0, 3, 0, 3]; // I - IV - I - IV (peaceful resolution)

// Section durations in bars
const SECTION_BARS = {
    intro: 8,
    verse: 16,
    chorus: 16,
    postChorus: 8,
    outro: 16,
};

export class MusicEngine {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private isPlaying = false;
    private currentTime = 0;
    private animationFrame: number | null = null;
    private scheduledEvents: Array<{ time: number; callback: () => void }> = [];
    private activeOscillators: Set<OscillatorNode> = new Set();
    private loopStartTime = 0;
    private volume = 0.7;

    // Calculate total loop duration
    private get loopDuration() {
        const totalBars =
            SECTION_BARS.intro +
            SECTION_BARS.verse +
            SECTION_BARS.chorus +
            SECTION_BARS.postChorus +
            SECTION_BARS.verse + // verse 2
            SECTION_BARS.chorus +
            SECTION_BARS.postChorus +
            SECTION_BARS.outro;
        return totalBars * BAR_DURATION;
    }

    init() {
        if (this.audioContext) return;

        this.audioContext = new AudioContext();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = this.volume * 0.3; // Keep overall volume moderate
        this.masterGain.connect(this.audioContext.destination);
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

        // Resume audio context if suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.isPlaying = true;
        this.loopStartTime = this.audioContext.currentTime;
        this.scheduleFullLoop();
        this.startScheduler();
    }

    stop() {
        this.isPlaying = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        // Stop all active oscillators
        this.activeOscillators.forEach(osc => {
            try {
                osc.stop();
            } catch { }
        });
        this.activeOscillators.clear();
        this.scheduledEvents = [];
    }

    private startScheduler() {
        const schedule = () => {
            if (!this.isPlaying || !this.audioContext) return;

            const currentTime = this.audioContext.currentTime;
            const loopPosition = (currentTime - this.loopStartTime) % this.loopDuration;

            // Check if we need to schedule next loop
            const timeInCurrentLoop = currentTime - this.loopStartTime;
            const loopsCompleted = Math.floor(timeInCurrentLoop / this.loopDuration);
            const nextLoopStart = this.loopStartTime + (loopsCompleted + 1) * this.loopDuration;

            // Schedule next loop 10 seconds before it starts
            if (nextLoopStart - currentTime < 10 && !this.scheduledEvents.some(e => e.time >= nextLoopStart)) {
                this.scheduleLoopAt(nextLoopStart);
            }

            this.animationFrame = requestAnimationFrame(schedule);
        };

        this.animationFrame = requestAnimationFrame(schedule);
    }

    private scheduleFullLoop() {
        this.scheduleLoopAt(this.loopStartTime);
    }

    private scheduleLoopAt(startTime: number) {
        if (!this.audioContext || !this.masterGain) return;

        let currentBar = 0;

        // Intro (8 bars) - soft pad, gentle entrance
        this.scheduleSection(startTime, currentBar, SECTION_BARS.intro, 'intro');
        currentBar += SECTION_BARS.intro;

        // Verse 1 (16 bars) - add bass and slow arpeggios
        this.scheduleSection(startTime, currentBar, SECTION_BARS.verse, 'verse');
        currentBar += SECTION_BARS.verse;

        // Chorus (16 bars) - fuller sound, melody hints
        this.scheduleSection(startTime, currentBar, SECTION_BARS.chorus, 'chorus');
        currentBar += SECTION_BARS.chorus;

        // Post-Chorus (8 bars) - gentle bridge
        this.scheduleSection(startTime, currentBar, SECTION_BARS.postChorus, 'postChorus');
        currentBar += SECTION_BARS.postChorus;

        // Verse 2 (16 bars) - similar to verse but with variation
        this.scheduleSection(startTime, currentBar, SECTION_BARS.verse, 'verse2');
        currentBar += SECTION_BARS.verse;

        // Chorus 2 (16 bars) - fuller with extra layers
        this.scheduleSection(startTime, currentBar, SECTION_BARS.chorus, 'chorus2');
        currentBar += SECTION_BARS.chorus;

        // Post-Chorus 2 (8 bars)
        this.scheduleSection(startTime, currentBar, SECTION_BARS.postChorus, 'postChorus2');
        currentBar += SECTION_BARS.postChorus;

        // Outro (16 bars) - building layers, then fade to loop
        this.scheduleSection(startTime, currentBar, SECTION_BARS.outro, 'outro');
    }

    private scheduleSection(loopStart: number, startBar: number, bars: number, section: string) {
        const sectionStart = loopStart + startBar * BAR_DURATION;

        // Determine which chord progression to use
        const chords = section.includes('outro') ? OUTRO_CHORDS :
            section.includes('chorus') ? CHORUS_CHORDS : VERSE_CHORDS;

        for (let bar = 0; bar < bars; bar++) {
            const barTime = sectionStart + bar * BAR_DURATION;
            const chordIndex = bar % chords.length;
            const scaleDegree = chords[chordIndex];

            // Schedule pad (all sections)
            this.schedulePad(barTime, scaleDegree, section);

            // Schedule bass (verse onwards)
            if (!section.includes('intro')) {
                this.scheduleBass(barTime, scaleDegree, section);
            }

            // Schedule arpeggios (chorus and later)
            if (section.includes('chorus') || section.includes('outro')) {
                this.scheduleArpeggio(barTime, scaleDegree, section);
            }

            // Schedule melody hints (chorus2 and outro)
            if (section === 'chorus2' || section === 'outro') {
                this.scheduleMelody(barTime, scaleDegree, bar, section);
            }

            // Extra layers for outro (building)
            if (section === 'outro' && bar >= 8) {
                this.scheduleExtraLayers(barTime, scaleDegree, bar - 8);
            }
        }
    }

    private getFrequency(scaleDegree: number, octaveMultiplier: number = 1): number {
        const ratio = SCALE_RATIOS[scaleDegree % SCALE_RATIOS.length];
        const octaveAdjust = Math.floor(scaleDegree / SCALE_RATIOS.length);
        return ROOT_FREQ * ratio * Math.pow(2, octaveAdjust) * octaveMultiplier;
    }

    private schedulePad(time: number, scaleDegree: number, section: string) {
        if (!this.audioContext || !this.masterGain) return;

        const freq = this.getFrequency(scaleDegree, PAD_OCTAVE);
        const duration = BAR_DURATION;
        const volume = section.includes('intro') ? 0.15 :
            section.includes('chorus') ? 0.25 : 0.2;

        // Create warm pad with multiple detuned oscillators
        const createPadVoice = (detune: number, type: OscillatorType) => {
            const osc = this.audioContext!.createOscillator();
            const gain = this.audioContext!.createGain();
            const filter = this.audioContext!.createBiquadFilter();

            osc.type = type;
            osc.frequency.value = freq;
            osc.detune.value = detune;

            filter.type = 'lowpass';
            filter.frequency.value = 800;
            filter.Q.value = 0.5;

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(volume * 0.5, time + 0.5);
            gain.gain.setValueAtTime(volume * 0.5, time + duration - 0.5);
            gain.gain.linearRampToValueAtTime(0, time + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain!);

            osc.start(time);
            osc.stop(time + duration + 0.1);
            this.activeOscillators.add(osc);
            osc.onended = () => this.activeOscillators.delete(osc);
        };

        createPadVoice(-8, 'sine');
        createPadVoice(8, 'sine');
        createPadVoice(0, 'triangle');

        // Add fifth for richness
        const fifthFreq = this.getFrequency((scaleDegree + 3) % 5, PAD_OCTAVE);
        const fifthOsc = this.audioContext.createOscillator();
        const fifthGain = this.audioContext.createGain();
        fifthOsc.type = 'sine';
        fifthOsc.frequency.value = fifthFreq;
        fifthGain.gain.setValueAtTime(0, time);
        fifthGain.gain.linearRampToValueAtTime(volume * 0.3, time + 0.5);
        fifthGain.gain.linearRampToValueAtTime(0, time + duration);
        fifthOsc.connect(fifthGain);
        fifthGain.connect(this.masterGain);
        fifthOsc.start(time);
        fifthOsc.stop(time + duration + 0.1);
        this.activeOscillators.add(fifthOsc);
        fifthOsc.onended = () => this.activeOscillators.delete(fifthOsc);
    }

    private scheduleBass(time: number, scaleDegree: number, section: string) {
        if (!this.audioContext || !this.masterGain) return;

        const freq = this.getFrequency(scaleDegree, BASS_OCTAVE);
        const volume = section.includes('chorus') ? 0.35 : 0.25;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.value = freq;

        filter.type = 'lowpass';
        filter.frequency.value = 200;

        // Slow attack for smooth bass
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(volume, time + 0.3);
        gain.gain.setValueAtTime(volume, time + BAR_DURATION - 0.3);
        gain.gain.linearRampToValueAtTime(0, time + BAR_DURATION);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + BAR_DURATION + 0.1);
        this.activeOscillators.add(osc);
        osc.onended = () => this.activeOscillators.delete(osc);
    }

    private scheduleArpeggio(time: number, scaleDegree: number, section: string) {
        if (!this.audioContext || !this.masterGain) return;

        // Arpeggio pattern: root, third, fifth, octave (8th notes)
        const pattern = [0, 2, 3, 5, 3, 2, 0, 2];
        const noteLength = BEAT_DURATION / 2; // 8th notes
        const volume = section === 'chorus2' ? 0.18 : 0.12;

        pattern.forEach((offset, i) => {
            const noteTime = time + i * noteLength;
            const degree = (scaleDegree + offset) % 6;
            const freq = this.getFrequency(degree, ARPEGGIO_OCTAVE);

            const osc = this.audioContext!.createOscillator();
            const gain = this.audioContext!.createGain();
            const filter = this.audioContext!.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.value = freq;

            filter.type = 'lowpass';
            filter.frequency.value = 2000;

            gain.gain.setValueAtTime(0, noteTime);
            gain.gain.linearRampToValueAtTime(volume, noteTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteLength * 0.9);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain!);

            osc.start(noteTime);
            osc.stop(noteTime + noteLength);
            this.activeOscillators.add(osc);
            osc.onended = () => this.activeOscillators.delete(osc);
        });
    }

    private scheduleMelody(time: number, scaleDegree: number, barInSection: number, section: string) {
        if (!this.audioContext || !this.masterGain) return;

        // Simple melodic motifs every 2 bars
        if (barInSection % 2 !== 0) return;

        const motifPatterns = [
            [0, 2, 4, 2],
            [4, 3, 2, 0],
            [2, 4, 5, 4],
            [5, 4, 2, 4],
        ];

        const patternIndex = (barInSection / 2) % motifPatterns.length;
        const pattern = motifPatterns[patternIndex];
        const noteLength = BEAT_DURATION;
        const volume = section === 'outro' ? 0.15 : 0.12;

        pattern.forEach((offset, i) => {
            const noteTime = time + i * noteLength;
            const degree = (scaleDegree + offset) % 6;
            const freq = this.getFrequency(degree, MELODY_OCTAVE);

            const osc = this.audioContext!.createOscillator();
            const gain = this.audioContext!.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, noteTime);
            gain.gain.linearRampToValueAtTime(volume, noteTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteLength * 0.8);

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.start(noteTime);
            osc.stop(noteTime + noteLength);
            this.activeOscillators.add(osc);
            osc.onended = () => this.activeOscillators.delete(osc);
        });
    }

    private scheduleExtraLayers(time: number, scaleDegree: number, barsSinceOutroMid: number) {
        if (!this.audioContext || !this.masterGain) return;

        // Add shimmer layer that builds
        const shimmerVolume = Math.min(0.1, 0.02 * barsSinceOutroMid);
        const freq = this.getFrequency(scaleDegree, ARPEGGIO_OCTAVE * 2);

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.value = freq;

        filter.type = 'highpass';
        filter.frequency.value = 1000;

        // LFO for shimmer
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 4;
        lfoGain.gain.value = shimmerVolume * 0.5;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);

        gain.gain.setValueAtTime(shimmerVolume * 0.5, time);
        gain.gain.linearRampToValueAtTime(shimmerVolume, time + BAR_DURATION / 2);
        gain.gain.linearRampToValueAtTime(0, time + BAR_DURATION);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + BAR_DURATION + 0.1);
        lfo.start(time);
        lfo.stop(time + BAR_DURATION + 0.1);

        this.activeOscillators.add(osc);
        this.activeOscillators.add(lfo);
        osc.onended = () => this.activeOscillators.delete(osc);
        lfo.onended = () => this.activeOscillators.delete(lfo);
    }
}

// Singleton instance
let musicEngineInstance: MusicEngine | null = null;

export const getMusicEngine = (): MusicEngine => {
    if (!musicEngineInstance) {
        musicEngineInstance = new MusicEngine();
    }
    return musicEngineInstance;
};
