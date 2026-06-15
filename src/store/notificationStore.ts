import { create } from 'zustand';

// Mock VAPID key
const VAPID_PUBLIC_KEY = "BIk1jQkFv3H8a1Yj_MkxT5r9yP9A-M6A9Z8oZQ0v";

interface NotificationState {
  pushPermissionGranted: boolean;
  globalVibeNotificationsEnabled: boolean;
  likesNotificationsEnabled: boolean;
  likesMilestonesOnly: boolean;
  commentsNotificationsEnabled: boolean;
  repliesNotificationsEnabled: boolean;
  blazeRunRemindersEnabled: boolean;
  blazeRunReminderTime: string; // HH:mm format
  pulseRewardsEnabled: boolean;
  languageMatchNotificationsEnabled: boolean;
  creatorNotificationPrefs: Record<string, boolean>; // map of username -> enabled (true/false)
  inAppNotifications: any[];
  pulseToasts: any[];
  batchedVibes: Record<string, any[]>;
  batchedLikes: Record<string, any[]>;
  batchedComments: Record<string, any[]>;
  toggleGlobalVibeNotifications: (enabled: boolean) => void;
  toggleLikesNotifications: (enabled: boolean) => void;
  toggleLikesMilestonesOnly: (enabled: boolean) => void;
  toggleCommentsNotifications: (enabled: boolean) => void;
  toggleRepliesNotifications: (enabled: boolean) => void;
  toggleBlazeRunReminders: (enabled: boolean) => void;
  setBlazeRunReminderTime: (time: string) => void;
  togglePulseRewards: (enabled: boolean) => void;
  toggleLanguageMatchNotifications: (enabled: boolean) => void;
  toggleCreatorNotifications: (username: string, enabled: boolean) => void;
  requestPushPermission: () => Promise<void>;
  addInAppNotification: (notif: any) => void;
  addPulseToast: (toast: any) => void;
  removePulseToast: (id: string) => void;
  clearBatchedVibes: (creatorId: string) => void;
  clearBatchedLikes: (vibeId: string) => void;
  clearBatchedComments: (vibeId: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  pushPermissionGranted: localStorage.getItem("skrimchat_push_granted") === 'true',
  globalVibeNotificationsEnabled: localStorage.getItem("skrimchat_global_notifs") !== 'false',
  likesNotificationsEnabled: localStorage.getItem("skrimchat_likes_notifs") !== 'false',
  likesMilestonesOnly: localStorage.getItem("skrimchat_likes_milestones") === 'true',
  commentsNotificationsEnabled: localStorage.getItem("skrimchat_comments_notifs") !== 'false',
  repliesNotificationsEnabled: localStorage.getItem("skrimchat_replies_notifs") !== 'false',
  blazeRunRemindersEnabled: localStorage.getItem("skrimchat_blaze_notifs") !== 'false',
  blazeRunReminderTime: localStorage.getItem("skrimchat_blaze_time") || '19:00',
  pulseRewardsEnabled: localStorage.getItem("skrimchat_pulse_notifs") !== 'false',
  languageMatchNotificationsEnabled: localStorage.getItem("skrimchat_lang_notifs") !== 'false',
  creatorNotificationPrefs: JSON.parse(localStorage.getItem("skrimchat_creator_notifs") || '{}'),
  inAppNotifications: JSON.parse(localStorage.getItem("skrimchat_inapp_notifs") || '[]'),
  pulseToasts: [],
  batchedVibes: {}, // runtime memory only for batching
  batchedLikes: {}, // runtime memory only for batching likes
  batchedComments: {}, // runtime memory only for batching comments
  
  toggleGlobalVibeNotifications: (enabled) => {
    localStorage.setItem("skrimchat_global_notifs", String(enabled));
    set({ globalVibeNotificationsEnabled: enabled });
  },

  toggleLikesNotifications: (enabled) => {
    localStorage.setItem("skrimchat_likes_notifs", String(enabled));
    set({ likesNotificationsEnabled: enabled });
  },

  toggleLikesMilestonesOnly: (enabled) => {
    localStorage.setItem("skrimchat_likes_milestones", String(enabled));
    set({ likesMilestonesOnly: enabled });
  },

  toggleCommentsNotifications: (enabled) => {
    localStorage.setItem("skrimchat_comments_notifs", String(enabled));
    set({ commentsNotificationsEnabled: enabled });
  },

  toggleRepliesNotifications: (enabled) => {
    localStorage.setItem("skrimchat_replies_notifs", String(enabled));
    set({ repliesNotificationsEnabled: enabled });
  },

  toggleBlazeRunReminders: (enabled) => {
    localStorage.setItem("skrimchat_blaze_notifs", String(enabled));
    set({ blazeRunRemindersEnabled: enabled });
  },

  setBlazeRunReminderTime: (time) => {
    localStorage.setItem("skrimchat_blaze_time", time);
    set({ blazeRunReminderTime: time });
  },

  togglePulseRewards: (enabled) => {
    localStorage.setItem("skrimchat_pulse_notifs", String(enabled));
    set({ pulseRewardsEnabled: enabled });
  },

  toggleLanguageMatchNotifications: (enabled) => {
    localStorage.setItem("skrimchat_lang_notifs", String(enabled));
    set({ languageMatchNotificationsEnabled: enabled });
  },
  
  toggleCreatorNotifications: (username, enabled) => {
    const prefs = { ...get().creatorNotificationPrefs, [username]: enabled };
    localStorage.setItem("skrimchat_creator_notifs", JSON.stringify(prefs));
    set({ creatorNotificationPrefs: prefs });
  },

  requestPushPermission: async () => {
    if (!('Notification' in window)) return;
    
    // Only request if not already granted or denied
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem("skrimchat_push_granted", 'true');
        set({ pushPermissionGranted: true });
        
        if ('serviceWorker' in navigator) {
             const reg = await navigator.serviceWorker.ready;
             try {
                const sub = await reg.pushManager.subscribe({
                   userVisibleOnly: true,
                   applicationServerKey: "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
                });
                console.log("Mock saved push subscription:", sub);
             } catch (e) {
                console.error("Push subscription failed", e);
             }
        }
      }
    } else if (Notification.permission === 'granted') {
       set({ pushPermissionGranted: true });
    }
  },
  
  addInAppNotification: (notif) => {
    const list = [notif, ...get().inAppNotifications].slice(0, 50); // keep last 50
    localStorage.setItem("skrimchat_inapp_notifs", JSON.stringify(list));
    set({ inAppNotifications: list });
  },

  addPulseToast: (toast) => {
    set(state => ({ pulseToasts: [...state.pulseToasts, toast] }));
    setTimeout(() => {
      set(state => ({ pulseToasts: state.pulseToasts.filter((t: any) => t.id !== toast.id) }));
    }, 3000);
  },

  removePulseToast: (id) => {
    set(state => ({ pulseToasts: state.pulseToasts.filter((t: any) => t.id !== id) }));
  },
  
  clearBatchedVibes: (creatorId) => {
    set(state => {
      const newBatches = { ...state.batchedVibes };
      delete newBatches[creatorId];
      return { batchedVibes: newBatches };
    });
  },

  clearBatchedLikes: (vibeId) => {
    set(state => {
      const newBatches = { ...state.batchedLikes };
      delete newBatches[vibeId];
      return { batchedLikes: newBatches };
    });
  },

  clearBatchedComments: (vibeId) => {
    set(state => {
      const newBatches = { ...state.batchedComments };
      delete newBatches[vibeId];
      return { batchedComments: newBatches };
    });
  }
}));

// Mock service to trigger a new vibe post from a creator you follow
export const simulateCreatorPost = (creator: any, vibe: any) => {
  const store = useNotificationStore.getState();
  
  // Checking user control logic
  const isGlobalEnabled = store.globalVibeNotificationsEnabled;
  const isCreatorSpecificallyDisabled = store.creatorNotificationPrefs[creator.username] === false;
  
  if (!isGlobalEnabled || isCreatorSpecificallyDisabled) {
     return; // skip notification
  }
  
  // Batching logic
  const currentBatches = { ...store.batchedVibes };
  if (!currentBatches[creator.id]) {
      currentBatches[creator.id] = [];
  }
  currentBatches[creator.id].push(vibe);
  useNotificationStore.setState({ batchedVibes: currentBatches });
  
  // Wait 5 minutes to batch (we will use 5 seconds for the mock to be visible to user)
  setTimeout(() => {
    const stateAfterWait = useNotificationStore.getState();
    const batch = stateAfterWait.batchedVibes[creator.id];
    
    if (batch && batch.length > 0) {
       sendNotification(creator, batch);
       stateAfterWait.clearBatchedVibes(creator.id);
    }
  }, 5000); // 5 seconds for mockup, technically 5 minutes (300000ms)
};

const sendNotification = async (creator: any, vibes: any[]) => {
  const store = useNotificationStore.getState();
  
  let title = "";
  let body = "";
  let image = vibes[0].thumbnail || vibes[0].videoImageHover || "https://picsum.photos/200/200";
  let singleVibeId = vibes[0].id;


  
  if (vibes.length === 1) {
    const vibe = vibes[0];
    title = `${creator.displayName} posted a new vibe! \uD83D\uDD25`;
    body = vibe.caption && vibe.caption.length > 60 ? vibe.caption.substring(0, 60) + "..." : (vibe.caption || "Check it out!");
  } else {
    title = `${creator.displayName} posted ${vibes.length} new vibes! \uD83D\uDD25`;
    body = `Check out their latest uploads!`;
  }
  
  // 1. Send push if granted
  if (store.pushPermissionGranted && 'serviceWorker' in navigator) {
     try {
       const reg = await navigator.serviceWorker.ready;
       reg.showNotification(title, {
          body,
          icon: creator.avatar,
          image,
          badge: "/skrimchat-badge.png",
          tag: `new-vibe-${creator.id}`,
          data: {
             type: "new_vibe",
             vibeId: singleVibeId,
             creatorId: creator.id,
             url: `/vibes?id=${singleVibeId}`
          },
          actions: [
            { action: "watch", title: "Watch Now \u25B6\uFE0F" },
            { action: "dismiss", title: "Later" }
          ]
       } as NotificationOptions & { image?: string });
     } catch (e) {
       console.error("SW push error", e);
     }
  }
  
  // 2. Add In-App notification
  store.addInAppNotification({
     id: `notif_${Date.now()}`,
     type: 'new_vibe',
     title,
     body,
     creatorName: creator.displayName,
     creatorAvatar: creator.avatar,
     thumbnail: image,
     vibeId: singleVibeId,
     timestamp: Date.now(),
     read: false
  });
};

// Mock service to trigger a like on a user's vibe
export const simulateVibeComment = (commenter: any, comment: any, vibe: any, isReply: boolean, originalCommenter?: any) => {
  const store = useNotificationStore.getState();
  
  if (isReply) {
    if (!store.repliesNotificationsEnabled) return;
    
    // Original commenter is the one who receives the reply notification
    // Assume currentUser is the original commenter in this simulated context
    // If it's a self-reply, skip
    if (originalCommenter && commenter.username === originalCommenter.username) return;

    sendCommentNotification(commenter, comment, vibe, true);
    return;
  }
  
  // Base Comment on vibe
  if (!store.commentsNotificationsEnabled) return;
  // If user commented on their own vibe, skip
  // We'll mock that the current app user is the vibe owner.
  // We would check if `commenter.id === currentUser.id`
  if (commenter.username === 'current_user_username') return; // mock logic
  
  // Check if they are blocked etc can be added if needed
  
  const currentBatches = { ...store.batchedComments };
  const existingBatch = currentBatches[vibe.id] || [];
  
  if (existingBatch.length === 0) {
     // First comment in sequence, notify immediately
     sendCommentNotification(commenter, comment, vibe, false, [commenter]);
     
     // Start a batch for subsequent comments
     currentBatches[vibe.id] = [commenter];
     useNotificationStore.setState({ batchedComments: currentBatches });
     
     // Batch window window 5 minutes (using 10s for mock visualization)
     setTimeout(() => {
        const stateAfterWait = useNotificationStore.getState();
        const batch = stateAfterWait.batchedComments[vibe.id] || [];
        
        if (batch.length > 1) {
           sendCommentNotification(batch[batch.length - 1], comment, vibe, false, batch);
        }
        stateAfterWait.clearBatchedComments(vibe.id);
     }, 10000); 
  } else {
     // Currently in a batch window, just add to batch
     currentBatches[vibe.id].push(commenter);
     useNotificationStore.setState({ batchedComments: currentBatches });
  }
};

const sendCommentNotification = async (commenter: any, comment: any, vibe: any, isReply: boolean, commentersBatch: any[] = []) => {
  const store = useNotificationStore.getState();
  let title = "";
  let body = "";
  
  if (isReply) {
     title = `\uD83D\uDCAC ${commenter.displayName} replied to you`;
     body = comment.text.substring(0, 60);
  } else if (commentersBatch.length > 1) {
     title = `\uD83D\uDCAC ${commenter.displayName} and ${commentersBatch.length - 1} others commented on your vibe`;
     body = "";
  } else {
     title = `\uD83D\uDCAC New Comment!`;
     body = `${commenter.displayName}: ` + comment.text.substring(0, 60);
  }

  let tag = isReply ? `vibe-reply-${vibe.id}-${Date.now()}` : `vibe-comment-${vibe.id}`;

  const image = vibe.thumbnail || vibe.videoImageHover || "https://picsum.photos/200/200";

  // 1. Send push if granted
  if (store.pushPermissionGranted && 'serviceWorker' in navigator) {
     try {
       const reg = await navigator.serviceWorker.ready;
       reg.showNotification(title, {
          body,
          icon: commenter.avatar,
          image,
          badge: "/skrimchat-badge.png",
          tag,
          data: {
             type: isReply ? "vibe_reply" : "vibe_comment",
             vibeId: vibe.id,
             commentId: comment.id,
             url: `/vibes?id=${vibe.id}&comment=${comment.id}`
          },
          actions: [
            { action: "watch", title: "View Vibe \u25B6\uFE0F" },
            { action: "dismiss", title: "Dismiss" }
          ]
       } as NotificationOptions & { image?: string });
     } catch (e) {
       console.error("SW push error", e);
     }
  }
  
  // 2. Add In-App notification
  store.addInAppNotification({
     id: `notif_${Date.now()}_comment`,
     type: isReply ? 'vibe_reply' : 'vibe_comment',
     title,
     body,
     creatorName: commenter.displayName,
     creatorAvatar: commenter.avatar,
     thumbnail: image,
     vibeId: vibe.id,
     commentId: comment.id,
     timestamp: Date.now(),
     read: false
  });
};

// Mock service to trigger a like on a user's vibe
export const PULSE_EVENTS = {
  watch_bonus: { points: 5, message: "You earned +5 Pulse for watching! ⚡" },
  streak_bonus: { points: 20, message: "🔥 Streak bonus! +20 Pulse Points ⚡" },
  milestone_5: { points: 10, message: "5 vibes watched! +10 Pulse bonus ⚡" },
  milestone_10: { points: 25, message: "10 vibes today! +25 Pulse bonus 🎉" },
  milestone_20: { points: 50, message: "20 vibes! You're on fire! +50 ⚡🔥" },
  share_bonus: { points: 10, message: "Thanks for sharing! +10 Pulse Points ⚡" },
  follow_bonus: { points: 5, message: "New follower! +5 Pulse Points ⚡" }
};

export const simulatePulseReward = async (eventType: keyof typeof PULSE_EVENTS) => {
  const store = useNotificationStore.getState();
  if (!store.pulseRewardsEnabled) return;

  const event = PULSE_EVENTS[eventType];
  if (!event) return;

  const currentBalance = parseInt(localStorage.getItem('skrimchat_pulse_balance') || '0', 10);
  const newBalance = currentBalance + event.points;
  localStorage.setItem('skrimchat_pulse_balance', String(newBalance));

  const shouldPushNotify = event.points >= 50;

  // In-App Toast
  store.addPulseToast({
    id: `pulse_${Date.now()}_${Math.random()}`,
    points: event.points,
    message: event.message,
    total: newBalance
  });

  // Push Notification for big rewards
  if (shouldPushNotify && store.pushPermissionGranted && 'serviceWorker' in navigator) {
     try {
       const reg = await navigator.serviceWorker.ready;
       let bodyText = event.message;
       if (eventType === 'milestone_20') {
           bodyText = "20 vibes watched today — you're on fire! 🔥 Check your Pulse wallet.";
       }
       
       reg.showNotification(`⚡ You earned +${event.points} Pulse!`, {
          body: bodyText,
          icon: '/skrimchat-badge.png',
          badge: '/skrimchat-badge.png',
          tag: 'pulse-reward',
          data: {
             type: 'pulse_reward',
             url: '/wallet'
          }
       } as NotificationOptions);
     } catch (e) {
       console.error("SW push error", e);
     }
  }
};

export const checkStreakRisk = () => {
  const streak = JSON.parse(localStorage.getItem("skrimchat_streak") || "{}");
  const lastWatchDate = streak.lastWatchDate;
  const today = new Date().toDateString();

  const hasWatchedToday = lastWatchDate === today;
  const currentStreak = streak.count || 0;

  return {
    atRisk: !hasWatchedToday,
    streakCount: currentStreak
  };
};

export const checkLanguageMatch = () => {
  const lastVisit = localStorage.getItem("skrimchat_last_visit");
  const lastLangNotif = localStorage.getItem("skrimchat_last_lang_notif");
  const now = Date.now();

  const hoursSinceVisit = lastVisit ? (now - parseInt(lastVisit, 10)) / (1000 * 60 * 60) : 6;
  const hoursSinceNotif = lastLangNotif ? (now - parseInt(lastLangNotif, 10)) / (1000 * 60 * 60) : 24;

  return hoursSinceVisit >= 6 && hoursSinceNotif >= 24;
};

const getLangNotification = (userLanguages: string[], count: number) => {
  const langNames: Record<string, string> = {
    te: "Telugu",
    hi: "Hindi",
    ta: "Tamil",
    kn: "Kannada",
    ar: "Arabic",
    en: "English"
  };

  const names = userLanguages.map(l => langNames[l] || l);
  const langName = names.join(" & ");

  return {
    title: `🌍 New ${langName} vibes are here!`,
    body: `${count}+ fresh vibes in ${langName} just dropped. Come watch! 🔥`
  };
};

export const simulateLanguageMatchNotification = async (userLanguages: string[], vibeCount: number, force = false) => {
  const store = useNotificationStore.getState();
  if (!store.languageMatchNotificationsEnabled) return;

  if (!force && !checkLanguageMatch()) return;

  const { title, body } = getLangNotification(userLanguages, vibeCount);

  // 1. Send push if granted
  if (store.pushPermissionGranted && 'serviceWorker' in navigator) {
     try {
       const reg = await navigator.serviceWorker.ready;
       reg.showNotification(title, {
          body,
          icon: "/skrimchat-badge.png",
          badge: "/skrimchat-badge.png",
          tag: "lang-match",
          data: {
             type: "lang_match",
             url: userLanguages.length > 0 ? `/vibes?lang=${userLanguages[0]}` : "/vibes",
             languages: userLanguages
          },
          actions: [
            { action: "watch", title: "Watch Now 🌍" },
            { action: "dismiss", title: "Later" }
          ]
       } as NotificationOptions);
     } catch (e) {
       console.error("SW push error", e);
     }
  }

  // 2. Add In-App notification
  store.addInAppNotification({
     id: `notif_${Date.now()}_lang`,
     type: 'lang_match',
     title,
     body,
     creatorName: "SkrimChat",
     creatorAvatar: "/skrimchat-badge.png",
     timestamp: Date.now(),
     languages: userLanguages,
     read: false
  });

  localStorage.setItem("skrimchat_last_lang_notif", Date.now().toString());
};

const getStreakMessage = (streakCount: number) => {
  if (streakCount === 0) {
    return {
      title: "🔥 Start your streak!",
      body: "Watch a vibe today and start your Blaze Run! ⚡"
    };
  }

  if (streakCount < 7) {
    return {
      title: `🔥 ${streakCount} day streak at risk!`,
      body: "Don't break your Blaze Run! Watch one vibe to keep it going 🔥"
    };
  }

  if (streakCount < 30) {
    return {
      title: `🔥 ${streakCount} days — don't stop!`,
      body: "Your Blaze Run is on fire! One vibe keeps it alive ⚡"
    };
  }

  return {
    title: `👑 ${streakCount} day streak!`,
    body: "Legendary Blaze Run at risk — watch one vibe NOW! 🔥👑"
  };
};

export const showStreakNotification = async (streakCount: number) => {
  const store = useNotificationStore.getState();
  if (!store.blazeRunRemindersEnabled) return;

  const { title, body } = getStreakMessage(streakCount);

  // 1. Send push if granted
  if (store.pushPermissionGranted && 'serviceWorker' in navigator) {
     try {
       const reg = await navigator.serviceWorker.ready;
       reg.showNotification(title, {
          body,
          icon: "/skrimchat-badge.png",
          badge: "/skrimchat-badge.png",
          tag: "streak-reminder",
          data: {
             type: "streak_reminder",
             url: "/vibes"
          },
          actions: [
            { action: "watch_now", title: "Watch Now 🔥" },
            { action: "remind_later", title: "Remind me at 9PM" }
          ]
       } as NotificationOptions);
     } catch (e) {
       console.error("SW push error", e);
     }
  }
  
  // 2. Add In-App notification
  store.addInAppNotification({
     id: `notif_${Date.now()}_streak`,
     type: 'streak_reminder',
     title,
     body,
     creatorName: "SkrimChat",
     creatorAvatar: "/skrimchat-badge.png",
     timestamp: Date.now(),
     read: false
  });
};

export const scheduleStreakReminder = () => {
  const store = useNotificationStore.getState();
  if (!store.blazeRunRemindersEnabled) return;

  const [hours, minutes] = store.blazeRunReminderTime.split(':').map(Number);

  const now = new Date();
  const reminder = new Date();
  reminder.setHours(hours, minutes, 0, 0);

  if (now > reminder) return;

  const delay = reminder.getTime() - now.getTime();

  window.setTimeout(() => {
    const { atRisk, streakCount } = checkStreakRisk();
    if (atRisk) {
      showStreakNotification(streakCount);
    }
  }, delay);
};

export const simulateVibeLike = (liker: any, vibe: any, currentTotalLikes: number) => {
  const store = useNotificationStore.getState();
  
  if (!store.likesNotificationsEnabled) return;
  
  const milestones = [10, 50, 100, 500, 1000, 5000, 10000];
  const isMilestone = milestones.includes(currentTotalLikes + 1);

  if (store.likesMilestonesOnly && !isMilestone) return;

  if (isMilestone) {
     // Always notify milestones immediately
     sendLikeNotification(liker, vibe, currentTotalLikes + 1, [liker], true);
     return;
  }

  const currentBatches = { ...store.batchedLikes };
  const existingBatch = currentBatches[vibe.id] || [];
  
  if (existingBatch.length === 0) {
     // First like in sequence, notify immediately
     sendLikeNotification(liker, vibe, currentTotalLikes + 1, [liker], false);
     
     // Start a batch for subsequent likes
     currentBatches[vibe.id] = [liker];
     useNotificationStore.setState({ batchedLikes: currentBatches });
     
     // Batch window 10 minutes (using 10s for mock visualization)
     setTimeout(() => {
        const stateAfterWait = useNotificationStore.getState();
        const batch = stateAfterWait.batchedLikes[vibe.id] || [];
        
        // If more than 1 like accumulated in the batch, send a summary
        // The first liker is in the array, so we check if length > 1
        if (batch.length > 1) {
           sendLikeNotification(batch[batch.length - 1], vibe, currentTotalLikes + batch.length, batch, false);
        }
        stateAfterWait.clearBatchedLikes(vibe.id);
     }, 10000); 
  } else {
     // Currently in a batch window, just add to batch
     currentBatches[vibe.id].push(liker);
     useNotificationStore.setState({ batchedLikes: currentBatches });
  }
};

const sendLikeNotification = async (liker: any, vibe: any, totalLikes: number, likersBatch: any[], isMilestone: boolean) => {
  const store = useNotificationStore.getState();
  let title = "";
  let body = "";
  
  if (isMilestone) {
     title = `\uD83C\uDF89 ${totalLikes} Pulses!`;
     body = `Your vibe just hit ${totalLikes} pulses! \u26A1`;
  } else if (likersBatch.length > 1) {
     title = `\u26A1 Your vibe is blowing up!`;
     body = `${liker.displayName} and ${likersBatch.length - 1} others pulsed your vibe \uD83D\uDD25`;
  } else {
     title = `\u26A1 New Pulse!`;
     body = `${liker.displayName} liked your vibe \uD83D\uDD25`;
  }

  const image = vibe.thumbnail || vibe.videoImageHover || "https://picsum.photos/200/200";

  // 1. Send push if granted
  if (store.pushPermissionGranted && 'serviceWorker' in navigator) {
     try {
       const reg = await navigator.serviceWorker.ready;
       reg.showNotification(title, {
          body,
          icon: liker.avatar,
          image,
          badge: "/skrimchat-badge.png",
          tag: `vibe-like-${vibe.id}`,
          data: {
             type: "vibe_like",
             vibeId: vibe.id,
             url: `/vibes?id=${vibe.id}`
          },
          actions: [
            { action: "watch", title: "View Vibe \u25B6\uFE0F" },
            { action: "dismiss", title: "Dismiss" }
          ]
       } as NotificationOptions & { image?: string });
     } catch (e) {
       console.error("SW push error", e);
     }
  }
  
  // 2. Add In-App notification
  store.addInAppNotification({
     id: `notif_${Date.now()}_like`,
     type: 'vibe_like',
     title,
     body,
     creatorName: liker.displayName,
     creatorAvatar: liker.avatar,
     thumbnail: image,
     vibeId: vibe.id,
     timestamp: Date.now(),
     read: false
  });
};
