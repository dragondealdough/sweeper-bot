import { useState, useCallback, useRef, useEffect } from 'react';

export type TutorialStep =
  | 'WELCOME_1'
  | 'WELCOME_2'
  | 'WELCOME_3'
  | 'WELCOME_4'
  | 'WELCOME_5'
  | 'ARROW_TO_SHOP'
  | 'SHOP_INTRO_1'
  | 'SHOP_INTRO_2'
  | 'SHOP_INTRO_3'
  | 'SHOP_PICKAXE_BOUGHT'
  | 'SHOP_CLOSE_MENU_1'
  | 'SHOP_CLOSE_MENU_2'
  | 'SHOP_HIGHLIGHT_CLOSE'
  | 'POST_SHOP_1'
  | 'POST_SHOP_2'
  | 'POST_SHOP_CHOICE'
  | 'POST_SHOP_RESPONSE_ROADS'
  | 'POST_SHOP_RESPONSE_ROADS_2'
  | 'POST_SHOP_RESPONSE_ATTRACTIONS'
  | 'POST_SHOP_RESPONSE_ROBOTS'
  | 'POST_SHOP_RESPONSE_ROBOTS_2'
  | 'POST_SHOP_FINAL_1'
  | 'POST_SHOP_FINAL_2'
  | 'ARROW_TO_CONSTRUCTION'
  | 'CONSTRUCTION_INTRO_1'
  | 'CONSTRUCTION_INTRO_2'
  | 'CONSTRUCTION_INTRO_3'
  | 'CONSTRUCTION_INTRO_4'
  | 'CONSTRUCTION_INTRO_5'
  | 'CONSTRUCTION_INTRO_6'
  | 'CONSTRUCTION_HIGHLIGHT_CLOSE'
  | 'ARROW_TO_MINE'
  | 'MINE_INTRO_1'
  | 'MINE_INTRO_2'
  | 'MINE_INTRO_3'
  | 'MINE_INTRO_4'
  | 'MINE_INTRO_5'
  | 'MINE_INTRO_6'
  | 'MINE_INTRO_7'
  | 'MINE_INTRO_8'
  | 'MINE_INTRO_9'
  | 'MINE_HIT_MINE_1'
  | 'MINE_HIT_MINE_2'
  | 'MINE_EXPLAIN_NUMBERS'
  | 'MINE_COLLECT_1'
  | 'MINE_COLLECT_2'
  | 'MINE_COLLECTED'
  | 'MINE_CHARGES_1'
  | 'MINE_CHARGES_2'
  | 'ARROW_TO_RECYCLER'
  | 'RECYCLER_INTRO'
  | 'RECYCLER_PROCESSING'
  | 'RECYCLER_WAIT_1'
  | 'RECYCLER_WAIT_2'
  | 'RECYCLER_WAIT_3'
  | 'MINE_COLLECT_WAIT'  // New waiting step
  | 'COMPLETED';

interface TutorialMessage {
  text: string;
  buttonText: string;
  character?: 'narrator' | 'robot';
  autoAdvance?: number; // ms to auto-advance, undefined means wait for click
}

const TUTORIAL_MESSAGES: Record<TutorialStep, TutorialMessage | null> = {
  WELCOME_1: { text: "Welcome to your new home!", buttonText: "Thanks!", character: 'narrator' },
  WELCOME_2: { text: "This quaint little mining town is the perfect place for a clever little robot such as yourself.", buttonText: "It sure is!", character: 'narrator' },
  WELCOME_3: { text: "But, it is quite a bit lonely isn't it?", buttonText: "Yeah...", character: 'narrator' },
  WELCOME_4: { text: "Let's say hello to some of the townsfolk and see about bringing some more friends into town.", buttonText: "Good idea!", character: 'narrator' },
  WELCOME_5: { text: "First, we should visit the commissary just over there.", buttonText: "On my way!", character: 'narrator' },
  ARROW_TO_SHOP: null, // No message, just arrow
  SHOP_INTRO_1: { text: "Ah, the shopkeeper is away, but you can use this fancy terminal to buy and sell things anyways!", buttonText: "How convenient!", character: 'narrator' },
  SHOP_INTRO_2: { text: "It looks like your lucky day. They are currently giving away free pickaxes!", buttonText: "Wow, really?", character: 'narrator' },
  SHOP_INTRO_3: { text: "I suggest you take a pickaxe before we move on.", buttonText: "Will do!", character: 'narrator' },
  SHOP_PICKAXE_BOUGHT: null,
  SHOP_CLOSE_MENU_1: { text: "Great! I'm sure that pickaxe will open up some new opportunities for you in no time!", buttonText: "I hope so!", character: 'narrator' },
  SHOP_CLOSE_MENU_2: { text: "Time to see what else this town has to offer", buttonText: "Let's go!", character: 'narrator' },
  SHOP_HIGHLIGHT_CLOSE: null, // No message, just highlight close button
  POST_SHOP_1: { text: "Hmm. I think I know why this town is so empty. Let me ask you something...", buttonText: "What is it?", character: 'narrator' },
  POST_SHOP_2: { text: "What brings people to towns like this?", buttonText: "...", character: 'narrator' },
  POST_SHOP_CHOICE: null, // Multiple choice - handled separately
  POST_SHOP_RESPONSE_ROADS: { text: "Ah! Well, yes, technically speaking people could not get here without roads!", buttonText: "Right?", character: 'narrator' },
  POST_SHOP_RESPONSE_ROADS_2: { text: "But I was thinking more along the lines of bringing people here to see some cool things!", buttonText: "Oh!", character: 'narrator' },
  POST_SHOP_RESPONSE_ATTRACTIONS: { text: "Exactly!", buttonText: "Yeah!", character: 'narrator' },
  POST_SHOP_RESPONSE_ROBOTS: { text: "That is very cute! Yes, robots such as yourself are sure to attract people...", buttonText: "Thanks!", character: 'narrator' },
  POST_SHOP_RESPONSE_ROBOTS_2: { text: "But we can give them even more reasons to come here!", buttonText: "True!", character: 'narrator' },
  POST_SHOP_FINAL_1: { text: "Cool things like monuments, artwork, technological marvels...", buttonText: "Sounds great!", character: 'narrator' },
  POST_SHOP_FINAL_2: { text: "We need to build these in order to get this town buzzing!", buttonText: "Let's do it!", character: 'narrator' },
  ARROW_TO_CONSTRUCTION: null, // No message, just arrow
  CONSTRUCTION_INTRO_1: { text: "Head on over to the construction site and let's see what we can build!", buttonText: "On my way!", character: 'narrator' },
  CONSTRUCTION_INTRO_2: { text: "Like any great project, we should begin with the smallest and most achievable goals", buttonText: "Makes sense!", character: 'narrator' },
  CONSTRUCTION_INTRO_3: { text: "I think a nice wishing well is the perfect start. We can even make the first wish once it's built!", buttonText: "Sounds fun!", character: 'narrator' },
  CONSTRUCTION_INTRO_4: { text: "Now of course you can't just conjur up a wishing well out of thin air, can you? You're a robot, not a wizard.", buttonText: "True!", character: 'narrator' },
  CONSTRUCTION_INTRO_5: { text: "What we need is 10 Stone and 4 Silver", buttonText: "Got it!", character: 'narrator' },
  CONSTRUCTION_INTRO_6: { text: "So here comes the fun part, I promise! Let's check out the town's most important feature. Head on over to the mechanism in the middle of the town", buttonText: "Let's go!", character: 'narrator' },
  CONSTRUCTION_HIGHLIGHT_CLOSE: null, // No message, just highlight close button
  ARROW_TO_MINE: null, // No message, just arrow
  MINE_INTRO_1: { text: "Welcome to the mine! You'll be spending a lot of time here, but never forget: time is a valuable resource", buttonText: "Got it!", character: 'narrator' },
  MINE_INTRO_2: { text: "Let me show you how much time we have...", buttonText: "Show me!", character: 'narrator' },
  MINE_INTRO_3: { text: "There, you see the clock is ticking? When you run out of time here, I'll have to come and rescue you", buttonText: "I see it!", character: 'narrator' },
  MINE_INTRO_4: { text: "Unfortunately, as you are the main priority, I won't be able to rescue all of the resources you find here", buttonText: "Oh no...", character: 'narrator' },
  MINE_INTRO_5: { text: "To put this simply: when you are on the brink of exhaustion, you will lose half of all your resources and gold!", buttonText: "That's harsh!", character: 'narrator' },
  MINE_INTRO_6: { text: "You will wake up the next day, and the mine will be completely reset (no, we don't know why)", buttonText: "Weird...", character: 'narrator' },
  MINE_INTRO_7: { text: "But fear not…any progress you made inside the mine is recorded and, in my opinion, THAT is far more valuable than any rocks and gems!", buttonText: "That's good!", character: 'narrator' },
  MINE_INTRO_8: { text: "More on that later, though. For now, I bet you can't wait to smash things down here. Go on, give that pickaxe its first taste of rock.", buttonText: "Let's do it!", character: 'narrator' },
  MINE_INTRO_9: { text: "Highlight a block, and press spacebar to whack it", buttonText: "Got it!", character: 'narrator' },
  MINE_HIT_MINE_1: { text: "Ah! I probably should have warned you about this. There are a lot of explosives hidden in these rocks and it seems you found out the hard way.", buttonText: "Oops!", character: 'narrator' },
  MINE_HIT_MINE_2: { text: "Fear not, it looks like by some kind of miracle all your circuits and bolts are in-tact!", buttonText: "Phew!", character: 'narrator' },
  MINE_EXPLAIN_NUMBERS: { text: "Progress! I bet you've already figured out what those numbers mean. Each number tells you how many mines are hidden in the adjacent tiles (up, down, left, right, and diagonally). Use this information to safely navigate the mine!", buttonText: "Makes sense!", character: 'narrator' },
  MINE_COLLECT_1: { text: "Now, I know you think explosives should be avoided, but did you know they can also be collected and recycled?", buttonText: "Really?", character: 'narrator' },
  MINE_COLLECT_2: { text: "Here's the trick: First, mark the block with Z to plant a red flag. Then, break it open with the pickaxe to safely collect the explosive!", buttonText: "Got it!", character: 'narrator' },
  MINE_COLLECT_WAIT: null, // Hidden step while waiting for collection
  MINE_COLLECTED: { text: "You're a natural! Well, I mean you're programmed to do this but a little compliment never hurt anybody, right?", buttonText: "Thanks!", character: 'narrator' },
  MINE_CHARGES_1: { text: "By the way, see that Disarm Kit display on the left? Each kit gives you 3 charges to safely collect explosives.", buttonText: "I see it!", character: 'narrator' },
  MINE_CHARGES_2: { text: "If you try to collect an explosive without any charges left…well, I think you can guess what happens!", buttonText: "Kaboom!", character: 'narrator' },
  ARROW_TO_RECYCLER: null, // No message, just arrow
  RECYCLER_INTRO: { text: "I'm sure you can figure this part out without my help. Let's process the mine we found!", buttonText: "Let's do it!", character: 'narrator' },
  RECYCLER_PROCESSING: { text: "And there you have it! Soon we will have some valuable metal for trading.", buttonText: "Great!", character: 'narrator' },
  RECYCLER_WAIT_1: { text: "Whilst you wait for the recycler, I recommend exploring the mine and seeing what other treasures are down there!", buttonText: "Sounds fun!", character: 'narrator' },
  RECYCLER_WAIT_2: { text: "But a word of warning: Don't dig so far that you are unable to reach the exit rope. If you do leave yourself stranded then your best bet is to discover as much in the mine as you can.", buttonText: "I'll be careful!", character: 'narrator' },
  RECYCLER_WAIT_3: { text: "There are other ways to prevent yourself from becoming stranded, but I'll leave that for you to discover. See you soon!", buttonText: "See you!", character: 'narrator' },
  COMPLETED: null,
};

const TUTORIAL_SEQUENCE: TutorialStep[] = [
  'WELCOME_1',
  'WELCOME_2',
  'WELCOME_3',
  'WELCOME_4',
  'WELCOME_5',
  'ARROW_TO_SHOP',
];

const SHOP_TUTORIAL_SEQUENCE: TutorialStep[] = [
  'SHOP_INTRO_1',
  'SHOP_INTRO_2',
  'SHOP_INTRO_3',
];

const CONSTRUCTION_TUTORIAL_SEQUENCE: TutorialStep[] = [
  'CONSTRUCTION_INTRO_1',
  'CONSTRUCTION_INTRO_2',
  'CONSTRUCTION_INTRO_3',
  'CONSTRUCTION_INTRO_4',
  'CONSTRUCTION_INTRO_5',
  'CONSTRUCTION_INTRO_6',
];

export interface TutorialState {
  currentStep: TutorialStep;
  isActive: boolean;
  showingMessage: boolean;
  currentMessage: TutorialMessage | null;
  showArrowToShop: boolean;
  showArrowToConstruction: boolean;
  showArrowToMine: boolean;
  showArrowToTimer: boolean;
  showArrowToRecycler: boolean;
  highlightPickaxe: boolean;
  highlightCloseButton: boolean;
  pickaxeTaken: boolean;
  postShopChoice?: 'ROADS' | 'ATTRACTIONS' | 'ROBOTS' | null;
  showingChoice?: boolean;
  hintMessage?: string | null;
  tutorialCompleted?: boolean;
  noMinesToRecycle?: boolean;
  flashTimer?: boolean;
  tutorialMinePosition?: { x: number; y: number } | null;
  requireFlagBeforeMine?: boolean;
  highlightDisarmKit?: boolean;
  // Guided mine flagging states
  foundMinePosition?: { x: number; y: number } | null;
  waitingForFlag?: boolean;
  waitingForDisarm?: boolean;
  taskMinimized?: boolean; // Whether task popup is minimized to HUD
}

export const useTutorial = () => {
  const [tutorialState, setTutorialState] = useState<TutorialState>({
    currentStep: 'WELCOME_1',
    isActive: true,
    showingMessage: false,
    currentMessage: null,
    showArrowToShop: false,
    showArrowToConstruction: false,
    showArrowToMine: false,
    showArrowToTimer: false,
    showArrowToRecycler: false,
    highlightPickaxe: false,
    highlightCloseButton: false,
    pickaxeTaken: false,
    postShopChoice: null,
    showingChoice: false,
    hintMessage: null,
    tutorialCompleted: false,
    noMinesToRecycle: false,
    flashTimer: false,
    tutorialMinePosition: null,
    requireFlagBeforeMine: false,
    highlightDisarmKit: false,
    foundMinePosition: null,
    waitingForFlag: false,
    waitingForDisarm: false,
  });

  const hasStarted = useRef(false);
  const shopTutorialIndex = useRef(0);
  const startTimerCallbackRef = useRef<(() => void) | null>(null);
  const hintTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hint messages for waiting states
  const HINT_MESSAGES: Record<string, string> = {
    'MINE_INTRO_9': '💡 Hint: Select a tile with arrow keys, then press SPACEBAR to mine it!',
    'MINE_COLLECT_WAIT': '💡 Hint: Find a tile you suspect has a mine, press Z to flag it, then SPACEBAR to collect it!',
    'RECYCLER_INTRO': '💡 Hint: Select a mine and press E to start recycling!',
  };

  // Hint timer removed as per user request to avoid annoyance
  useEffect(() => {
    return () => {
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
        hintTimerRef.current = null;
      }
    };
  }, []);

  // Start tutorial on first render
  useEffect(() => {
    if (!hasStarted.current && tutorialState.isActive) {
      hasStarted.current = true;
      const timer = setTimeout(() => {
        // Show first message
        const message = TUTORIAL_MESSAGES['WELCOME_1'];
        if (message) {
          setTutorialState(prev => ({
            ...prev,
            showingMessage: true,
            currentMessage: message,
          }));
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tutorialState.isActive]);

  const advanceTutorial = useCallback(() => {
    setTutorialState(prev => {
      const currentIndex = TUTORIAL_SEQUENCE.indexOf(prev.currentStep);

      if (currentIndex >= 0 && currentIndex < TUTORIAL_SEQUENCE.length - 1) {
        const nextStep = TUTORIAL_SEQUENCE[currentIndex + 1];
        const nextMessage = TUTORIAL_MESSAGES[nextStep];

        return {
          ...prev,
          currentStep: nextStep,
          showingMessage: nextMessage !== null,
          currentMessage: nextMessage,
          showArrowToShop: nextStep === 'ARROW_TO_SHOP',
        };
      } else if (prev.currentStep === 'WELCOME_5') {
        // After last welcome message, show arrow
        return {
          ...prev,
          currentStep: 'ARROW_TO_SHOP',
          showingMessage: false,
          currentMessage: null,
          showArrowToShop: true,
          // isActive should remain true from ...prev
        };
      }

      return { ...prev, showingMessage: false, currentMessage: null };
    });
  }, []);

  const dismissMessage = useCallback(() => {
    setTutorialState(prev => {
      const postShopSteps: TutorialStep[] = ['POST_SHOP_1', 'POST_SHOP_2', 'POST_SHOP_RESPONSE_ROADS',
        'POST_SHOP_RESPONSE_ROADS_2', 'POST_SHOP_RESPONSE_ATTRACTIONS',
        'POST_SHOP_RESPONSE_ROBOTS', 'POST_SHOP_RESPONSE_ROBOTS_2',
        'POST_SHOP_FINAL_1', 'POST_SHOP_FINAL_2'];

      // Prevent dismissal if waiting for guided flagging actions
      if (prev.waitingForFlag || prev.waitingForDisarm) {
        return prev;
      }

      if (postShopSteps.includes(prev.currentStep)) {
        // Handle post-shop tutorial advancement
        if (prev.currentStep === 'POST_SHOP_1') {
          const postShopMessage2 = TUTORIAL_MESSAGES['POST_SHOP_2'];
          return {
            ...prev,
            currentStep: 'POST_SHOP_2',
            showingMessage: true,
            currentMessage: postShopMessage2,
          };
        }

        if (prev.currentStep === 'POST_SHOP_2') {
          return {
            ...prev,
            currentStep: 'POST_SHOP_CHOICE',
            showingMessage: false,
            currentMessage: null,
            showingChoice: true,
          };
        }

        if (prev.currentStep === 'POST_SHOP_RESPONSE_ROADS') {
          const response2 = TUTORIAL_MESSAGES['POST_SHOP_RESPONSE_ROADS_2'];
          return {
            ...prev,
            currentStep: 'POST_SHOP_RESPONSE_ROADS_2',
            showingMessage: true,
            currentMessage: response2,
          };
        }

        if (prev.currentStep === 'POST_SHOP_RESPONSE_ROADS_2' ||
          prev.currentStep === 'POST_SHOP_RESPONSE_ATTRACTIONS' ||
          prev.currentStep === 'POST_SHOP_RESPONSE_ROBOTS_2') {
          const final1 = TUTORIAL_MESSAGES['POST_SHOP_FINAL_1'];
          return {
            ...prev,
            currentStep: 'POST_SHOP_FINAL_1',
            showingMessage: true,
            currentMessage: final1,
          };
        }

        if (prev.currentStep === 'POST_SHOP_RESPONSE_ROBOTS') {
          const response2 = TUTORIAL_MESSAGES['POST_SHOP_RESPONSE_ROBOTS_2'];
          return {
            ...prev,
            currentStep: 'POST_SHOP_RESPONSE_ROBOTS_2',
            showingMessage: true,
            currentMessage: response2,
          };
        }

        if (prev.currentStep === 'POST_SHOP_FINAL_1') {
          const final2 = TUTORIAL_MESSAGES['POST_SHOP_FINAL_2'];
          return {
            ...prev,
            currentStep: 'POST_SHOP_FINAL_2',
            showingMessage: true,
            currentMessage: final2,
          };
        }

        if (prev.currentStep === 'POST_SHOP_FINAL_2') {
          // Show first construction message and arrow
          const constructionIntro1 = TUTORIAL_MESSAGES['CONSTRUCTION_INTRO_1'];
          return {
            ...prev,
            currentStep: 'CONSTRUCTION_INTRO_1',
            showingMessage: true,
            currentMessage: constructionIntro1,
            showArrowToConstruction: true,
          };
        }
      }

      // Handle shop tutorial steps (close menu sequence)
      if (prev.currentStep === 'SHOP_CLOSE_MENU_1') {
        const closeMenuMessage2 = TUTORIAL_MESSAGES['SHOP_CLOSE_MENU_2'];
        return {
          ...prev,
          currentStep: 'SHOP_CLOSE_MENU_2',
          showingMessage: true,
          currentMessage: closeMenuMessage2,
        };
      }

      if (prev.currentStep === 'SHOP_CLOSE_MENU_2') {
        // After second close menu message, highlight close button
        return {
          ...prev,
          currentStep: 'SHOP_HIGHLIGHT_CLOSE',
          showingMessage: false,
          currentMessage: null,
          highlightCloseButton: true,
        };
      }

      if (prev.currentStep === 'SHOP_HIGHLIGHT_CLOSE') {
        // After close button is used, start post-shop tutorial
        const postShopMessage1 = TUTORIAL_MESSAGES['POST_SHOP_1'];
        return {
          ...prev,
          currentStep: 'POST_SHOP_1',
          showingMessage: true,
          currentMessage: postShopMessage1,
          highlightCloseButton: false,
        };
      }

      // Handle construction tutorial steps
      // CONSTRUCTION_INTRO_1 is special - when dismissed, just hide the message but keep the step (arrow stays visible)
      if (prev.currentStep === 'CONSTRUCTION_INTRO_1') {
        return {
          ...prev,
          showingMessage: false,
          currentMessage: null,
          // Keep showArrowToConstruction: true (preserved via ...prev)
        };
      }

      const constructionSteps: TutorialStep[] = ['CONSTRUCTION_INTRO_2',
        'CONSTRUCTION_INTRO_3', 'CONSTRUCTION_INTRO_4',
        'CONSTRUCTION_INTRO_5', 'CONSTRUCTION_INTRO_6'];

      if (constructionSteps.includes(prev.currentStep)) {
        const currentIndex = CONSTRUCTION_TUTORIAL_SEQUENCE.indexOf(prev.currentStep);

        if (currentIndex >= 0 && currentIndex < CONSTRUCTION_TUTORIAL_SEQUENCE.length - 1) {
          const nextStep = CONSTRUCTION_TUTORIAL_SEQUENCE[currentIndex + 1];
          const nextMessage = TUTORIAL_MESSAGES[nextStep];

          return {
            ...prev,
            currentStep: nextStep,
            showingMessage: nextMessage !== null,
            currentMessage: nextMessage,
          };
        } else if (prev.currentStep === 'CONSTRUCTION_INTRO_6') {
          // After last construction message, highlight close button
          return {
            ...prev,
            currentStep: 'CONSTRUCTION_HIGHLIGHT_CLOSE',
            showingMessage: false,
            currentMessage: null,
            highlightCloseButton: true,
          };
        }
      }

      // Handle mine tutorial steps
      const mineSteps: TutorialStep[] = ['MINE_INTRO_1', 'MINE_INTRO_2', 'MINE_INTRO_3', 'MINE_INTRO_4',
        'MINE_INTRO_5', 'MINE_INTRO_6', 'MINE_INTRO_7', 'MINE_INTRO_8', 'MINE_INTRO_9',
        'MINE_HIT_MINE_1', 'MINE_HIT_MINE_2', 'MINE_EXPLAIN_NUMBERS',
        'MINE_COLLECT_1', 'MINE_COLLECT_2', 'MINE_COLLECT_WAIT', 'MINE_COLLECTED',
        'MINE_CHARGES_1', 'MINE_CHARGES_2',
        'ARROW_TO_RECYCLER', 'RECYCLER_INTRO', 'RECYCLER_PROCESSING',
        'RECYCLER_WAIT_1', 'RECYCLER_WAIT_2', 'RECYCLER_WAIT_3'];

      if (mineSteps.includes(prev.currentStep)) {
        if (prev.currentStep === 'MINE_INTRO_1') {
          const mineIntro2 = TUTORIAL_MESSAGES['MINE_INTRO_2'];
          // Trigger timer when transitioning to MINE_INTRO_2
          if (startTimerCallbackRef.current) {
            startTimerCallbackRef.current();
          }
          return {
            ...prev,
            currentStep: 'MINE_INTRO_2',
            showingMessage: true,
            currentMessage: mineIntro2,
          };
        }

        if (prev.currentStep === 'MINE_INTRO_2') {
          // Show arrow to timer and flash the timer
          const mineIntro3 = TUTORIAL_MESSAGES['MINE_INTRO_3'];
          return {
            ...prev,
            currentStep: 'MINE_INTRO_3',
            showingMessage: true,
            currentMessage: mineIntro3,
            showArrowToTimer: true,
            flashTimer: true,
          };
        }

        if (prev.currentStep === 'MINE_INTRO_3') {
          // Hide arrow to timer and stop flashing after this message
          const mineIntro4 = TUTORIAL_MESSAGES['MINE_INTRO_4'];
          return {
            ...prev,
            currentStep: 'MINE_INTRO_4',
            showingMessage: true,
            currentMessage: mineIntro4,
            showArrowToTimer: false,
            flashTimer: false,
          };
        }

        if (prev.currentStep === 'MINE_INTRO_4') {
          const mineIntro5 = TUTORIAL_MESSAGES['MINE_INTRO_5'];
          return {
            ...prev,
            currentStep: 'MINE_INTRO_5',
            showingMessage: true,
            currentMessage: mineIntro5,
          };
        }

        if (prev.currentStep === 'MINE_INTRO_5') {
          const mineIntro6 = TUTORIAL_MESSAGES['MINE_INTRO_6'];
          return {
            ...prev,
            currentStep: 'MINE_INTRO_6',
            showingMessage: true,
            currentMessage: mineIntro6,
          };
        }

        if (prev.currentStep === 'MINE_INTRO_6') {
          const mineIntro7 = TUTORIAL_MESSAGES['MINE_INTRO_7'];
          return {
            ...prev,
            currentStep: 'MINE_INTRO_7',
            showingMessage: true,
            currentMessage: mineIntro7,
          };
        }

        if (prev.currentStep === 'MINE_INTRO_7') {
          const mineIntro8 = TUTORIAL_MESSAGES['MINE_INTRO_8'];
          return {
            ...prev,
            currentStep: 'MINE_INTRO_8',
            showingMessage: true,
            currentMessage: mineIntro8,
          };
        }

        if (prev.currentStep === 'MINE_INTRO_8') {
          const mineIntro9 = TUTORIAL_MESSAGES['MINE_INTRO_9'];
          return {
            ...prev,
            currentStep: 'MINE_INTRO_9',
            showingMessage: true,
            currentMessage: mineIntro9,
          };
        }

        if (prev.currentStep === 'MINE_INTRO_9') {
          // Keep the dialogue visible - just remove the button so it can't be skipped
          // The message will stay on screen until player mines a block
          return prev; // Do nothing - keep current state with message showing
        }

        if (prev.currentStep === 'MINE_HIT_MINE_1') {
          const mineHit2 = TUTORIAL_MESSAGES['MINE_HIT_MINE_2'];
          return {
            ...prev,
            currentStep: 'MINE_HIT_MINE_2',
            showingMessage: true,
            currentMessage: mineHit2,
          };
        }

        if (prev.currentStep === 'MINE_HIT_MINE_2') {
          const explainNumbers = TUTORIAL_MESSAGES['MINE_EXPLAIN_NUMBERS'];
          return {
            ...prev,
            currentStep: 'MINE_EXPLAIN_NUMBERS',
            showingMessage: true,
            currentMessage: explainNumbers,
          };
        }

        if (prev.currentStep === 'MINE_EXPLAIN_NUMBERS') {
          // Continue to mine collection tutorial
          const mineCollect1 = TUTORIAL_MESSAGES['MINE_COLLECT_1'];
          return {
            ...prev,
            currentStep: 'MINE_COLLECT_1',
            showingMessage: true,
            currentMessage: mineCollect1,
          };
        }

        if (prev.currentStep === 'MINE_COLLECT_1') {
          const mineCollect2 = TUTORIAL_MESSAGES['MINE_COLLECT_2'];
          return {
            ...prev,
            currentStep: 'MINE_COLLECT_2',
            showingMessage: true,
            currentMessage: mineCollect2,
          };
        }

        if (prev.currentStep === 'MINE_COLLECT_2') {
          // Keep the dialogue visible - it can't be skipped until player collects a mine
          return prev; // Do nothing - keep current state with message showing
        }

        if (prev.currentStep === 'MINE_COLLECT_WAIT') {
          // Keep waiting until mined
          return prev;
        }

        if (prev.currentStep === 'MINE_COLLECTED') {
          const mineCharges1 = TUTORIAL_MESSAGES['MINE_CHARGES_1'];
          return {
            ...prev,
            currentStep: 'MINE_CHARGES_1',
            showingMessage: true,
            currentMessage: mineCharges1,
            highlightDisarmKit: true,
          };
        }

        if (prev.currentStep === 'MINE_CHARGES_1') {
          const mineCharges2 = TUTORIAL_MESSAGES['MINE_CHARGES_2'];
          return {
            ...prev,
            currentStep: 'MINE_CHARGES_2',
            showingMessage: true,
            currentMessage: mineCharges2,
            highlightDisarmKit: true,
          };
        }

        if (prev.currentStep === 'MINE_CHARGES_2') {
          // Guide player to recycler
          return {
            ...prev,
            currentStep: 'ARROW_TO_RECYCLER',
            showingMessage: false,
            currentMessage: null,
            showArrowToRecycler: true,
            highlightDisarmKit: false,
          };
        }

        if (prev.currentStep === 'RECYCLER_INTRO') {
          // Wait for player to start processing
          return {
            ...prev,
            showingMessage: false,
            currentMessage: null,
          };
        }

        if (prev.currentStep === 'RECYCLER_PROCESSING') {
          const recyclerWait1 = TUTORIAL_MESSAGES['RECYCLER_WAIT_1'];
          return {
            ...prev,
            currentStep: 'RECYCLER_WAIT_1',
            showingMessage: true,
            currentMessage: recyclerWait1,
          };
        }

        if (prev.currentStep === 'RECYCLER_WAIT_1') {
          const recyclerWait2 = TUTORIAL_MESSAGES['RECYCLER_WAIT_2'];
          return {
            ...prev,
            currentStep: 'RECYCLER_WAIT_2',
            showingMessage: true,
            currentMessage: recyclerWait2,
          };
        }

        if (prev.currentStep === 'RECYCLER_WAIT_2') {
          const recyclerWait3 = TUTORIAL_MESSAGES['RECYCLER_WAIT_3'];
          return {
            ...prev,
            currentStep: 'RECYCLER_WAIT_3',
            showingMessage: true,
            currentMessage: recyclerWait3,
          };
        }

        if (prev.currentStep === 'RECYCLER_WAIT_3') {
          // Tutorial complete
          return {
            ...prev,
            currentStep: 'COMPLETED',
            isActive: false,
            showingMessage: false,
            currentMessage: null,
            showArrowToRecycler: false,
          };
        }
      }

      // Not a post-shop step, use regular tutorial advancement
      const currentIndex = TUTORIAL_SEQUENCE.indexOf(prev.currentStep);

      if (currentIndex >= 0 && currentIndex < TUTORIAL_SEQUENCE.length - 1) {
        const nextStep = TUTORIAL_SEQUENCE[currentIndex + 1];
        const nextMessage = TUTORIAL_MESSAGES[nextStep];

        return {
          ...prev,
          currentStep: nextStep,
          showingMessage: nextMessage !== null,
          currentMessage: nextMessage,
          showArrowToShop: nextStep === 'ARROW_TO_SHOP',
        };
      } else if (prev.currentStep === 'WELCOME_5') {
        return {
          ...prev,
          currentStep: 'ARROW_TO_SHOP',
          showingMessage: false,
          currentMessage: null,
          showArrowToShop: true,
          // isActive should remain true from ...prev
        };
      }

      return { ...prev, showingMessage: false, currentMessage: null };
    });
  }, []);

  // Called when shop is opened
  const onShopOpened = useCallback(() => {
    setTutorialState(prev => {
      // Don't show tutorial if pickaxe already taken or tutorial not active
      if (prev.pickaxeTaken || !prev.isActive) {
        return prev;
      }

      // Start shop tutorial if we're at or past the arrow step
      if (prev.currentStep === 'ARROW_TO_SHOP' || prev.currentStep === 'WELCOME_5') {
        shopTutorialIndex.current = 0;
        const firstShopStep = SHOP_TUTORIAL_SEQUENCE[0];
        const message = TUTORIAL_MESSAGES[firstShopStep];
        return {
          ...prev,
          currentStep: firstShopStep,
          showingMessage: true,
          currentMessage: message,
          showArrowToShop: false,
        };
      }

      // If we're already in shop tutorial, only re-show message if it's not already dismissed
      // Don't re-show if we've already advanced past SHOP_INTRO_3 (messages should stop)
      if (prev.currentStep === 'SHOP_INTRO_1' || prev.currentStep === 'SHOP_INTRO_2' || prev.currentStep === 'SHOP_INTRO_3') {
        // Only re-show if we're currently showing a message (shop was closed and reopened mid-tutorial)
        // If showingMessage is false, it means we've dismissed it and should stay dismissed
        if (prev.showingMessage) {
          const currentIndex = SHOP_TUTORIAL_SEQUENCE.indexOf(prev.currentStep);
          if (currentIndex >= 0) {
            shopTutorialIndex.current = currentIndex;
            const message = TUTORIAL_MESSAGES[prev.currentStep];
            return {
              ...prev,
              showingMessage: true,
              currentMessage: message,
            };
          }
        }
        // If message was dismissed, don't re-show it
        return prev;
      }

      // If we're waiting for pickaxe to be taken, on close menu steps, or post-shop tutorial, don't do anything
      const postShopSteps: TutorialStep[] = ['POST_SHOP_1', 'POST_SHOP_2', 'POST_SHOP_CHOICE',
        'POST_SHOP_RESPONSE_ROADS', 'POST_SHOP_RESPONSE_ROADS_2', 'POST_SHOP_RESPONSE_ATTRACTIONS',
        'POST_SHOP_RESPONSE_ROBOTS', 'POST_SHOP_RESPONSE_ROBOTS_2', 'POST_SHOP_FINAL_1', 'POST_SHOP_FINAL_2'];

      if (prev.currentStep === 'SHOP_PICKAXE_BOUGHT' ||
        prev.currentStep === 'SHOP_CLOSE_MENU_1' ||
        prev.currentStep === 'SHOP_CLOSE_MENU_2' ||
        prev.currentStep === 'SHOP_HIGHLIGHT_CLOSE' ||
        postShopSteps.includes(prev.currentStep)) {
        return prev;
      }

      return prev;
    });
  }, []);

  const advanceShopTutorial = useCallback(() => {
    setTutorialState(prev => {
      // Handle close menu message sequence
      if (prev.currentStep === 'SHOP_CLOSE_MENU_1') {
        // After first close menu message, show second one
        const closeMenuMessage2 = TUTORIAL_MESSAGES['SHOP_CLOSE_MENU_2'];
        return {
          ...prev,
          currentStep: 'SHOP_CLOSE_MENU_2',
          showingMessage: true,
          currentMessage: closeMenuMessage2,
        };
      }

      if (prev.currentStep === 'SHOP_CLOSE_MENU_2') {
        // After second close menu message, highlight close button
        return {
          ...prev,
          currentStep: 'SHOP_HIGHLIGHT_CLOSE',
          showingMessage: false,
          currentMessage: null,
          highlightCloseButton: true,
        };
      }

      if (prev.currentStep === 'SHOP_HIGHLIGHT_CLOSE') {
        // After close button is used, start post-shop tutorial
        const postShopMessage1 = TUTORIAL_MESSAGES['POST_SHOP_1'];
        return {
          ...prev,
          currentStep: 'POST_SHOP_1',
          showingMessage: true,
          currentMessage: postShopMessage1,
          highlightCloseButton: false,
        };
      }

      shopTutorialIndex.current += 1;

      if (shopTutorialIndex.current < SHOP_TUTORIAL_SEQUENCE.length) {
        const nextStep = SHOP_TUTORIAL_SEQUENCE[shopTutorialIndex.current];
        const message = TUTORIAL_MESSAGES[nextStep];
        return {
          ...prev,
          currentStep: nextStep,
          showingMessage: message !== null,
          currentMessage: message,
          highlightPickaxe: false,
        };
      } else {
        // After all shop intro messages (including SHOP_INTRO_3), stop showing messages and highlight pickaxe
        // Set step to SHOP_PICKAXE_BOUGHT to indicate we're waiting for pickaxe to be taken
        return {
          ...prev,
          currentStep: 'SHOP_PICKAXE_BOUGHT',
          showingMessage: false,
          currentMessage: null,
          highlightPickaxe: true,
        };
      }
    });
  }, []);

  const onPickaxeTaken = useCallback(() => {
    setTutorialState(prev => {
      const closeMenuMessage1 = TUTORIAL_MESSAGES['SHOP_CLOSE_MENU_1'];
      return {
        ...prev,
        currentStep: 'SHOP_CLOSE_MENU_1',
        pickaxeTaken: true,
        highlightPickaxe: false,
        highlightCloseButton: false,
        showingMessage: true,
        currentMessage: closeMenuMessage1,
      };
    });
  }, []);

  const completeTutorial = useCallback(() => {
    setTutorialState(prev => ({
      ...prev,
      currentStep: 'COMPLETED',
      isActive: false,
      showingMessage: false,
      currentMessage: null,
      showArrowToShop: false,
      showArrowToConstruction: false,
      showArrowToMine: false,
      showArrowToTimer: false,
      showArrowToRecycler: false,
      highlightPickaxe: false,
      highlightCloseButton: false,
      postShopChoice: null,
      showingChoice: false,
    }));
  }, []);

  const skipTutorial = useCallback((givePickaxe?: () => void) => {
    setTutorialState({
      currentStep: 'COMPLETED',
      isActive: false,
      showingMessage: false,
      currentMessage: null,
      showArrowToShop: false,
      showArrowToConstruction: false,
      showArrowToMine: false,
      showArrowToTimer: false,
      showArrowToRecycler: false,
      highlightPickaxe: false,
      highlightCloseButton: false,
      pickaxeTaken: true, // Mark as taken so free pickaxe doesn't show
      postShopChoice: null,
      showingChoice: false,
    });
    // Also give the player the pickaxe if callback provided
    if (givePickaxe) givePickaxe();
  }, []);

  const advancePostShopTutorial = useCallback(() => {
    setTutorialState(prev => {
      if (prev.currentStep === 'POST_SHOP_1') {
        // After first message, show second
        const postShopMessage2 = TUTORIAL_MESSAGES['POST_SHOP_2'];
        return {
          ...prev,
          currentStep: 'POST_SHOP_2',
          showingMessage: true,
          currentMessage: postShopMessage2,
        };
      }

      if (prev.currentStep === 'POST_SHOP_2') {
        // After second message, show choice
        return {
          ...prev,
          currentStep: 'POST_SHOP_CHOICE',
          showingMessage: false,
          currentMessage: null,
          showingChoice: true,
        };
      }

      // Handle responses based on choice
      if (prev.currentStep === 'POST_SHOP_RESPONSE_ROADS') {
        const response2 = TUTORIAL_MESSAGES['POST_SHOP_RESPONSE_ROADS_2'];
        return {
          ...prev,
          currentStep: 'POST_SHOP_RESPONSE_ROADS_2',
          showingMessage: true,
          currentMessage: response2,
        };
      }

      if (prev.currentStep === 'POST_SHOP_RESPONSE_ROADS_2' ||
        prev.currentStep === 'POST_SHOP_RESPONSE_ATTRACTIONS' ||
        prev.currentStep === 'POST_SHOP_RESPONSE_ROBOTS_2') {
        // All paths lead to final messages
        const final1 = TUTORIAL_MESSAGES['POST_SHOP_FINAL_1'];
        return {
          ...prev,
          currentStep: 'POST_SHOP_FINAL_1',
          showingMessage: true,
          currentMessage: final1,
        };
      }

      if (prev.currentStep === 'POST_SHOP_RESPONSE_ROBOTS') {
        const response2 = TUTORIAL_MESSAGES['POST_SHOP_RESPONSE_ROBOTS_2'];
        return {
          ...prev,
          currentStep: 'POST_SHOP_RESPONSE_ROBOTS_2',
          showingMessage: true,
          currentMessage: response2,
        };
      }

      if (prev.currentStep === 'POST_SHOP_FINAL_1') {
        const final2 = TUTORIAL_MESSAGES['POST_SHOP_FINAL_2'];
        return {
          ...prev,
          currentStep: 'POST_SHOP_FINAL_2',
          showingMessage: true,
          currentMessage: final2,
        };
      }

      if (prev.currentStep === 'POST_SHOP_FINAL_2') {
        // Complete tutorial
        return {
          ...prev,
          currentStep: 'COMPLETED',
          isActive: false,
          showingMessage: false,
          currentMessage: null,
        };
      }

      return prev;
    });
  }, []);

  const selectPostShopChoice = useCallback((choice: 'ROADS' | 'ATTRACTIONS' | 'ROBOTS') => {
    setTutorialState(prev => {
      let nextStep: TutorialStep;
      let message: TutorialMessage | null;

      if (choice === 'ROADS') {
        nextStep = 'POST_SHOP_RESPONSE_ROADS';
        message = TUTORIAL_MESSAGES['POST_SHOP_RESPONSE_ROADS'];
      } else if (choice === 'ATTRACTIONS') {
        nextStep = 'POST_SHOP_RESPONSE_ATTRACTIONS';
        message = TUTORIAL_MESSAGES['POST_SHOP_RESPONSE_ATTRACTIONS'];
      } else {
        nextStep = 'POST_SHOP_RESPONSE_ROBOTS';
        message = TUTORIAL_MESSAGES['POST_SHOP_RESPONSE_ROBOTS'];
      }

      return {
        ...prev,
        currentStep: nextStep,
        showingMessage: true,
        currentMessage: message,
        showingChoice: false,
        postShopChoice: choice,
      };
    });
  }, []);

  const onConstructionOpened = useCallback(() => {
    setTutorialState(prev => {
      // Don't show tutorial if not active or already past construction
      if (!prev.isActive) {
        return prev;
      }

      // If we're at ARROW_TO_CONSTRUCTION or CONSTRUCTION_INTRO_1, advance to CONSTRUCTION_INTRO_2
      if (prev.currentStep === 'ARROW_TO_CONSTRUCTION' || prev.currentStep === 'CONSTRUCTION_INTRO_1') {
        const constructionIntro2 = TUTORIAL_MESSAGES['CONSTRUCTION_INTRO_2'];
        return {
          ...prev,
          currentStep: 'CONSTRUCTION_INTRO_2',
          showingMessage: true,
          currentMessage: constructionIntro2,
          showArrowToConstruction: false, // Hide arrow once inside
        };
      }

      // If we're at CONSTRUCTION_HIGHLIGHT_CLOSE, re-enable the highlight
      if (prev.currentStep === 'CONSTRUCTION_HIGHLIGHT_CLOSE') {
        return {
          ...prev,
          highlightCloseButton: true,
          showArrowToConstruction: false, // Hide arrow once inside
        };
      }

      // If we're already in construction tutorial (CONSTRUCTION_INTRO_2 or later), always re-show the current message
      if (CONSTRUCTION_TUTORIAL_SEQUENCE.includes(prev.currentStep)) {
        const currentIndex = CONSTRUCTION_TUTORIAL_SEQUENCE.indexOf(prev.currentStep);
        if (currentIndex >= 0) {
          const message = TUTORIAL_MESSAGES[prev.currentStep];
          return {
            ...prev,
            showingMessage: true,
            currentMessage: message,
            showArrowToConstruction: false, // Hide arrow once inside
          };
        }
      }

      return prev;
    });
  }, []);

  const onConstructionClosed = useCallback(() => {
    setTutorialState(prev => {
      // If we're at CONSTRUCTION_HIGHLIGHT_CLOSE, show the arrow to the mine
      if (prev.currentStep === 'CONSTRUCTION_HIGHLIGHT_CLOSE') {
        return {
          ...prev,
          currentStep: 'ARROW_TO_MINE',
          showingMessage: false,
          currentMessage: null,
          showArrowToMine: true,
          highlightCloseButton: false,
        };
      }
      return prev;
    });
  }, []);

  const onMineEntered = useCallback((startTimer: () => void) => {
    // Store the timer callback to call it when MINE_INTRO_2 is reached
    startTimerCallbackRef.current = startTimer;
    setTutorialState(prev => {
      // Only trigger if we're at ARROW_TO_MINE step and haven't started mine tutorial yet
      if (prev.currentStep === 'ARROW_TO_MINE' && !prev.showingMessage) {
        const mineIntro1 = TUTORIAL_MESSAGES['MINE_INTRO_1'];
        return {
          ...prev,
          currentStep: 'MINE_INTRO_1',
          showingMessage: true,
          currentMessage: mineIntro1,
          showArrowToMine: false,
        };
      }
      return prev;
    });
  }, []);

  const onMineHit = useCallback(() => {
    setTutorialState(prev => {
      // If we're in the mine tutorial sequence and hit a mine, show special dialogue
      const mineSteps: TutorialStep[] = ['MINE_INTRO_1', 'MINE_INTRO_2', 'MINE_INTRO_3', 'MINE_INTRO_4',
        'MINE_INTRO_5', 'MINE_INTRO_6', 'MINE_INTRO_7', 'MINE_INTRO_8', 'MINE_INTRO_9'];
      if (mineSteps.includes(prev.currentStep)) {
        const mineHit1 = TUTORIAL_MESSAGES['MINE_HIT_MINE_1'];
        return {
          ...prev,
          currentStep: 'MINE_HIT_MINE_1',
          showingMessage: true,
          currentMessage: mineHit1,
        };
      }
      return prev;
    });
  }, []);

  const onTileRevealed = useCallback(() => {
    setTutorialState(prev => {
      // If we're at MINE_INTRO_9 and successfully revealed a tile, show number explanation
      if (prev.currentStep === 'MINE_INTRO_9') {
        const explainNumbers = TUTORIAL_MESSAGES['MINE_EXPLAIN_NUMBERS'];
        return {
          ...prev,
          currentStep: 'MINE_EXPLAIN_NUMBERS',
          showingMessage: true,
          currentMessage: explainNumbers,
          hintMessage: null, // Clear task hint
        };
      }
      return prev;
    });
  }, []);

  const onMineCollected = useCallback(() => {
    setTutorialState(prev => {
      // If we're at MINE_COLLECT_WAIT (or MINE_COLLECT_2) and a mine was collected, show success message
      if (prev.currentStep === 'MINE_COLLECT_WAIT' || prev.currentStep === 'MINE_COLLECT_2') {
        const mineCollected = TUTORIAL_MESSAGES['MINE_COLLECTED'];
        return {
          ...prev,
          currentStep: 'MINE_COLLECTED',
          showingMessage: true,
          currentMessage: mineCollected,
          hintMessage: null, // Clear task hint
          // Clear guided states
          foundMinePosition: null,
          waitingForFlag: false,
          waitingForDisarm: false,
        };
      }
      return prev;
    });
  }, []);

  const onRecyclerOpened = useCallback(() => {
    setTutorialState(prev => {
      // If we're at ARROW_TO_RECYCLER and recycler is opened, show intro message
      if (prev.currentStep === 'ARROW_TO_RECYCLER') {
        const recyclerIntro = TUTORIAL_MESSAGES['RECYCLER_INTRO'];
        return {
          ...prev,
          currentStep: 'RECYCLER_INTRO',
          showingMessage: true,
          currentMessage: recyclerIntro,
          showArrowToRecycler: false,
        };
      }
      return prev;
    });
  }, []);

  const onRecyclingStarted = useCallback(() => {
    setTutorialState(prev => {
      // If we're at RECYCLER_INTRO and recycling started, show processing message
      if (prev.currentStep === 'RECYCLER_INTRO') {
        const recyclerProcessing = TUTORIAL_MESSAGES['RECYCLER_PROCESSING'];
        return {
          ...prev,
          currentStep: 'RECYCLER_PROCESSING',
          showingMessage: true,
          currentMessage: recyclerProcessing,
          hintMessage: null, // Clear hint when action taken
        };
      }
      return prev;
    });
  }, []);

  // Dismiss hint message (called on any player action or after timeout)
  const dismissHint = useCallback(() => {
    setTutorialState(prev => ({
      ...prev,
      hintMessage: null,
    }));
  }, []);

  // Toggle task popup minimized state
  const toggleTaskMinimized = useCallback(() => {
    setTutorialState(prev => ({
      ...prev,
      taskMinimized: !prev.taskMinimized,
    }));
  }, []);

  // Set task minimized state directly
  const setTaskMinimized = useCallback((minimized: boolean) => {
    setTutorialState(prev => ({
      ...prev,
      taskMinimized: minimized,
    }));
  }, []);

  // Called when player returns to overworld during mine tutorial
  const onPlayerReturnedToOverworld = useCallback(() => {
    setTutorialState(prev => {
      // If we're in mine tutorial steps, re-show arrow to mine
      const mineSteps: TutorialStep[] = [
        'MINE_INTRO_1', 'MINE_INTRO_2', 'MINE_INTRO_3', 'MINE_INTRO_4',
        'MINE_INTRO_5', 'MINE_INTRO_6', 'MINE_INTRO_7', 'MINE_INTRO_8', 'MINE_INTRO_9',
        'MINE_HIT_MINE_1', 'MINE_HIT_MINE_2', 'MINE_EXPLAIN_NUMBERS',
        'MINE_COLLECT_1', 'MINE_COLLECT_2', 'MINE_COLLECTED',
        'MINE_CHARGES_1', 'MINE_CHARGES_2'
      ];

      if (mineSteps.includes(prev.currentStep) && prev.isActive) {
        return {
          ...prev,
          showArrowToMine: true,
          showingMessage: false,
          currentMessage: null,
          hintMessage: null,
        };
      }
      return prev;
    });
  }, []);

  // Check if player has mines to recycle (called when recycler opens)
  const checkRecyclerMines = useCallback((defusedMines: number) => {
    setTutorialState(prev => {
      if (prev.currentStep === 'RECYCLER_INTRO' || prev.currentStep === 'ARROW_TO_RECYCLER') {
        return {
          ...prev,
          noMinesToRecycle: defusedMines === 0,
        };
      }
      return prev;
    });
  }, []);

  // Dev tool: Skip to a specific tutorial phase
  const skipToTutorialPhase = useCallback((phase: 'commissary' | 'construction' | 'mine' | 'recycler' | 'complete') => {
    setTutorialState(prev => {
      const baseState = {
        ...prev,
        showingMessage: false,
        currentMessage: null,
        showArrowToShop: false,
        showArrowToConstruction: false,
        showArrowToMine: false,
        showArrowToTimer: false,
        showArrowToRecycler: false,
        highlightPickaxe: false,
        highlightCloseButton: false,
        flashTimer: false,
        highlightDisarmKit: false,
        hintMessage: null,
      };

      switch (phase) {
        case 'commissary':
          return {
            ...baseState,
            currentStep: 'ARROW_TO_SHOP' as TutorialStep,
            isActive: true,
            showArrowToShop: true,
          };
        case 'construction':
          return {
            ...baseState,
            currentStep: 'ARROW_TO_CONSTRUCTION' as TutorialStep,
            isActive: true,
            showArrowToConstruction: true,
            pickaxeTaken: true,
          };
        case 'mine':
          return {
            ...baseState,
            currentStep: 'ARROW_TO_MINE' as TutorialStep,
            isActive: true,
            showArrowToMine: true,
            pickaxeTaken: true,
          };
        case 'recycler':
          return {
            ...baseState,
            currentStep: 'ARROW_TO_RECYCLER' as TutorialStep,
            isActive: true,
            showArrowToRecycler: true,
            pickaxeTaken: true,
          };
        case 'complete':
          return {
            ...baseState,
            currentStep: 'COMPLETED' as TutorialStep,
            isActive: false,
            tutorialCompleted: true,
            pickaxeTaken: true,
          };
        default:
          return prev;
      }
    });
  }, []);

  // Called when player tries to mine a tile with an explosive during MINE_COLLECT_2
  // This intercepts the attempt and shows the flag prompt
  const onMineAttemptInterrupt = useCallback((x: number, y: number) => {
    setTutorialState(prev => {
      if (prev.currentStep !== 'MINE_COLLECT_2' || prev.waitingForFlag || prev.waitingForDisarm) {
        return prev;
      }
      return {
        ...prev,
        showingMessage: true,
        currentMessage: {
          text: "Wait! I have a sneaking suspicion there's an explosive inside that one! Why don't you go ahead and flag it with Z?",
          buttonText: "Flagging it...",
          character: 'narrator' as const,
        },
        foundMinePosition: { x, y },
        waitingForFlag: true,
        waitingForDisarm: false,
      };
    });
  }, []);

  // Called when player flags a tile during the guided flagging sequence
  const onTileFlagged = useCallback((x: number, y: number) => {
    setTutorialState(prev => {
      // Check if this is the tile we're waiting for them to flag
      if (!prev.waitingForFlag || !prev.foundMinePosition) return prev;
      if (prev.foundMinePosition.x !== x || prev.foundMinePosition.y !== y) return prev;

      return {
        ...prev,
        showingMessage: true,
        currentMessage: {
          text: "Perfect! Now let's disarm the flagged explosive with spacebar.",
          buttonText: "Mining it...",
          character: 'narrator' as const,
        },
        waitingForFlag: false,
        waitingForDisarm: true,
      };
    });
  }, []);

  return {
    tutorialState,
    dismissMessage,
    advanceShopTutorial,
    advancePostShopTutorial,
    selectPostShopChoice,
    onShopOpened,
    onConstructionOpened,
    onConstructionClosed,
    onMineEntered,
    onMineHit,
    onTileRevealed,
    onMineCollected,
    onRecyclerOpened,
    onRecyclingStarted,
    onPickaxeTaken,
    completeTutorial,
    skipTutorial,
    dismissHint,
    toggleTaskMinimized,
    setTaskMinimized,
    onPlayerReturnedToOverworld,
    checkRecyclerMines,
    skipToTutorialPhase,
    onMineAttemptInterrupt,
    onTileFlagged,
  };
};

