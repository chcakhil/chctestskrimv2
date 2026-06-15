import { Zap, MessageCircle, Share2, Music, Bookmark, Heart, Instagram, Twitter, Facebook, Link as LinkIcon, Send, Sparkles, X, Mail, Search, Check, Repeat, MoreVertical, Settings, Database } from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { AvatarWithRing } from '../components/ui';
import { ReactionRow } from '../components/ReactionRow';
import { triggerReactionAnimation } from '../lib/animations/reactionAnimations';
import { getReels } from '../lib/mock/mockServices';
import { getActiveFestival } from '../lib/festivals';
import { FestivalParticles } from '../components/FestivalParticles';
import { mockUsers } from '../lib/mock/mockData';
import { FEATURE_FLAGS } from '../lib/config/featureFlags';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSavedStore } from '../store/savedStore';
import { useDataModeStore, DATA_MODES } from '../store/dataModeStore';
import { useOfflineStore } from '../store/offlineStore';
import { useSettingsStore } from '../store/settingsStore';
import { checkStreakRisk, simulatePulseReward } from '../store/notificationStore';

const getRelativeTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days/7)}w ago`;
};

const VIBE_COMPASS_MOODS = [
  { id: "for_you", label: "For You", emoji: "⚡" },
  { id: "hype", label: "Hype", emoji: "🔥" },
  { id: "funny", label: "Funny", emoji: "😂" },
  { id: "feels", label: "Feels", emoji: "💜" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "food", label: "Food", emoji: "🍕" },
  { id: "gym", label: "Gym", emoji: "💪" },
  { id: "cricket", label: "Cricket", emoji: "🏏" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "study", label: "Study", emoji: "📚" },
  { id: "global", label: "Global", emoji: "🌍" },
  { id: "culture", label: "Culture", emoji: "🎭" },
  { id: "dance", label: "Dance", emoji: "💃" }
];

function VibeCompass({ selectedMood, onMoodChange, activeFestival }: { selectedMood: string, onMoodChange: (id: string) => void, activeFestival?: any }) {
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: any) => setIsModalOpen(e.detail?.open);
    window.addEventListener('skrimchat_modal_state', handler);
    return () => window.removeEventListener('skrimchat_modal_state', handler);
  }, []);

  const pingVisibility = () => {
    setIsVisible(true);
  };

  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isVisible, selectedMood]);

  useEffect(() => {
    const handleGlobalInteraction = () => pingVisibility();
    window.addEventListener('touchstart', handleGlobalInteraction);
    window.addEventListener('mousedown', handleGlobalInteraction);
    window.addEventListener('keydown', handleGlobalInteraction);
    window.addEventListener('scroll', handleGlobalInteraction, true);

    return () => {
      window.removeEventListener('touchstart', handleGlobalInteraction);
      window.removeEventListener('mousedown', handleGlobalInteraction);
      window.removeEventListener('keydown', handleGlobalInteraction);
      window.removeEventListener('scroll', handleGlobalInteraction, true);
    }
  }, []);

  const handleSelect = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    onMoodChange(id);
    setAnimatingId(id);
    setTimeout(() => setAnimatingId(null), 200);
    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    pingVisibility();
  };

  const currentMoods = [...VIBE_COMPASS_MOODS];
  if (activeFestival) {
    currentMoods.unshift({
      id: "festival",
      label: `${activeFestival.name} Mode`,
      emoji: activeFestival.emoji
    });
  }

  return (
    <div 
      className={`absolute bottom-[72px] md:bottom-6 left-0 right-0 z-[60] px-4 transition-all duration-300 pointer-events-auto ${isModalOpen ? 'opacity-0 translate-y-10 pointer-events-none' : isVisible ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-0 hover:opacity-100'}`}
      onMouseEnter={pingVisibility}
      onTouchStart={pingVisibility}
    >
      <div 
        ref={containerRef}
        className="w-full overflow-x-auto no-scrollbar flex items-center gap-2 pb-2"
        style={{ scrollSnapType: "x proximity" }}
      >
        {currentMoods.map(mood => {
          const active = selectedMood === mood.id;
          const isAnimating = animatingId === mood.id;
          const isFestival = mood.id === "festival" && activeFestival;
          return (
            <button
              key={mood.id}
              onClick={(e) => handleSelect(mood.id, e)}
              className={`shrink-0 flex items-center gap-1.5 whitespace-nowrap active:scale-95 border ${
                active 
                  ? isFestival ? `bg-[${activeFestival.color}] border-[${activeFestival.color}] shadow-[0_0_12px_${activeFestival.glowColor}] text-white font-bold` : "bg-[#B026FF] border-[#B026FF] shadow-[0_0_12px_#B026FF] text-white font-bold" 
                  : isFestival ? `bg-[rgba(20,20,30,0.5)] border-[${activeFestival.color}] text-[${activeFestival.color}]` : "bg-[rgba(20,20,30,0.5)] border-white/15 text-white/90"
              } ${isAnimating ? "animate-pill-bounce" : "transition-all duration-200"}`}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "13px",
                scrollSnapAlign: "center",
                transform: active && !isAnimating ? "scale(1.05)" : "scale(1)",
                borderColor: (isFestival && !active) ? activeFestival.color : undefined,
                color: (isFestival && !active) ? activeFestival.color : undefined,
                backgroundColor: (isFestival && active) ? activeFestival.color : undefined,
                boxShadow: (isFestival && active) ? `0 0 12px ${activeFestival.glowColor}` : undefined
              }}
            >
              <span>{mood.emoji}</span>
              <span>{mood.label}{isFestival && " ON"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const MOCK_COMMENTS = [
  {
    commentId: "mock_c1",
    username: "@dolly_ka_dhaba",
    displayName: "Dolly",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dolly",
    text: "This is fire! 🔥",
    createdAt: Date.now() - 3600000,
    likes: 24,
    replies: []
  },
  {
    commentId: "mock_c2",
    username: "@marcus_k",
    displayName: "Marcus",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    text: "Absolutely loved this! 💜",
    createdAt: Date.now() - 7200000,
    likes: 12,
    replies: []
  },
  {
    commentId: "mock_c3",
    username: "@sarah_j",
    displayName: "Sarah",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    text: "Keep it up! You're amazing ⚡",
    createdAt: Date.now() - 10800000,
    likes: 8,
    replies: []
  }
];

const VibeCard = ({ reel, setToastMessage, activeIndex, index, lastVibeRef }: any) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [showPulseScreenFlash, setShowPulseScreenFlash] = useState(false);
  const lastTapTime = useRef(0);
  const tapTimeoutRef = useRef<any>(null);
  const { toggleSave, isSaved, toggleRepost, isReposted } = useSavedStore();
  const saved = isSaved(reel.id);
  const reposted = isReposted(reel.id);
  
  const [isPulsed, setIsPulsed] = useState(false);
  const [pulseAnim, setPulseAnim] = useState('');
  const [countAnim, setCountAnim] = useState('');
  
  const user = useCurrentUser();
  
  const currentProfile = {
      username: user?.username ? (user.username.startsWith('@') ? user.username : `@${user.username}`) : '@' + mockUsers[1].username,
      displayName: user?.displayName || user?.name || mockUsers[1].displayName,
      avatar: user?.avatar || mockUsers[1].avatar
  };

  const initialPulse = parseInt(String(reel.pulseCount).replace('K', '000').replace('M', '000000'), 10) || 0;
  const [pulseCount, setPulseCount] = useState(initialPulse);

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string, username: string } | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentCount, setCommentCount] = useState(() => {
    const saved = JSON.parse(localStorage.getItem(`skrimchat_comments_${reel.id}`) || '[]');
    return MOCK_COMMENTS.length + saved.length;
  });
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const commentsScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [showShare, setShowShare] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDataSettings, setShowDataSettings] = useState(false);
  const { dataMode, setDataMode, getEffectiveMode } = useDataModeStore();
  const { downloadVibe, getDownloadState } = useOfflineStore();
  const effectiveMode = getEffectiveMode();
  const isUltraLow = effectiveMode === 'ultra_low';
  const [forceShowVideo, setForceShowVideo] = useState(false);
  
  const showVideo = !isUltraLow || forceShowVideo;
  
  const downloadStatus = getDownloadState(reel.id);

  const [contactSearch, setContactSearch] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);

  const handleConnectSend = () => {
    if (selectedContacts.length === 0) return;
    
    const storedChatsStr = localStorage.getItem('skrimchat_custom_chats');
    const customChats = storedChatsStr ? JSON.parse(storedChatsStr) : {};
    
    selectedContacts.forEach(id => {
      const u = mockUsers.find(mu => mu.id === id);
      if (u && u.username) {
        const username = u.username.replace('@', '');
        if (!customChats[username]) customChats[username] = [];
        
        customChats[username].push({
          id: Date.now().toString() + Math.random(),
          text: `Check out this Vibe: https://skrim.chat/vibe/${reel.id}`,
          sender: "me",
          timestamp: Date.now()
        });
      }
    });
    
    localStorage.setItem('skrimchat_custom_chats', JSON.stringify(customChats));

    const names = selectedContacts
      .map((id) => mockUsers.find((u) => u.id === id)?.displayName)
      .filter(Boolean);
    const msg =
      names.length === 1
        ? `✅ Vibe sent to ${names[0]}!`
        : `✅ Vibe sent to ${names[0]} & ${names.length - 1} other${names.length > 2 ? "s" : ""}!`;
    setToastMessage(msg);
    setShowConnect(false);
    
    // As per user's instruction we avoid redirecting to /connect?user=... instead redirect to /connect ONLY or what did they say?
    // "when i share spark,to connect instead showing connect list why it is showing one connect user 
    // i hope you understood, please fix"
    // So they WANT it to redirect to the connect list! `/connect` ALWAYS!
    setTimeout(() => navigate('/connect'), 300);
  };

  useEffect(() => {
    const isOpen = showComments || showShare || showConnect || showDataSettings || showOptionsMenu;
    window.dispatchEvent(new CustomEvent('skrimchat_modal_state', { detail: { open: isOpen } }));
  }, [showComments, showShare, showConnect, showDataSettings, showOptionsMenu]);

  const handleShareApp = (app: string) => {
    const url = `https://skrim.chat/vibe/${reel.id}`;
    const text = "Check out this Vibe on SkrimChat!";
    let shareUrl = '';

    switch(app) {
      case 'WhatsApp': shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`; break;
      case 'Twitter': shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`; break;
      case 'Facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`; break;
      case 'Telegram': shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`; break;
      case 'Arattai': shareUrl = `arattai://share?text=${encodeURIComponent(text + ' ' + url)}`; break;
      default:
        if (navigator.share) {
          navigator.share({ title: 'SkrimChat', text: text, url: url }).catch(() => {});
          setShowShare(false);
        } else {
          setToastMessage(`Shared to ${app}!`);
          setShowShare(false);
        }
        return;
    }
    
    const a = document.createElement('a');
    a.href = shareUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setToastMessage(`Shared to ${app}!`);
    setShowShare(false);
  };

  useEffect(() => {
    if (showComments) {
      const key = `skrimchat_comments_${reel.id}`;
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      const allComments = [...MOCK_COMMENTS, ...saved];
      const uniqueComments = Array.from(new Map(allComments.map(c => [c.commentId, c])).values());
      
      setComments(uniqueComments);
      setCommentCount(uniqueComments.length);
      
      setTimeout(() => {
        if (commentsScrollRef.current) {
          const params = new URLSearchParams(window.location.search);
          const targetCommentId = params.get('comment');
          if (targetCommentId) {
             const commentEl = document.getElementById(`comment-${targetCommentId}`);
             if (commentEl) {
               commentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
               commentEl.classList.add('bg-white/10');
               commentEl.classList.add('rounded-xl');
               setTimeout(() => {
                  commentEl.classList.remove('bg-white/10');
               }, 2000);
               return; // Skip default scroll if found
             }
          }
          commentsScrollRef.current.scrollTop = commentsScrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [showComments, reel.id]);

  const handleSendComment = () => {
    if (!commentText.trim()) return;

    const currentText = commentText.trim();
    setCommentText(''); // Clear instantly
    
    const currentUserInfo = {
      username: currentProfile.username,
      displayName: currentProfile.displayName,
      avatar: currentProfile.avatar
    };

    const newComment = {
      commentId: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      vibeId: reel.id,
      username: currentUserInfo.username,
      avatar: currentUserInfo.avatar,
      displayName: currentUserInfo.displayName,
      text: currentText,
      createdAt: Date.now(),
      likes: 0,
      isLiked: false,
      replies: []
    };

    const key = `skrimchat_comments_${reel.id}`;
    let existing = JSON.parse(localStorage.getItem(key) || '[]');
    
    if (replyingTo) {
        setComments(prev => {
            return prev.map(c => {
                if (c.commentId === replyingTo.id) {
                    return {
                        ...c,
                        replies: [...(c.replies || []), newComment]
                    };
                }
                return c;
            })
        });
        
        // Find existing parent in localStorage if real comment
        const exIdx = existing.findIndex((c: any) => c.commentId === replyingTo.id);
        if (exIdx !== -1) {
            existing[exIdx].replies = existing[exIdx].replies || [];
            existing[exIdx].replies.push(newComment);
            localStorage.setItem(key, JSON.stringify(existing));
        } else {
            const mockParent = comments.find(c => c.commentId === replyingTo.id);
            if (mockParent) {
                const clonedParent = JSON.parse(JSON.stringify(mockParent));
                clonedParent.replies = clonedParent.replies || [];
                clonedParent.replies.push(newComment);
                existing.push(clonedParent);
                localStorage.setItem(key, JSON.stringify(existing));
            }
        }
    } else {
        setComments(prev => [...prev, newComment]);
        setCommentCount(prev => prev + 1);
        existing.push(newComment);
        localStorage.setItem(key, JSON.stringify(existing));
        
        setTimeout(() => {
          if (commentsScrollRef.current) {
            commentsScrollRef.current.scrollTop = commentsScrollRef.current.scrollHeight;
          }
        }, 100);
    }

    setCommentText('');
    setReplyingTo(null);
  };

  const handleToggleCommentLike = (commentId: string) => {
    setComments(prev => prev.map(c => {
      if (c.commentId === commentId) {
        const nextLiked = !c.isLiked;
        const updated = { 
          ...c, 
          isLiked: nextLiked, 
          likes: (c.likes || 0) + (nextLiked ? 1 : -1) 
        };
        
        // Try to update in localStorage
        const key = `skrimchat_comments_${reel.id}`;
        let existing = JSON.parse(localStorage.getItem(key) || '[]');
        const idx = existing.findIndex((ec: any) => ec.commentId === commentId);
        if (idx !== -1) {
          existing[idx] = updated;
          localStorage.setItem(key, JSON.stringify(existing));
        }

        return updated;
      }
      return c;
    }));
  };

  useEffect(() => {
    const pulsed = JSON.parse(localStorage.getItem('skrimchat_pulsed_vibes') || '[]');
    setIsPulsed(pulsed.includes(reel.id));
  }, [reel.id]);

  useEffect(() => {
    let following = JSON.parse(localStorage.getItem('skrimchat_following') || '[]');
    if (following.includes(reel.handle)) {
      setIsFollowing(true);
    }
  }, [reel.handle]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
            if (!showComments && !showShare && !showDataSettings && !showOptionsMenu && showVideo) {
                video.play().catch(() => {});
                setIsPaused(false);
            }
        } else {
            video.pause();
            video.currentTime = 0;
        }
      });
    }, { threshold: 0.7 });

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }
    return () => observer.disconnect();
  }, [showComments, showShare, showDataSettings, showOptionsMenu, showVideo]);

  useEffect(() => {
    if (showComments || showShare || showDataSettings || showOptionsMenu || !showVideo) {
       videoRef.current?.pause();
    } else {
       if (!isPaused) {
          videoRef.current?.play().catch(() => {});
       }
    }
  }, [showComments, showShare, showDataSettings, showOptionsMenu, showVideo, isPaused]);

  const handleVideoTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapTime.current < DOUBLE_TAP_DELAY) {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      lastTapTime.current = 0;
      
      setShowPulseScreenFlash(true);
      setTimeout(() => setShowPulseScreenFlash(false), 300);

      const container = document.getElementById(`vibes-image-${reel.id}`);
      if (container) {
          const flash = document.createElement('div');
          flash.className = 'absolute top-1/2 left-1/2 -mt-[60px] -ml-[60px] pointer-events-none z-30';
          flash.style.animation = 'bigFlash 800ms forwards';
          flash.innerHTML = '<svg width="120" height="120" viewBox="0 0 24 36" fill="#B026FF" class="drop-shadow-[0_0_30px_#B026FF] drop-shadow-[0_0_60px_rgba(176,38,255,0.5)]"><path d="M12.5 0L0 20h10l-2 16 16-24H12z"/></svg>';
          container.appendChild(flash);
          setTimeout(() => flash.remove(), 800);
      }
      
      if (!isPulsed) {
         handlePulse();
      }
      return;
    }
    
    lastTapTime.current = now;
    
    tapTimeoutRef.current = setTimeout(() => {
      if (video.paused) {
        video.play().catch(() => {});
        setIsPaused(false);
        setShowPlayIcon(true);
        setTimeout(() => setShowPlayIcon(false), 1500);
      } else {
        video.pause();
        setIsPaused(true);
        setShowPauseIcon(true);
        setTimeout(() => setShowPauseIcon(false), 1000);
      }
    }, DOUBLE_TAP_DELAY);
  };

  const savePulseState = (vibeId: string, pulsedState: boolean) => {
    const pulsed = JSON.parse(localStorage.getItem("skrimchat_pulsed_vibes") || "[]");
    if (pulsedState) {
      if (!pulsed.includes(vibeId)) pulsed.push(vibeId);
    } else {
      const index = pulsed.indexOf(vibeId);
      if (index > -1) pulsed.splice(index, 1);
    }
    localStorage.setItem("skrimchat_pulsed_vibes", JSON.stringify(pulsed));
  };

  const handlePulse = () => {
    setPulseAnim('');
    setCountAnim('');
    setTimeout(() => {
      const nextPulsed = !isPulsed;
      setIsPulsed(nextPulsed);
      setPulseCount(prev => nextPulsed ? prev + 1 : prev - 1);
      setPulseAnim('animate-pulse-pop');
      setCountAnim(nextPulsed ? 'count-up' : 'count-down');

      if (nextPulsed) {
         const container = document.getElementById(`pulse-btn-container-${reel.id}`);
         if (container) {
           const angles = [0, 45, 90, 135, 180, 225, 270, 315];
           angles.forEach(deg => {
             const dist = 40;
             const tx = Math.cos(deg * Math.PI / 180) * dist;
             const ty = Math.sin(deg * Math.PI / 180) * dist;
             const particle = document.createElement('div');
             particle.className = 'pulse-particle flex justify-center items-center';
             particle.innerHTML = '<svg width="8" height="12" viewBox="0 0 24 36" fill="#B026FF"><path d="M12.5 0L0 20h10l-2 16 16-24H12z"/></svg>';
             particle.style.setProperty('--tx', `${tx}px`);
             particle.style.setProperty('--ty', `${ty}px`);
             container.appendChild(particle);
             setTimeout(() => particle.remove(), 500);
           });

           const ring = document.createElement('div');
           ring.className = 'energy-ring';
           container.appendChild(ring);
           setTimeout(() => ring.remove(), 600);
         }
      }
      savePulseState(reel.id, nextPulsed);
    }, 10);
  };

  const handleFollow = () => {
    let following = JSON.parse(localStorage.getItem('skrimchat_following') || '[]');
    if (isFollowing) {
      following = following.filter((h: string) => h !== reel.handle);
      setIsFollowing(false);
    } else {
      following.push(reel.handle);
      setIsFollowing(true);
    }
    localStorage.setItem('skrimchat_following', JSON.stringify(following));
  };

  const formatCount = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
    return num;
  };

  const isActive = activeIndex === index;

  return (
    <div ref={lastVibeRef} className="w-full h-full relative snap-start bg-[#0A0A12] shrink-0 overflow-hidden flex items-center justify-center pointer-events-none">
      <div 
        className={`w-full h-full relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] pointer-events-auto shadow-2xl ${isActive ? 'scale-100 opacity-100 rounded-none' : 'scale-[0.85] opacity-40 rounded-[2rem] blur-[2px]'}`}
        style={{ transformOrigin: 'center center' }}
      >
        <div id={`vibes-image-${reel.id}`} className="absolute inset-0" onClick={handleVideoTap}>
          {showVideo ? (
          <video 
             ref={videoRef}
             autoPlay 
             playsInline 
             muted={false} 
             preload="auto"
             onEnded={() => {
                simulatePulseReward('watch_bonus');
                const container = document.getElementById('vibes-feed-container');
                if (container) {
                   container.scrollBy({ top: container.clientHeight, behavior: 'smooth' });
                }
             }}
             poster={reel.videoImageHover}
             className="w-full h-full object-cover"
             src="https://www.w3schools.com/html/mov_bbb.mp4"
             onError={() => console.log('Video play error handled gracefully')}
          />
        ) : (
          <div className="w-full h-full bg-black relative flex flex-col items-center justify-center shadow-inner">
            <img src={reel.videoImageHover} alt="thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[2px]" />
            <div className="absolute inset-0 bg-black/40" />
            
            <div className="relative z-10 flex flex-col items-center pointer-events-auto group" onClick={(e) => { e.stopPropagation(); setForceShowVideo(true); }}>
              <div className="bg-black/80 backdrop-blur rounded-full px-4 py-2 flex items-center gap-2 border border-white/20 mb-4 animate-pulse">
                <span className="text-white shadow-[0_0_10px_white]">🌐</span>
                <span className="text-white text-sm font-medium">Ultra Low Data Mode — Audio only</span>
              </div>
              
              <div className="flex items-center gap-1 h-8 mb-4">
                 {[1,2,3,4,5,6].map(i => (
                   <div key={i} className="w-1.5 bg-[#B026FF] rounded-full" style={{ height: `${20 + Math.random() * 20}px`, animation: `pulseWaveform 1s ease-in-out infinite ${i * 0.15}s alternate` }} />
                 ))}
              </div>
              
              <button className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white font-medium text-sm transition-all group-hover:scale-105 select-none">
                Tap to load video
              </button>
            </div>
            
            {/* Hidden audio for Ultra Low mode to just play sound */}
            <audio 
              ref={videoRef as any} 
              autoPlay 
              src="https://www.w3schools.com/html/mov_bbb.mp4" 
              onEnded={() => {
                 simulatePulseReward('watch_bonus');
                 const container = document.getElementById('vibes-feed-container');
                 if (container) {
                    container.scrollBy({ top: container.clientHeight, behavior: 'smooth' });
                 }
              }}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
        
        {showPauseIcon && (
          <div className="absolute top-1/2 left-1/2 -mt-[48px] -ml-[48px] bg-black/60 backdrop-blur-[8px] rounded-full w-[96px] h-[96px] border-2 border-[#B026FF] flex items-center justify-center animate-spring-pop pointer-events-none z-20">
            <div className="flex gap-2">
              <svg width="28" height="40" viewBox="0 0 24 36" fill="#B026FF" className="drop-shadow-[0_0_12px_#B026FF] drop-shadow-[0_0_24px_rgba(176,38,255,0.5)]">
                <path d="M12.5 0L0 20h10l-2 16 16-24H12z" />
              </svg>
              <svg width="28" height="40" viewBox="0 0 24 36" fill="#B026FF" className="drop-shadow-[0_0_12px_#B026FF] drop-shadow-[0_0_24px_rgba(176,38,255,0.5)]">
                <path d="M12.5 0L0 20h10l-2 16 16-24H12z" />
              </svg>
            </div>
          </div>
        )}
        {showPlayIcon && (
          <div className="absolute top-1/2 left-1/2 -mt-[48px] -ml-[48px] bg-black/60 backdrop-blur-[8px] rounded-full w-[96px] h-[96px] border-2 border-[#B026FF] flex items-center justify-center animate-spring-pop pointer-events-none z-20">
            <div className="absolute w-full h-full rounded-full border-2 border-[#B026FF] animate-play-pulse" />
            <svg width="72" height="72" viewBox="0 0 24 36" fill="#B026FF" className="drop-shadow-[0_0_12px_#B026FF] drop-shadow-[0_0_24px_rgba(176,38,255,0.5)] transform translate-x-1">
               <path d="M12.5 0L0 20h10l-2 16 16-24H12z" />
            </svg>
          </div>
        )}
        {showPulseScreenFlash && (
          <div className="absolute inset-0 bg-[#B026FF26] animate-[fadeOut_300ms_ease-out_forwards] pointer-events-none z-20" />
        )}
        
        {reel.isRegionallyBoosted && (
          <div className="absolute top-[80px] left-4 z-20 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center shadow-lg border border-white/10">
              <span className="text-white text-[10px] font-bold tracking-wide">
                📍 Popular in {reel.creatorState || 'your region'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right Action Bar */}
      <div className="absolute right-4 bottom-28 flex flex-col items-center gap-6 z-10">
         <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={(e) => { e.stopPropagation(); handlePulse(); }}>
           <div id={`pulse-btn-container-${reel.id}`} className={`p-3 bg-black/40 backdrop-blur-md rounded-full transition-transform ${pulseAnim} relative`}>
             {isPulsed ? (
               <svg width="28" height="28" viewBox="0 0 24 36" fill="#B026FF" className="drop-shadow-[0_0_8px_#B026FF] drop-shadow-[0_0_16px_rgba(176,38,255,0.4)]">
                 <path d="M12.5 0L0 20h10l-2 16 16-24H12z" />
               </svg>
             ) : (
               <svg width="28" height="28" viewBox="0 0 24 36" fill="rgba(255,255,255,0.7)" className="stroke-white/20 stroke-1 transition-colors group-hover:fill-white">
                 <path d="M12.5 0L0 20h10l-2 16 16-24H12z" />
               </svg>
             )}
           </div>
           <span className={`text-xs font-semibold drop-shadow-lg overflow-hidden h-[18px] block ${isPulsed ? 'text-[#B026FF] drop-shadow-[0_0_6px_rgba(176,38,255,0.6)]' : 'text-white'}`}>
               <div className={countAnim}>{formatCount(pulseCount)}</div>
           </span>
         </div>
         
         <div id={`comment-btn-${reel.id}`} className="flex flex-col items-center gap-1 cursor-pointer group" onClick={(e) => { e.stopPropagation(); setShowComments(true); }}>
           <div className="p-3 bg-black/40 backdrop-blur-md rounded-full group-active:scale-90 transition-transform">
             <MessageCircle className="w-7 h-7 text-white fill-transparent group-hover:text-[#00F0FF] transition-colors" />
           </div>
           <span className="text-xs font-semibold drop-shadow-lg text-white">{formatCount(commentCount)}</span>
         </div>
         
         <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={(e) => { e.stopPropagation(); setShowShare(true); }}>
           <div className="p-3 bg-black/40 backdrop-blur-md rounded-full group-active:scale-90 transition-transform">
             <Share2 className="w-7 h-7 text-white fill-transparent group-hover:text-blue-400 transition-colors" />
           </div>
           <span className="text-xs font-semibold drop-shadow-lg text-white">{reel.shares}</span>
         </div>

         <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={(e) => {
             e.stopPropagation();
             const isNowSaved = toggleSave(reel.id);
             if (isNowSaved) {
                 setToastMessage("✅ Saved to your collection!");
             } else {
                 setToastMessage("Removed from saved");
             }
             setTimeout(() => setToastMessage(""), 2500);
         }}>
           <div className="p-3 bg-black/40 backdrop-blur-md rounded-full group-hover:scale-110 transition-transform">
             <Bookmark className={`w-7 h-7 transition-colors ${saved ? "text-[#B026FF] fill-[#B026FF]" : "text-white fill-transparent group-hover:text-[#B026FF]"}`} />
           </div>
           <span className="text-xs font-semibold drop-shadow-lg text-white">{saved ? "Saved" : "Save"}</span>
         </div>

         <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={(e) => { e.stopPropagation(); setShowOptionsMenu(true); }}>
           <div className="p-3 bg-black/40 backdrop-blur-md rounded-full group-hover:scale-110 transition-transform">
             <MoreVertical className="w-7 h-7 text-white group-hover:text-white/80 transition-colors" />
           </div>
         </div>

         <div className="w-10 h-10 rounded-full mt-4 border-2 border-white overflow-hidden/80 animate-[spin_8s_linear_infinite]">
             <img src={reel.avatar} alt="audio" className="w-full h-full object-cover" />
         </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-24 left-4 right-20 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
           <AvatarWithRing src={reel.avatar} size="sm" isStory={true} />
           <h3 className="font-bold text-[15px] drop-shadow-lg flex items-center gap-2 text-white">
             {reel.user}
             <button 
               onClick={handleFollow}
               className={`text-[11px] px-2 py-0.5 rounded transition-all active:scale-90 font-semibold flex items-center ${isFollowing ? 'border border-white text-white bg-transparent' : 'border-none text-white bg-[#B026FF]'}`}
             >
               {isFollowing ? '✓ Following' : '+ Follow'}
             </button>
           </h3>
        </div>
        <p className="text-sm font-medium text-white/90 drop-shadow-md leading-snug">
           {reel.caption.split(/(#[\w\u0900-\u097F\u0C00-\u0C7F]+)/g).map((part: string, i: number) => 
             part.startsWith('#') ? (
                <span 
                  key={i} 
                  className="font-bold text-white cursor-pointer hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/hashtag/${encodeURIComponent(part)}`);
                  }}
                >
                  {part}
                </span>
             ) : (
                <span key={i}>{part}</span>
             )
           )}
        </p>
        <div className="flex items-center gap-2 mt-1">
           <Music className="w-3 h-3 text-white drop-shadow" />
           <span className="text-xs text-white drop-shadow-md overflow-hidden text-ellipsis whitespace-nowrap marquee w-48">{reel.audio}</span>
        </div>
        {reel.reactions && (
          <div className="mt-2 w-64 md:w-80 pointer-events-auto">
             <ReactionRow 
               initialReactions={reel.reactions} 
               className="!pb-0" 
               onReact={(reactionId, reaction) => {
                 if (reactionId && reaction) {
                   const container = document.getElementById(`vibes-image-${reel.id}`);
                   if (container) triggerReactionAnimation(container, reactionId, reaction.emoji);
                 }
               }}
             />
          </div>
        )}
      </div>

            {/* COMMENTS SHEET */}
      <AnimatePresence>
        {showComments && (
           <>
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[70]"
               onClick={() => setShowComments(false)}
             />
             <motion.div
               initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="absolute bottom-0 w-full h-[80%] bg-[#0f0f12]/90 backdrop-blur-3xl shadow-[0_-10px_50px_rgba(176,38,255,0.15)] rounded-t-[32px] z-[80] flex flex-col pt-2 border-t border-[#B026FF]/40 pointer-events-auto"
               onPointerDown={(e) => e.stopPropagation()}
             >
               <div 
                 className="w-full flex justify-center py-2 cursor-pointer active:opacity-50"
                 onClick={() => setShowComments(false)}
               >
                 <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto" />
               </div>
               <div className="flex justify-between items-center px-6 pb-4 border-b border-white/5 mx-2 shrink-0">
                 <h2 className="text-white font-bold text-lg flex items-center gap-2">
                   <span className="bg-gradient-to-r from-[#B026FF] to-[#00F0FF] bg-clip-text text-transparent italic tracking-wider">Vibe Chat</span>
                   <span className="text-[10px] bg-white/10 px-2 flex items-center justify-center font-black py-0.5 rounded-full text-white/70">{commentCount}</span>
                 </h2>
               </div>
               <div ref={commentsScrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide">
                 {comments.map((c, idx) => (
                   <div id={`comment-${c.commentId}`} key={`${c.commentId}_${idx}`} className="relative animate-commentSlideIn transition-colors duration-500 p-2 -mx-2">
                     {c.replies && c.replies.length > 0 && (
                       <div className="absolute left-[19px] top-[48px] bottom-0 w-[2px] bg-gradient-to-b from-[#B026FF]/50 to-transparent rounded-full" />
                     )}
                     
                     <div className="flex gap-3 relative z-10">
                       <div className="shrink-0">
                         <div className="w-[40px] h-[40px] rounded-full p-[2px] bg-gradient-to-tr from-[#B026FF] to-[#00F0FF] shadow-[0_0_15px_rgba(176,38,255,0.2)]">
                           <img src={c.avatar} className="w-full h-full rounded-full object-cover border-[3px] border-[#0f0f12]" alt="avatar" />
                         </div>
                       </div>
                       <div className="flex-1 group">
                         <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl rounded-tl-sm p-3.5 shadow-lg relative overflow-hidden transition-colors hover:bg-white/[0.06]">
                           <div className="absolute top-0 right-0 w-24 h-24 bg-[#B026FF]/20 blur-3xl rounded-full pointer-events-none" />
                           
                           <h4 className="text-[13px] font-bold text-[#00F0FF] flex items-center gap-2 drop-shadow-[0_0_4px_rgba(0,240,255,0.3)]">
                             {c.username}
                             <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse shadow-[0_0_8px_#00F0FF]" />
                           </h4>
                           <p className="text-white/95 text-[14px] leading-relaxed break-words mt-1 relative z-10">{c.text}</p>
                         </div>
                         
                         <div className="flex gap-5 mt-2 px-1 text-[11px] text-white/50 font-bold items-center tracking-wide">
                           <span>{getRelativeTime(c.createdAt)}</span>
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleToggleCommentLike(c.commentId); }}
                             className={`flex items-center gap-1.5 transition-all active:scale-95 ${c.isLiked ? 'text-[#B026FF] drop-shadow-[0_0_5px_#B026FF]' : 'hover:text-white'}`}
                           >
                             <Zap className="w-3.5 h-3.5" fill={c.isLiked ? '#B026FF' : 'transparent'} /> {c.likes || 0}
                           </button>
                           <button 
                             className="uppercase hover:text-[#00F0FF] transition-colors active:scale-95"
                             onClick={(e) => {
                               e.stopPropagation();
                               setReplyingTo({ id: c.commentId, username: c.username });
                               if (inputRef.current) inputRef.current.focus();
                             }}
                           >
                             Reply
                           </button>
                         </div>
                       </div>
                     </div>

                     {c.replies && c.replies.length > 0 && (
                       <div className="ml-[44px] mt-4 space-y-4 relative z-10">
                         {c.replies.map((reply: any, r_idx: number) => (
                           <div id={`comment-${reply.commentId}`} key={`${reply.commentId}_${r_idx}`} className="flex gap-2.5 animate-commentSlideIn relative group transition-colors duration-500 p-2 -mx-2">
                             <div className="absolute left-[-25px] top-[14px] w-[16px] h-[2px] bg-[#B026FF]/40 rounded-r-full" />

                             <div className="shrink-0 mt-[-2px]">
                               <div className="w-[30px] h-[30px] rounded-full p-[1px] bg-[#B026FF]/60 shadow-[0_0_10px_rgba(176,38,255,0.2)]">
                                 <img src={reply.avatar} className="w-full h-full rounded-full object-cover border-[2px] border-[#0f0f12]" alt="avatar" />
                               </div>
                             </div>
                             <div className="flex-1">
                               <div className="bg-black/60 border border-white/5 rounded-2xl rounded-tl-sm p-3 outline outline-1 outline-transparent transition-colors group-hover:outline-[#B026FF]/30">
                                 <h4 className="text-[12px] font-bold text-[#e2a8ff] flex items-center gap-1.5 drop-shadow-[0_0_3px_rgba(176,38,255,0.4)]">
                                   {reply.username}
                                 </h4>
                                 <p className="text-white/80 text-[13px] leading-relaxed break-words mt-0.5 relative z-10">{reply.text}</p>
                               </div>
                               <div className="flex gap-4 mt-1.5 px-1 text-[10px] text-white/40 font-bold uppercase tracking-wider items-center">
                                 <span>{getRelativeTime(reply.createdAt)}</span>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 ))}
                 <div ref={commentsEndRef} />
               </div>
               <div className="border-t border-[#B026FF]/30 bg-[#0a0a0c] flex flex-col relative z-50">
                 {replyingTo && (
                    <div className="flex justify-between items-center px-4 py-2 bg-[#B026FF]/10 mx-4 mt-3 rounded-lg border border-[#B026FF]/20 shadow-inner">
                      <span className="text-xs text-[#e2a8ff]">
                        Replying to <span className="font-bold text-[#00F0FF]">{replyingTo.username}</span>
                      </span>
                      <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-3.5 h-3.5 text-white/70" />
                      </button>
                    </div>
                  )}
                 <div className="p-4 py-6 flex items-center gap-3">
                   <img src={currentProfile.avatar} className="w-[42px] h-[42px] rounded-full border border-white/20 object-cover" alt="avatar" />
                   <form 
                     className="flex-1 flex items-center gap-2"
                     onSubmit={(e) => {
                       e.preventDefault();
                       handleSendComment();
                     }}
                   >
                     <input 
                       ref={inputRef}
                       type="text" 
                       value={commentText}
                       onChange={e => setCommentText(e.target.value)}
                       placeholder="Say something nice..." 
                       className="flex-1 bg-white/5 rounded-full px-5 border border-white/10 outline-none text-white text-[15px] placeholder:text-white/30 h-[48px] focus:border-[#00F0FF]/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.15)] transition-all" 
                     />
                     <button 
                       type="submit"
                       disabled={!commentText.trim()}
                       style={{
                         background: commentText.trim() ? "linear-gradient(135deg, #B026FF, #00F0FF)" : "#222",
                         border: "none",
                         borderRadius: "50%",
                         width: 48,
                         height: 48,
                         display: "flex",
                         alignItems: "center",
                         justifyContent: "center",
                         cursor: commentText.trim() ? "pointer" : "not-allowed",
                         transition: "all 300ms",
                         opacity: commentText.trim() ? 1 : 0.5,
                         boxShadow: commentText.trim() ? "0 0 20px rgba(176,38,255,0.4)" : "none"
                       }}
                     >
                       <span className="text-[#09090b] text-[18px] leading-none ml-[-2px] mt-[2px] font-black tracking-tighter">➤</span>
                     </button>
                   </form>
                 </div>
               </div>
             </motion.div>
           </>
         )}
      </AnimatePresence>

      {/* SHARE SHEET */}
      <AnimatePresence>
        {showShare && (
           <>
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/60 z-[70]"
               onClick={() => setShowShare(false)}
             />
             <motion.div
               initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="absolute bottom-0 w-full bg-[rgba(20,20,20,0.95)] backdrop-blur-xl rounded-t-3xl z-[80] border-t border-white/10 pb-8 pt-2 pointer-events-auto max-h-[90vh] overflow-y-auto no-scrollbar"
               onPointerDown={(e) => e.stopPropagation()}
             >
               <div 
                 className="w-full flex justify-center py-2 cursor-pointer active:opacity-50"
                 onClick={() => setShowShare(false)}
               >
                 <div className="w-16 h-1.5 bg-white/20 rounded-full mx-auto" />
               </div>
               <div className="flex justify-center items-center px-6 pb-4 border-b border-white/10">
                 <h2 className="text-white font-bold text-lg">Share Vibe</h2>
               </div>
               
               {/* Grid for external apps */}
               <div className="grid grid-cols-4 gap-y-6 gap-x-2 p-6 justify-items-center">
                 <div className="flex flex-col items-center gap-2">
                   <button onClick={() => handleShareApp('WhatsApp')} className="w-14 h-14 bg-[#25D366] text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg active:scale-90 transition-transform">💬</button>
                   <span className="text-[10px] text-white/70 font-semibold">WhatsApp</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                   <button onClick={() => handleShareApp('Instagram')} className="w-14 h-14 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"><Instagram className="w-7 h-7" /></button>
                   <span className="text-[10px] text-white/70 font-semibold">Instagram</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                   <button onClick={() => handleShareApp('Twitter')} className="w-14 h-14 bg-black border border-white/20 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                     <span className="text-2xl font-black">X</span>
                   </button>
                   <span className="text-[10px] text-white/70 font-semibold">Twitter</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                   <button onClick={() => handleShareApp('Telegram')} className="w-14 h-14 bg-[#0088cc] text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg active:scale-90 transition-transform">✈️</button>
                   <span className="text-[10px] text-white/70 font-semibold">Telegram</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                   <button onClick={() => handleShareApp('Facebook')} className="w-14 h-14 bg-[#1877F2] text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"><Facebook className="w-7 h-7 fill-white" /></button>
                   <span className="text-[10px] text-white/70 font-semibold">Facebook</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                   <button onClick={() => handleShareApp('Snapchat')} className="w-14 h-14 bg-[#FFFC00] text-black rounded-2xl flex items-center justify-center text-2xl shadow-lg active:scale-90 transition-transform">👻</button>
                   <span className="text-[10px] text-white/70 font-semibold">Snapchat</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                   <button onClick={() => handleShareApp('Arattai')} className="w-14 h-14 bg-[#1D4ED8] text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg active:scale-90 transition-transform">💬</button>
                   <span className="text-[10px] text-white/70 font-semibold">Arattai</span>
                 </div>
               </div>

               <div className="px-6 space-y-3">
                 <button className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 transition-colors py-4 rounded-2xl text-white font-bold" onClick={() => {
                     navigator.clipboard.writeText(`https://skrim.chat/vibe/${reel.id}`);
                     setToastMessage("🔗 Link copied!");
                     setShowShare(false);
                 }}>
                   <LinkIcon className="w-5 h-5" /> Copy Link
                 </button>
                 <button className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 transition-colors py-4 rounded-2xl text-white font-bold" onClick={() => {
                     setShowShare(false);
                     setShowConnect(true);
                 }}>
                   <Mail className="w-5 h-5" /> Send in Connect
                 </button>
                 <button className="w-full flex items-center justify-center gap-2 bg-[#B026FF] hover:bg-[#971bd6] transition-colors py-4 rounded-2xl text-white font-bold" onClick={() => {
                     
                     // Add to Sparks
                     const savedStr = localStorage.getItem('skrimchat_sparks');
                     let mySparks = savedStr ? JSON.parse(savedStr) : [];
                     if (!Array.isArray(mySparks)) mySparks = [];
                     
                     const newSpark = {
                        id: `vibe_spark_${Date.now()}`,
                        isOwn: true,
                        userId: user?.username || 'me',
                        userName: user?.displayName || user?.name || 'Me',
                        userAvatar: user?.avatar || mockUsers[1].avatar,
                        user: user || currentProfile,
                        type: 'video',
                        image: reel.videoImageHover || `https://picsum.photos/400/600?random=${Date.now()}`,
                        video: reel.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4",
                        mood: reel.mood || '🔥 Trending',
                        energy: 'HOT',
                        text: `Shared Vibe: ${reel.caption || ''}`,
                        caption: `Shared Vibe: ${reel.caption || ''}`,
                        createdAt: Date.now(),
                        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
                     };

                     mySparks = [newSpark, ...mySparks];
                     localStorage.setItem('skrimchat_sparks', JSON.stringify(mySparks));
                     
                     setToastMessage("⚡ Shared as Spark!");
                     setShowShare(false);
                     setTimeout(() => navigate('/'), 300);
                 }}>
                   <Sparkles className="w-5 h-5" /> Share as Spark
                 </button>
                 <button className="w-full flex items-center justify-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] transition-colors py-4 rounded-2xl text-white font-bold" onClick={() => {
                     const isNowReposted = toggleRepost(reel.id);
                     if (isNowReposted) {
                         setToastMessage("🔄 Reposted successfully!");
                     } else {
                         setToastMessage("Removed repost");
                     }
                     setShowShare(false);
                 }}>
                   <Repeat className="w-5 h-5" /> {reposted ? "Remove Repost" : "Repost to Profile"}
                 </button>
               </div>
             </motion.div>
           </>
        )}
      </AnimatePresence>

      {/* CONNECT SHARE SHEET */}
      <AnimatePresence>
        {showConnect && (
           <>
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/60 z-[70]"
               onClick={() => setShowConnect(false)}
             />
             <motion.div
               initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="absolute bottom-0 w-full bg-[rgba(20,20,20,0.95)] backdrop-blur-xl rounded-t-3xl z-[80] border-t border-white/10 pb-8 pt-6 pointer-events-auto"
               onPointerDown={(e) => e.stopPropagation()}
             >
                  <div className="px-4 pb-6 flex flex-col h-[70vh]">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                      <h3 className="font-bold text-white text-lg">
                        Send to...
                      </h3>
                      <button
                        onClick={() => setShowConnect(false)}
                        className="p-1.5 bg-white/10 rounded-full"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    <div className="relative mb-4 shrink-0">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search contacts..."
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm outline-none focus:border-[#B026FF]/50 transition-colors"
                      />
                    </div>

                    <p className="text-xs text-gray-400 font-bold mb-2 uppercase tracking-wider shrink-0 px-1">
                      Recent Chats
                    </p>

                    <div className="overflow-y-auto no-scrollbar flex-1 mb-4 flex flex-col gap-1 min-h-0">
                      {mockUsers
                        .filter(
                          (u) =>
                            u.id !== user?.id &&
                            (u.displayName
                              ?.toLowerCase()
                              .includes(contactSearch.toLowerCase()) ||
                              u.username
                                ?.toLowerCase()
                                .includes(contactSearch.toLowerCase())),
                        )
                        .map((u) => {
                          const isSelected = selectedContacts.includes(u.id);
                          return (
                            <button
                              key={u.id}
                              onClick={() => {
                                setSelectedContacts((prev) =>
                                  prev.includes(u.id)
                                    ? prev.filter((id) => id !== u.id)
                                    : [...prev, u.id],
                                );
                              }}
                              className={`flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors text-left ${isSelected ? "bg-white/10" : ""}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-white/10">
                                  <img
                                    src={u.avatar}
                                    alt={u.displayName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <div className="text-white font-semibold flex items-center gap-1.5">
                                    {u.displayName}
                                    {u.isVerified && (
                                      <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center">
                                        <Check className="w-2.5 h-2.5 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    @{u.username}
                                  </div>
                                </div>
                              </div>
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-[#B026FF] border-[#B026FF]" : "border-white/20"}`}
                              >
                                {isSelected && (
                                  <Check
                                    className="w-3.5 h-3.5 text-white"
                                    strokeWidth={3}
                                  />
                                )}
                              </div>
                            </button>
                          );
                        })}
                    </div>

                    <button
                      onClick={handleConnectSend}
                      disabled={selectedContacts.length === 0}
                      className={`w-full py-3.5 rounded-full font-bold shadow-lg transition-all shrink-0 ${selectedContacts.length > 0 ? "bg-gradient-to-r from-[#B026FF] to-[#00F0FF] text-white hover:opacity-90" : "bg-white/10 text-white/40 cursor-not-allowed"}`}
                    >
                      {selectedContacts.length > 0
                        ? `Send to ${selectedContacts.length} ⚡`
                        : "Send ⚡"}
                    </button>
                  </div>
             </motion.div>
           </>
        )}
      </AnimatePresence>

      {/* OPTIONS MENU */}
      <AnimatePresence>
        {showOptionsMenu && (
           <>
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
               onClick={(e) => { e.stopPropagation(); setShowOptionsMenu(false); }}
             />
             <motion.div 
               initial={{ y: "100%", opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: "100%", opacity: 0 }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="absolute bottom-0 left-0 right-0 bg-[#222] rounded-t-2xl z-50 flex flex-col pointer-events-auto"
               onClick={e => e.stopPropagation()}
             >
               <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-2" />
               <div className="p-4 flex flex-col">
                 <button className="flex items-center gap-3 p-4 hover:bg-white/10 rounded-xl transition" onClick={() => { setShowOptionsMenu(false); }}>
                   <span className="text-xl">🚫</span>
                   <span className="flex-1 text-left font-bold text-white text-base">Not interested</span>
                 </button>
                 
                 <button className="flex items-center gap-3 p-4 hover:bg-white/10 rounded-xl transition" onClick={() => { setShowOptionsMenu(false); }}>
                   <span className="text-xl">🚩</span>
                   <span className="flex-1 text-left font-bold text-white text-base">Report</span>
                 </button>
                 
                 <button 
                   className={`flex items-center gap-3 p-4 hover:bg-white/10 rounded-xl transition ${downloadStatus === 'downloading' ? 'opacity-70 pointer-events-none' : ''}`}
                   onClick={(e) => {
                     if (downloadStatus !== 'idle' && downloadStatus !== 'error') return;
                     e.stopPropagation();
                     downloadVibe(reel);
                   }}
                 >
                   <span className="text-xl">
                      {downloadStatus === 'idle' ? '⬇️' :
                       downloadStatus === 'downloading' ? '⏳' :
                       downloadStatus === 'saved' ? '✅' : '❌'}
                   </span>
                   <span className="flex-1 text-left font-bold text-white text-base">
                      {downloadStatus === 'idle' ? 'Download for offline' :
                       downloadStatus === 'downloading' ? 'Saving...' :
                       downloadStatus === 'saved' ? 'Saved for offline' : 'Failed — try again'}
                   </span>
                 </button>
                 
                 <button className="flex items-center gap-3 p-4 hover:bg-white/10 rounded-xl transition" onClick={() => {
                     setShowOptionsMenu(false);
                     setTimeout(() => setShowDataSettings(true), 150);
                 }}>
                   <span className="text-xl">🌐</span>
                   <span className="flex-1 text-left font-bold text-white text-base">Data Settings</span>
                 </button>
               </div>
             </motion.div>
           </>
        )}
      </AnimatePresence>

      {/* DATA SETTINGS SHEET */}
      <AnimatePresence>
        {showDataSettings && (
           <>
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
               onClick={(e) => { e.stopPropagation(); setShowDataSettings(false); }}
             />
             <motion.div 
               initial={{ y: "100%", opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: "100%", opacity: 0 }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-[#141414] rounded-t-3xl z-50 flex flex-col pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10"
               onClick={e => e.stopPropagation()}
             >
               <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-4 shrink-0" />
               <div className="px-6 flex justify-between items-center pb-4 shrink-0 border-b border-white/5">
                 <h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings className="w-5 h-5 text-[#B026FF]" /> Data Settings</h2>
                 <button onClick={() => setShowDataSettings(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                   <X className="w-5 h-5" />
                 </button>
               </div>
               
               <div className="p-4 flex flex-col gap-2 overflow-y-auto w-full max-w-lg mx-auto pb-8">
                 {DATA_MODES.map(mode => (
                   <button 
                     key={mode.id}
                     className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${dataMode === mode.id ? 'bg-[#B026FF]/10 border-[#B026FF] shadow-inner' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                     onClick={() => {
                       setDataMode(mode.id);
                       setToastMessage(`Switched to ${mode.label} mode`);
                       setTimeout(() => setShowDataSettings(false), 300);
                     }}
                   >
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${dataMode === mode.id ? 'bg-[#B026FF]/20 text-[#B026FF]' : 'bg-white/10 text-white'}`}>
                       <span className="text-xl">{mode.icon}</span>
                     </div>
                     <div className="flex-1">
                       <p className={`font-bold ${dataMode === mode.id ? 'text-[#B026FF]' : 'text-white'}`}>{mode.label}</p>
                       <p className="text-white/60 text-sm mt-0.5">{mode.description}</p>
                     </div>
                     {dataMode === mode.id && <Check className="w-5 h-5 text-[#B026FF] mt-2 shrink-0" />}
                   </button>
                 ))}
               </div>
             </motion.div>
           </>
        )}
      </AnimatePresence>

      </div>
    </div>
  );
};

const MOOD_FILTER_MAP: Record<string, string[] | null> = {
  for_you: null,
  hype: ["motivation", "sports", "gaming", "dance"],
  funny: ["comedy", "entertainment"],
  feels: ["lifestyle", "chill", "romance", "music"],
  gaming: ["gaming"],
  food: ["food"],
  gym: ["fitness"],
  cricket: ["cricket", "sports"],
  music: ["music", "dance"],
  study: ["education", "tech"],
  global: ["travel", "culture", "news"],
  culture: ["culture", "fashion", "beauty"],
  dance: ["dance", "music"]
};

const getRegionalBoost = (vibe: any, user: any) => {
  if (!user) return 0;
  
  let boost = 0;
  // Fallback defaults so mock matching tests work
  const uCountry = user.country || 'IN';
  const uState = user.state || 'Andhra Pradesh';
  const uCity = user.city || 'Nellore';
  const uLang = user.primaryLanguage || 'Telugu';

  if (vibe.creatorCountry === uCountry) boost += 15;
  if (vibe.creatorState === uState) boost += 20;
  if (vibe.creatorCity === uCity) boost += 10;
  if (vibe.language === uLang) boost += 15;

  return boost;
};

const getSortedVibes = (vibes: any[], activeFestival: any = null, currentUser: any = null, regionalBoostEnabled: boolean = true) => {
  let scoredVibes = [...vibes].map(a => {
    let aScore = a.pulseCount || 0;
    if (activeFestival) {
      if (a.mood?.toLowerCase().includes(activeFestival.id) || a.caption?.toLowerCase().includes(activeFestival.id) || a.caption?.toLowerCase().includes(activeFestival.name.toLowerCase())) {
        aScore += 20000;
      }
    }
    
    let isRegionallyBoosted = false;
    let boost = 0;
    if (regionalBoostEnabled && currentUser) {
      boost = getRegionalBoost(a, currentUser);
      if (boost > 0) {
        aScore += (boost * 500); 
        isRegionallyBoosted = boost >= 35;
      }
    }
    return { ...a, _score: aScore, isRegionallyBoosted, _isGlobal: boost === 0 };
  });

  scoredVibes.sort((a, b) => b._score - a._score);

  if (regionalBoostEnabled && currentUser) {
    const globalContent = scoredVibes.filter(v => v._isGlobal);
    const regionalContent = scoredVibes.filter(v => !v._isGlobal);
    const finalFeed = [];
    
    let globalIdx = 0;
    let regionalIdx = 0;
    
    while (finalFeed.length < scoredVibes.length) {
      // 30% global content = 3 slots out of 10. We inject every 3rd slot.
      if (finalFeed.length % 3 === 2 && globalIdx < globalContent.length) {
        finalFeed.push(globalContent[globalIdx++]);
      } else if (regionalIdx < regionalContent.length) {
        finalFeed.push(regionalContent[regionalIdx++]);
      } else if (globalIdx < globalContent.length) {
        finalFeed.push(globalContent[globalIdx++]);
      }
    }
    return finalFeed;
  }

  return scoredVibes;
};

const getMoodFilteredVibes = (allVibes: any[], selectedMood: string, activeFestival: any = null, currentUser: any = null, regionalBoostEnabled: boolean = true) => {
  if (selectedMood === "festival" && activeFestival) {
    const festivalMatches = allVibes.filter(vibe => 
      vibe.mood?.toLowerCase().includes(activeFestival.id) || 
      vibe.caption?.toLowerCase().includes(activeFestival.id) || 
      vibe.caption?.toLowerCase().includes(activeFestival.name.toLowerCase())
    );
    return getSortedVibes(festivalMatches.length > 0 ? festivalMatches : allVibes, activeFestival, currentUser, regionalBoostEnabled);
  }

  if (!selectedMood || selectedMood === "for_you") {
    return getSortedVibes(allVibes, activeFestival, currentUser, regionalBoostEnabled);
  }

  const targetMoods = MOOD_FILTER_MAP[selectedMood];

  if (!targetMoods) {
    return getSortedVibes(allVibes, activeFestival, currentUser, regionalBoostEnabled);
  }

  const matching = allVibes.filter(vibe => targetMoods.includes(vibe.mood));

  let result = matching;

  if (matching.length < 5) {
    const nonMatching = allVibes.filter(vibe => !targetMoods.includes(vibe.mood));
    result = [...matching, ...nonMatching];
  }

  return getSortedVibes(result, activeFestival, currentUser, regionalBoostEnabled);
};

const trackMoodSelection = (moodId: string) => {
  if (moodId === "for_you") return;

  const key = "skrimchat_mood_selections";
  const data = JSON.parse(localStorage.getItem(key) || "{}");

  data[moodId] = (data[moodId] || 0) + 1;

  localStorage.setItem(key, JSON.stringify(data));
};

export default function VibesScreen() {
  const currentUser = useCurrentUser();
  const { regionalBoostEnabled } = useSettingsStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStreakBanner, setShowStreakBanner] = useState<boolean>(() => checkStreakRisk().atRisk);
  const [streakCount, setStreakCount] = useState<number>(() => checkStreakRisk().streakCount);
  const [toastMessage, setToastMessage] = useState('');
  const [filteredReels, setFilteredReels] = useState<any[]>([]);
  const [emptyStateOriginalMood, setEmptyStateOriginalMood] = useState<string | null>(null);
  const [originalMoodLabel, setOriginalMoodLabel] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<string>('for_you');
  const [activeFeedTab, setActiveFeedTab] = useState<'for_you' | 'following'>('for_you');
  
  const [activeFestival] = useState(() => getActiveFestival());
  const [showFestivalBanner, setShowFestivalBanner] = useState(() => {
    return activeFestival !== null && !sessionStorage.getItem('skrimchat_festival_banner_dismissed');
  });

  const applyFeedFilters = React.useCallback((rawReels: any[], mood: string, tab: 'for_you' | 'following') => {
      let filtered = getMoodFilteredVibes(rawReels, mood, activeFestival, currentUser, regionalBoostEnabled);
      if (tab === 'following') {
         const followingList = JSON.parse(localStorage.getItem('skrimchat_following') || '[]');
         filtered = filtered.filter((r: any) => followingList.includes(r.handle));
      }
      
      const searchParams = new URLSearchParams(window.location.search);
      const targetLang = searchParams.get('lang');
      if (targetLang) {
         const langNames: Record<string, string> = {
           te: "Telugu", hi: "Hindi", ta: "Tamil", kn: "Kannada", ar: "Arabic", en: "English"
         };
         const expandedLang = langNames[targetLang.toLowerCase()] || targetLang;
         const filteredByLang = filtered.filter((r: any) => r.language && r.language.toLowerCase() === expandedLang.toLowerCase());
         if (filteredByLang.length > 0) {
            filtered = filteredByLang;
         }
      }
      
      return filtered;
  }, [activeFestival, currentUser, regionalBoostEnabled]);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const refreshFeed = async () => {
    setIsRefreshing(true);
    if (FEATURE_FLAGS.MOCK_MODE) {
      // Use dynamic imports to prevent require loops if needed, or simply call existing getReels
      const fetchedReels = await getReels();
      
      const newFiltered = applyFeedFilters(fetchedReels, selectedMood, activeFeedTab);
      
      setReels(fetchedReels);
      setFilteredReels(newFiltered);
      setActiveIndex(0);
      setIsRefreshing(false);
    } else {
        setTimeout(() => setIsRefreshing(false), 800);
    }
  };


  const handlePointerDown = (e: React.PointerEvent | React.TouchEvent) => {
    const container = document.getElementById("vibes-feed-container");
    if (container && container.scrollTop <= 0) {
      touchStartY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
    } else {
      touchStartY.current = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent | React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const diff = currentY - touchStartY.current;
    
    if (diff > 0) {
      setPullY(Math.min(diff, 120));
    } else {
      setPullY(0);
    }
  };

  const handlePointerUp = () => {
    if (pullY > 80 && !isRefreshing) {
      refreshFeed();
    }
    setPullY(0);
    touchStartY.current = null;
  };

  const lastVibeElementRef = useCallback((node: any) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setIsLoadingMore(prev => {
          if (prev) return prev;
          
          if (FEATURE_FLAGS.MOCK_MODE) {
             getReels().then(newReels => {
               const moreReels = newReels.map(r => ({ ...r, id: `vibe_${Date.now()}_${Math.random()}` }));
               setReels(current => [...current, ...moreReels]);
               
               const moreFiltered = applyFeedFilters(moreReels, selectedMood, activeFeedTab);
               
               setFilteredReels(currentFiltered => [...currentFiltered, ...moreFiltered]);
               setIsLoadingMore(false);
             });
          } else {
             setTimeout(() => setIsLoadingMore(false), 500);
          }
          return true;
        });
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loading, selectedMood, activeFestival, currentUser, regionalBoostEnabled]);

  const location = useLocation();

  useEffect(() => {
    // Basic streak completion simulation:
    // If they look at Vibes for 2 seconds, consider it "watched" for the day
    if (!showStreakBanner) return;
    
    const t = setTimeout(() => {
      const streak = JSON.parse(localStorage.getItem("skrimchat_streak") || "{}");
      const today = new Date().toDateString();
      if (streak.lastWatchDate !== today) {
         const newCount = streak.lastWatchDate && new Date(Date.now() - 86400000).toDateString() === streak.lastWatchDate
            ? (streak.count || 0) + 1 
            : 1; // Or just increment for mock
         
         streak.lastWatchDate = today;
         if (!streak.count) streak.count = (streakCount || 0) + 1;
         else streak.count = streak.count + 1;
         
         localStorage.setItem("skrimchat_streak", JSON.stringify(streak));
      }
      setShowStreakBanner(false);
    }, 2000);
    
    return () => clearTimeout(t);
  }, [showStreakBanner, streakCount]);

  useEffect(() => {
    const fetchReels = async () => {
      setLoading(true);
      if (FEATURE_FLAGS.MOCK_MODE) {
        const fetchedReels = await getReels();
        setReels(fetchedReels);
        
        let initialMood = localStorage.getItem("skrimchat_selected_mood") || "for_you";
        const queryParams = new URLSearchParams(location.search);
        const targetId = queryParams.get('id');
        
        // Use applyFeedFilters to get initial feed
        let initialReels = applyFeedFilters(fetchedReels, initialMood, activeFeedTab);
        
        if (targetId) {
           const foundIdx = initialReels.findIndex((r: any) => r.id === targetId);
           if (foundIdx !== -1) {
              setActiveIndex(foundIdx);
              // Small delay to allow react rendering then scroll container
              setTimeout(() => {
                 const container = document.getElementById("vibes-feed-container");
                 if (container) {
                    container.scrollTop = foundIdx * container.clientHeight;
                 }
                 
                 // If comment param is present, trigger comment sheet
                 if (queryParams.get('comment')) {
                    // Give it a tiny bit more time to settle the active item
                    setTimeout(() => {
                      // We can just set a flag on window or trigger an event, but the cleanest is finding the reel component and passing a prop OR just simulating the click
                      const commentBtn = document.getElementById(`comment-btn-${targetId}`);
                      if (commentBtn) commentBtn.click();
                    }, 200);
                 }
              }, 100);
           } else {
             // Not in this mood feed, we can try prepending it or switching to 'for_you'
             const fullIdx = fetchedReels.findIndex((r: any) => r.id === targetId);
             if (fullIdx !== -1) {
                initialReels.unshift(fetchedReels[fullIdx]);
                setActiveIndex(0);
                
                if (queryParams.get('comment')) {
                   setTimeout(() => {
                      const commentBtn = document.getElementById(`comment-btn-${targetId}`);
                      if (commentBtn) commentBtn.click();
                   }, 300);
                }
             }
           }
        }
        
        setSelectedMood(initialMood);
        setFilteredReels(initialReels);
      }
      setLoading(false);
    };
    fetchReels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleMoodChange = React.useCallback((moodId: string) => {
    setSelectedMood(moodId);
    localStorage.setItem("skrimchat_selected_mood", moodId);
    trackMoodSelection(moodId);
    
    let resolvedMoodId = moodId;
    // Check for empty state purely for showing a message
    const targetMoods = MOOD_FILTER_MAP[moodId];
    if (moodId !== 'for_you' && moodId !== 'festival' && targetMoods) {
      const matchCount = reels.filter(r => targetMoods.includes(r.mood)).length;
      if (matchCount === 0) {
        const label = VIBE_COMPASS_MOODS.find(m => m.id === moodId)?.label || moodId;
        setOriginalMoodLabel(label);
        setEmptyStateOriginalMood(moodId);
        setTimeout(() => {
          setEmptyStateOriginalMood(null);
          setSelectedMood("for_you");
          localStorage.setItem("skrimchat_selected_mood", "for_you");
          // Re-filter back to "For You"
          setFilteredReels(applyFeedFilters(reels, "for_you", activeFeedTab));
        }, 2000);
        resolvedMoodId = "for_you"; // instantly show fallback data while overlay stays
      }
    }

    const container = document.getElementById('vibes-feed-container');
    if (container) {
       container.style.transition = 'opacity 150ms transform 150ms';
       container.style.opacity = '0';
       container.style.transform = 'scale(0.95)';
       setTimeout(() => {
          setFilteredReels(applyFeedFilters(reels, resolvedMoodId, activeFeedTab));
          container.style.opacity = '1';
          container.style.transform = 'scale(1)';
          setActiveIndex(0);
          container.scrollTop = 0;
          
          setTimeout(() => {
             container.style.transition = '';
             container.style.opacity = '';
             container.style.transform = '';
          }, 150);
       }, 150);
    }
  }, [reels, activeFestival, activeFeedTab]);

  const handleFeedTabChange = React.useCallback((tab: 'for_you' | 'following') => {
    setActiveFeedTab(tab);
    const container = document.getElementById('vibes-feed-container');
    if (container) {
       container.style.transition = 'opacity 150ms transform 150ms';
       container.style.opacity = '0';
       container.style.transform = 'scale(0.95)';
       setTimeout(() => {
          setFilteredReels(applyFeedFilters(reels, selectedMood, tab));
          container.style.opacity = '1';
          container.style.transform = 'scale(1)';
          setActiveIndex(0);
          container.scrollTop = 0;
          
          setTimeout(() => {
             container.style.transition = '';
             container.style.opacity = '';
             container.style.transform = '';
          }, 150);
       }, 150);
    }
  }, [reels, selectedMood, applyFeedFilters]);

  const isWheeling = useRef(false);

  useEffect(() => {
    const container = document.getElementById('vibes-feed-container');
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Allow scrolling inside comments or other sheets
      if ((e.target as HTMLElement).closest('.overflow-y-auto') && (e.target as HTMLElement).closest('.overflow-y-auto') !== container) {
        return;
      }
      
      e.preventDefault();

      if (isWheeling.current || Math.abs(e.deltaY) < 10) return;
      isWheeling.current = true;

      const direction = e.deltaY > 0 ? 1 : -1;
      const targetScroll = container.scrollTop + (direction * container.clientHeight);
      
      container.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });

      setTimeout(() => {
        isWheeling.current = false;
      }, 500);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div 
      className="w-full h-full bg-black relative overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      onTouchCancel={handlePointerUp}
    >
      {activeFestival && <FestivalParticles festivalId={activeFestival.id} />}
      
      {/* Pull to refresh visual */}
      <div 
        className="absolute top-0 left-0 w-full flex items-center justify-center pointer-events-none z-[60] transition-transform duration-200" 
        style={{ transform: `translateY(${pullY / 2}px)`, opacity: pullY > 20 || isRefreshing ? 1 : 0 }}
      >
         <div className="bg-black/80 backdrop-blur-md rounded-full mt-24 min-h-[40px] px-3.5 flex items-center shadow-[0_0_15px_rgba(176,38,255,0.3)] border border-white/20">
           <Repeat className={`w-5 h-5 text-white ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullY * 3}deg)` }} />
           {pullY > 80 && !isRefreshing && <span className="ml-2 text-white text-xs font-semibold uppercase tracking-wider">Release</span>}
         </div>
      </div>

      {showStreakBanner && (
        <div className="absolute top-16 left-4 right-4 z-50 bg-black/60 backdrop-blur-xl border border-orange-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(249,115,22,0.2)] animate-in fade-in slide-in-from-top-4">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
               <span className="text-xl">🔥</span>
            </div>
            <div className="flex-1">
               <p className="text-white font-bold text-sm">{streakCount + 1}-day streak at risk!</p>
               <p className="text-white/70 text-xs mt-0.5">Watch a vibe to keep it alive</p>
            </div>
            <button onClick={() => setShowStreakBanner(false)} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full shrink-0 active:scale-95 transition-transform">
               <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      <div 
        id="vibes-feed-container"
        className="w-full h-full relative snap-y snap-mandatory overflow-y-auto overscroll-none no-scrollbar pb-[80px] md:pb-0" 
        onScroll={(e) => {
          const t = e.currentTarget;
          const i = Math.round(t.scrollTop / t.clientHeight);
          if (i !== activeIndex) setActiveIndex(i);
        }}
      >
        {toastMessage && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 slide-out-to-top-4 duration-300 pointer-events-none">
            <div className="bg-[rgba(20,20,20,0.95)] backdrop-blur-md border border-[#B026FF] shadow-lg px-4 py-3 rounded-xl flex items-center gap-2 w-max max-w-[90vw]">
              <span className="text-white text-sm font-medium">{toastMessage}</span>
            </div>
          </div>
        )}

        <AnimatePresence>
          {emptyStateOriginalMood && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
            >
              <div className="bg-[rgba(20,20,30,0.8)] backdrop-blur-xl border border-white/20 p-6 rounded-2xl flex flex-col items-center justify-center text-center max-w-[80vw] w-[280px]">
                <span className="text-4xl mb-3">🌙</span>
                <p className="text-white font-bold text-lg mb-1">No {originalMoodLabel} vibes yet!</p>
                <p className="text-white/60 text-sm">Showing similar content instead ⚡</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Overlay Header */}
        <div className="fixed top-0 left-0 right-0 p-6 flex flex-col items-center z-50 pointer-events-none md:absolute">
          <div className="w-full flex justify-between items-center">
            <h1 className="text-xl font-bold text-white drop-shadow-md">Vibes</h1>
            <div className="text-white drop-shadow-md flex gap-3">
               <span 
                 onClick={() => handleFeedTabChange('following')}
                 className={`text-sm font-semibold cursor-pointer pointer-events-auto transition-opacity ${activeFeedTab === 'following' ? 'opacity-100' : 'opacity-60'}`}
               >
                 Following
               </span>
               <span className="text-white/40">|</span>
               <span 
                 onClick={() => handleFeedTabChange('for_you')}
                 className={`text-sm font-semibold cursor-pointer pointer-events-auto transition-opacity ${activeFeedTab === 'for_you' ? 'opacity-100' : 'opacity-60'}`}
               >
                 For You
               </span>
            </div>
          </div>
          
          <AnimatePresence>
            {showFestivalBanner && activeFestival && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-4 pointer-events-auto w-full max-w-sm rounded-xl p-4 shadow-lg border border-white/20 relative"
                style={{
                  background: `linear-gradient(135deg, ${activeFestival.color}88, ${activeFestival.glowColor}88)`,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <button 
                  className="absolute top-2 right-2 p-1 text-white/80 hover:text-white"
                  onClick={() => {
                    setShowFestivalBanner(false);
                    sessionStorage.setItem('skrimchat_festival_banner_dismissed', 'true');
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
                <h3 className="text-white font-bold text-base">{activeFestival.emoji} Happy {activeFestival.name}!</h3>
                <p className="text-white/90 text-sm font-medium mt-1">Festive vibes are live ✨</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {loading ? (
           <div className="w-full h-full flex items-center justify-center bg-skrim-bg">
              <div className="w-12 h-12 border-4 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin" />
           </div>
        ) : filteredReels.length === 0 ? (
           <div className="w-full h-full flex flex-col items-center justify-center bg-skrim-bg px-6 text-center">
              <span className="text-4xl mb-4 opacity-50">📭</span>
              <h3 className="text-white font-bold text-lg mb-2">No Vibes Found</h3>
              <p className="text-white/60 text-sm">
                 {activeFeedTab === 'following' 
                    ? "You aren't following anyone with vibes yet. Switch to 'For You' to discover more."
                    : "No vibes here right now. Check back later."}
              </p>
           </div>
        ) : filteredReels.map((reel, index) => {
           let refProp = {};
           if (index === filteredReels.length - 1) {
             refProp = { lastVibeRef: lastVibeElementRef };
           }
           return (
             <VibeCard 
               key={`${reel.id}-${index}`} 
               reel={reel} 
               setToastMessage={setToastMessage}
               activeIndex={activeIndex}
               index={index}
               {...refProp}
             />
           );
        })}
        {isLoadingMore && (
           <div className="w-full h-[60px] shrink-0 flex items-center justify-center bg-transparent">
              <div className="w-8 h-8 border-4 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin" />
           </div>
        )}
      </div>
      
      {/* Vibe Compass */}
      <VibeCompass selectedMood={selectedMood} onMoodChange={handleMoodChange} activeFestival={activeFestival} />
    </div>
  );
}
