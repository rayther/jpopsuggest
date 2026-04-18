import {
  TossAds,
  loadFullScreenAd,
  showFullScreenAd,
} from "@apps-in-toss/web-framework";
import { Button, Top } from "@toss/tds-mobile";
import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { SONGS, type SongRecommendation } from "./songs";

const BANNER_AD_GROUP_ID = "ait.v2.live.8f300bb3c70e46e9";
const FULLSCREEN_AD_GROUP_ID = "ait.v2.live.9615280eaf5d47ea";
const PICKED_SONGS_STORAGE_KEY = "jsong-suggest:picked-songs";

function isSupported(check: () => boolean) {
  try {
    return check();
  } catch {
    return false;
  }
}

function isSongRecommendation(value: unknown): value is SongRecommendation {
  if (typeof value !== "object" || value == null) {
    return false;
  }

  const song = value as Partial<SongRecommendation>;

  return (
    typeof song.title === "string" &&
    typeof song.artist === "string" &&
    typeof song.tag === "string" &&
    typeof song.coverTone === "string"
  );
}

function loadPickedSongs() {
  try {
    const stored = window.localStorage.getItem(PICKED_SONGS_STORAGE_KEY);

    if (stored == null) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isSongRecommendation);
  } catch {
    return [];
  }
}

function savePickedSongs(songs: SongRecommendation[]) {
  try {
    window.localStorage.setItem(PICKED_SONGS_STORAGE_KEY, JSON.stringify(songs));
  } catch {
    // Persisting is best-effort; blocked storage should not break recommendations.
  }
}

function useBottomBannerAd() {
  const bannerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isSupported(() => TossAds.initialize.isSupported())) {
      return;
    }

    let attached: { destroy: () => void } | undefined;

    try {
      TossAds.initialize({
        callbacks: {
          onInitialized: () => {
            if (!bannerRef.current) return;

            try {
              attached = TossAds.attachBanner(BANNER_AD_GROUP_ID, bannerRef.current, {
                theme: "auto",
                tone: "blackAndWhite",
                variant: "expanded",
              });
            } catch {
              attached = undefined;
            }
          },
        },
      });
    } catch {
      attached = undefined;
    }

    return () => {
      try {
        attached?.destroy();
        TossAds.destroyAll();
      } catch {
        // Ignore ad cleanup errors so the app screen remains stable.
      }
    };
  }, []);

  return { bannerRef };
}

function useInterstitialAd() {
  const [isLoaded, setIsLoaded] = useState(false);

  const loadAd = () => {
    if (!isSupported(() => loadFullScreenAd.isSupported())) {
      setIsLoaded(false);
      return;
    }

    try {
      loadFullScreenAd({
        options: {
          adGroupId: FULLSCREEN_AD_GROUP_ID,
        },
        onEvent: (event) => {
          if (event.type === "loaded") {
            setIsLoaded(true);
          }
        },
        onError: () => {
          setIsLoaded(false);
        },
      });
    } catch {
      setIsLoaded(false);
    }
  };

  useEffect(() => {
    loadAd();
  }, []);

  const showAdIfPossible = () => {
    if (!isLoaded || !isSupported(() => showFullScreenAd.isSupported())) {
      return;
    }

    try {
      showFullScreenAd({
        options: {
          adGroupId: FULLSCREEN_AD_GROUP_ID,
        },
        onEvent: (event) => {
          if (event.type === "dismissed" || event.type === "failedToShow") {
            setIsLoaded(false);
            loadAd();
          }
        },
        onError: () => {
          setIsLoaded(false);
          loadAd();
        },
      });
    } catch {
      setIsLoaded(false);
      loadAd();
    }
  };

  return { showAdIfPossible };
}

function App() {
  const [loading, setLoading] = useState(false);
  const [pickedSongs, setPickedSongs] = useState<SongRecommendation[]>(loadPickedSongs);
  const [recommendCount, setRecommendCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const { bannerRef } = useBottomBannerAd();
  const { showAdIfPossible } = useInterstitialAd();

  useEffect(() => {
    savePickedSongs(pickedSongs);
  }, [pickedSongs]);

  const visibleSongs = useMemo(
    () => (expanded ? pickedSongs : pickedSongs.slice(0, 2)),
    [expanded, pickedSongs],
  );

  const hasHiddenSongs = pickedSongs.length > 2;

  const recommendSong = () => {
    setLoading(true);

    window.setTimeout(() => {
      const pickedSongKeys = new Set(
        pickedSongs.map((song) => `${song.title}-${song.artist}`),
      );
      const source = SONGS.filter(
        (candidate) => !pickedSongKeys.has(`${candidate.title}-${candidate.artist}`),
      );

      if (source.length === 0) {
        setLoading(false);
        return;
      }

      const next = source[Math.floor(Math.random() * source.length)];
      const nextCount = recommendCount + 1;

      setPickedSongs((prev) => [next, ...prev]);
      setRecommendCount(nextCount);
      setLoading(false);

      if (nextCount % 2 === 0) {
        showAdIfPossible();
      }
    }, 500);
  };

  const shareSong = async (song: SongRecommendation) => {
    const text = `J-pop recommendation: ${song.title} - ${song.artist}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "J-pop recommendation",
          text,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        window.alert("Copied song info.");
        return;
      }

      window.prompt("Copy this text to share.", text);
    } catch {
      window.alert("Share failed. Please try again.");
    }
  };

  return (
    <div className="page">
      <header className="hero">
        <Top title={<Top.TitleParagraph size={24}>J-pop 노래추천</Top.TitleParagraph>} />
      </header>

      <section className="panel">
        {pickedSongs.length > 0 ? (
          <>
            <div className="songList">
              {visibleSongs.map((song, index) => (
                <article className="songCard" key={`${song.title}-${song.artist}-${index}`}>
                  <div className="songRow">
                    <div className="songMain">
                      <div className={`songCover songCover-${song.coverTone}`} aria-hidden="true">
                        <span>{song.title.slice(0, 1)}</span>
                      </div>

                      <div className="songInfo">
                        <p className="songTag">{song.tag}</p>
                        <h2 className="songTitle">{song.title}</h2>
                        <p className="songArtist">{song.artist}</p>
                      </div>
                    </div>

                    <Button variant="weak" size="small" onClick={() => shareSong(song)}>
                      공유
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            {hasHiddenSongs ? (
              <div className="listToggle">
                <Button variant="weak" display="block" onClick={() => setExpanded((prev) => !prev)}>
                  {expanded ? "목록 접기" : `더 보기 (${pickedSongs.length - 2})`}
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="emptyCard">
            <p className="emptyTitle">아직 추천받은 노래가 없어요</p>
          </div>
        )}
      </section>

      <section className="panel actionPanel">
        <p className="actionTitle">한 곡 바로 추천받기</p>

        <Button display="block" size="xlarge" loading={loading} onClick={recommendSong}>
          추천받기
        </Button>
      </section>

      <section className="panel adPanel">
        <div className="bannerShell">
          <div ref={bannerRef} className="bannerSlot" />
        </div>
      </section>
    </div>
  );
}

export default App;
